import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import multer from "multer";
import connectDB from "./config/db.js";
import User from "./models/User.model.js";
import jwt from "jsonwebtoken";
import B2 from "backblaze-b2";
import Track from "./models/Track.model.js";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

connectDB();

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB лимит
  },
});

const b2 = new B2({
  applicationKeyId: process.env.B2_ACCOUNT_ID,
  applicationKey: process.env.B2_SECRET_KEY,
});

async function uploadToB2(file, folder = "") {
  await b2.authorize();
  const fileName = `${folder}${Date.now()}-${file.originalname}`;
  const uploadUrl = await b2.getUploadUrl({
    bucketId: process.env.B2_BUCKET_ID,
  });

  const response = await b2.uploadFile({
    uploadUrl: uploadUrl.data.uploadUrl,
    uploadAuthToken: uploadUrl.data.authorizationToken,
    fileName,
    data: file.buffer,
  });

  return `https://f003.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${fileName}`;
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.post("/auth/registration", async (req, res) => {
  const { email, password, name, username } = req.body;

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  if (!email || !password || !name || !username) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existingUserByEmail = await User.findOne({ email });
  if (existingUserByEmail) {
    return res.status(400).json({ message: "Email already exists" });
  }
  const existingUserByUsername = await User.findOne({ username });
  if (existingUserByUsername) {
    return res.status(400).json({ message: "Username already exists" });
  }

  const user = new User({
    email,
    password: hash,
    name,
    username,
    status: "USER",
  });

  try {
    await user.save();
    return res.status(201).json({ message: "User created" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "7d" });

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid password" });
  } else {
    return res.status(200).json({
      message: "Login successful",
      tokenInfo: {
        token: token,
        expires: new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
      },
    });
  }
});

app.get("/auth/get/user", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resUser = {
      name: user.name,
      username: user.username,
      email: user.email,
      status: user.status,
      avatar: user.avatar,
      playlists: user.playlists,
      likedSongs: user.likedSongs,
      likedPlaylists: user.likedPlaylists,
      likedArtists: user.likedArtists,
    };

    return res.status(200).json(resUser);
  } catch (e) {
    if (e.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return res.status(500).json({ message: "Something went wrong" });
  }
});

app.post(
  "/api/tracks",
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("Request body:", req.body);
      console.log("Files received:", req.files);
      
      const { name, artist } = req.body;
      
      // Проверка наличия файлов
      if (!req.files || !req.files.audio || !req.files.cover) {
        return res.status(400).json({ 
          error: "Audio and cover files are required",
          received: req.files 
        });
      }
      
      const audioFile = req.files.audio[0];
      const coverFile = req.files.cover[0];
      
      console.log("Audio file:", audioFile.originalname, audioFile.size);
      console.log("Cover file:", coverFile.originalname, coverFile.size);

      // Проверка наличения обязательных полей
      if (!name || !artist) {
        return res.status(400).json({ 
          error: "Name and artist are required" 
        });
      }

      // Загружаем файлы в B2
      console.log("Uploading to B2...");
      const [audioUrl, coverUrl] = await Promise.all([
        uploadToB2(audioFile, "audio/"),
        uploadToB2(coverFile, "covers/"),
      ]);
      
      console.log("B2 URLs:", { audioUrl, coverUrl });

      // Сохраняем в MongoDB
      const track = new Track({ 
        name, 
        artist, 
        audioUrl, 
        coverUrl,
        listenCount: 0,
        createdAt: new Date()
      });
      
      const savedTrack = await track.save();
      console.log("Track saved to DB:", savedTrack._id);

      res.status(201).json(savedTrack);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ 
        error: "Upload failed", 
        details: error.message 
      });
    }
  }
);

// Роут для получения треков
app.get("/api/tracks", async (req, res) => {
  const tracks = await Track.find();
  res.json(tracks);
});
