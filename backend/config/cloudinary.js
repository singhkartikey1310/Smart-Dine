const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure once on load — dotenv is already loaded by server.js before this runs
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isCloudinaryConfigured = () =>
  !!(process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name');

// ── Cloudinary storage factory ────────────────────────────────────────────────
const createCloudinaryStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `smartdine/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ quality: 'auto' }]
    },
  });

// ── Disk storage fallback ─────────────────────────────────────────────────────
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const fs = require('fs');
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`);
  },
});

const imageFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

// ── Uploader factory ──────────────────────────────────────────────────────────
const createUploader = (folder) => {
  const storage = isCloudinaryConfigured()
    ? createCloudinaryStorage(folder)
    : diskStorage;

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: imageFilter,
  });
};

// ── Named uploaders ───────────────────────────────────────────────────────────
const uploadAvatar = createUploader('avatars');
const uploadFood = createUploader('foods');
const uploadRestaurant = createUploader('restaurants');
const uploadReview = createUploader('reviews');

// ── Delete from Cloudinary ────────────────────────────────────────────────────
const deleteImage = async (publicId) => {
  if (!isCloudinaryConfigured() || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

module.exports = {
  cloudinary,
  uploadAvatar,
  uploadFood,
  uploadRestaurant,
  uploadReview,
  deleteImage,
  isCloudinaryConfigured,
};
