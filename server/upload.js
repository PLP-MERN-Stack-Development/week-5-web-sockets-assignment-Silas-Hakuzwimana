const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'chatflow_uploads',
    resource_type: 'auto',
  },
});

const upload = multer({ storage });

module.exports = upload;
