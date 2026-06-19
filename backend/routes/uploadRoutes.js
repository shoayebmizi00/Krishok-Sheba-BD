import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';

const router = Router();

router.post('/:folder', authenticate, uploadImage.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Image file is required' });
  const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  res.status(201).json({
    file_url: `${baseUrl}/uploads/${req.params.folder}/${req.file.filename}`
  });
});

export default router;
