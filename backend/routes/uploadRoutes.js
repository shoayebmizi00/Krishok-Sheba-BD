import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate } from '../middleware/auth.js';
import { cloudinaryEnabled, uploadImage } from '../middleware/upload.js';

const router = Router();
const allowedFolders = new Set(['crops', 'equipment', 'vehicles', 'profiles']);

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
  if (!req.file) return res.status(400).json({ message: 'Image file is required' });

  try {
    if (cloudinaryEnabled) {
      const result = await uploadToCloudinary(req.file, folder);
      return res.status(201).json({
        file_url: result.secure_url,
        storage: 'cloudinary'
      });
    }

    const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
    return res.status(201).json({
      file_url: `${baseUrl}/uploads/${folder}/${req.file.filename}`,
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
