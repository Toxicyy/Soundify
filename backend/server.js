import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import multer from "multer";
import connectDB from "./config/db.js";
import User from "./models/User.model.js";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 5000;
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

connectDB();

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

  const token = jwt.sign({ email }, "secret", { expiresIn: "7d" });

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid password" });
  } else {
    return res.status(200).json({ message: "Login successful", tokenInfo: {token: token, expires: new Date().getTime() + 7 * 24 * 60 * 60 * 1000 } });
  }
});
