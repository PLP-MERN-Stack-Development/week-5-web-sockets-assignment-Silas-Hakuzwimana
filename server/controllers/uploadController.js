const File = require('../models/fileModel');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const dotenv = require('dotenv');


// Load environment variables from .env file
dotenv.config();


// Optional: load from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "chat_uploads" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req.file.buffer);

    const fileDoc = await File.create({
      filename: req.file.originalname,
      url: result.secure_url,
      uploader: req.user?._id || null // Only works if auth middleware sets req.user
    });

    res.status(200).json({
      url: fileDoc.url,
      filename: fileDoc.filename,
      uploader: req.user?.username || 'Anonymous'
    });
  } catch (err) {
  console.error("Cloudinary upload error:", err.message);
  console.error(err.stack);
  res.status(500).json({ error: "Upload failed", details: err.message });
}
};

module.exports = {
  uploadFile,
};
