const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile } = require('../controllers/uploadController');
const authenticate = require('../middlewares/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', authenticate, upload.single('file'), uploadFile);

module.exports = router;










// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const { v2: cloudinary } = require("cloudinary");
// const streamifier = require("streamifier");
// const dotenv = require("dotenv");

// dotenv.config();

// // Configure Cloudinary with your credentials
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const storage = multer.memoryStorage(); // store file buffer in memory
// const upload = multer({ storage });

// router.post("/", upload.single("file"), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: "No file uploaded" });
//   }

//   try {
//     // Upload buffer to Cloudinary via stream
//     const streamUpload = (buffer) => {
//       return new Promise((resolve, reject) => {
//         const stream = cloudinary.uploader.upload_stream(
//           { folder: "chat_uploads" },
//           (error, result) => {
//             if (result) resolve(result);
//             else reject(error);
//           }
//         );
//         streamifier.createReadStream(buffer).pipe(stream);
//       });
//     };

//     const result = await streamUpload(req.file.buffer);

//     // Send back JSON with file URL
//     res.json({ url: result.secure_url, filename: req.file.originalname });
//   } catch (err) {
//     console.error("Cloudinary upload error:", err);
//     res.status(500).json({ error: "Upload failed" });
//   }
// });

// module.exports = router;
