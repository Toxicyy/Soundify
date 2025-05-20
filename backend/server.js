import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer from 'multer';
import connectDB from './config/db.js';

const app = express()
const PORT = process.env.PORT || 5000
const upload = multer({ dest: 'uploads/' })

app.use(cors())
app.use(express.json())

connectDB()

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
