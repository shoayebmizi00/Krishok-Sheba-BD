import crypto from 'node:crypto';
import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate } from '../middleware/auth.js';
import { pool } from '../config/db.js';
import { cloudinaryEnabled, databaseUploadsEnabled, uploadImage } from '../middleware/upload.js';

const router = Router();
const allowedFolders = new Set(['crops', 'equipment', 'vehicles', 'profiles', 'payments']);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

function uploadToCloudinary(file, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `krishok-sheba/${folder}`,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(file.buffer);
  });
}

router.get('/files/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT mime_type, file_data FROM uploaded_files WHERE id = ? LIMIT 1',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Image not found' });
    res.setHeader('Content-Type', rows[0].mime_type);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(rows[0].file_data);
  } catch (error) {
    return next(error);
  }
});

router.post('/:folder', authenticate, (req, res, next) => {
  const folder = req.params.folder;
  if (!allowedFolders.has(folder)) {
    return res.status(400).json({ message: 'Invalid upload folder' });
  }
  if (folder === 'crops' && req.user.role !== 'farmer') {
    return res.status(403).json({ message: 'Only farmers can upload crop images.' });
  }
  return next();
}, uploadImage.single('file'), async (req, res, next) => {
  const folder = req.params.folder;
  const requestBaseUrl = `${req.protocol}://${req.get('host')}`;
  if (!req.file) return res.status(400).json({ message: 'Image file is required' });

  try {
    if (cloudinaryEnabled) {
      const result = await uploadToCloudinary(req.file, folder);
      return res.status(201).json({
        file_url: result.secure_url,
        storage: 'cloudinary'
      });
    }

    if (databaseUploadsEnabled) {
      const id = crypto.randomUUID();
      await pool.execute(
        `INSERT INTO uploaded_files (id, owner_id, folder, original_name, mime_type, file_size, file_data)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, req.user.id, folder, req.file.originalname, req.file.mimetype, req.file.size, req.file.buffer]
      );
      return res.status(201).json({
        file_url: `${requestBaseUrl}/api/uploads/files/${id}`,
        storage: 'database'
      });
    }

    return res.status(201).json({
      file_url: `${requestBaseUrl}/uploads/${folder}/${req.file.filename}`,
      storage: 'local',
      warning: process.env.NODE_ENV === 'production'
        ? 'Local Render uploads are temporary. Configure Cloudinary for permanent storage.'
        : undefined
    });
  } catch (error) {
    console.error('[upload.image] Upload failed', {
      requestId: req.id,
      folder,
      code: error.http_code || error.code,
      message: error.message
    });
    return next(error);
  }
});

export default router;
