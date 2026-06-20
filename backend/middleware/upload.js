import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const allowedFolders = new Set(['crops', 'equipment', 'vehicles', 'profiles']);
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const cloudinaryEnabled = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME
  && process.env.CLOUDINARY_API_KEY
  && process.env.CLOUDINARY_API_SECRET
);
export const databaseUploadsEnabled = process.env.NODE_ENV === 'production' && !cloudinaryEnabled;

const storage = multer.diskStorage({
  destination(req, _file, callback) {
    const folder = allowedFolders.has(req.params.folder) ? req.params.folder : 'crops';
    callback(null, path.join(process.cwd(), 'uploads', folder));
  },
  filename(_req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  }
});

export const uploadImage = multer({
  storage: cloudinaryEnabled || databaseUploadsEnabled ? multer.memoryStorage() : storage,
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 5) * 1024 * 1024 },
  fileFilter(_req, file, callback) {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(new Error('Only JPG, JPEG, PNG, and WebP images are allowed'));
    }
    callback(null, true);
  }
});
