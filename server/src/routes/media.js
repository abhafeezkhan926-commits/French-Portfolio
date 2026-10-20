import { Router } from 'express';
import mongoose from 'mongoose';
import Media from '../models/Media.js';

const router = Router();

router.get('/:id', async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'MongoDB est indisponible. Configurez MONGO_URI puis relancez le serveur.' });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Média introuvable.' });
    const media = await Media.findById(req.params.id).select('mimetype data');
    if (!media) return res.status(404).json({ message: 'Média introuvable.' });
    res.set('Content-Type', media.mimetype || 'application/octet-stream');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(media.data);
  } catch (error) { next(error); }
});

export default router;
