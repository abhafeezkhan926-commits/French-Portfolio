import { Router } from 'express';
import mongoose from 'mongoose';
import SiteSettings from '../models/SiteSettings.js';
import { requireAdmin } from '../middleware/auth.js';
import { defaultSettings } from '../seedData.js';

const router = Router();
const allowed = ['contactEmail', 'whatsapp', 'linkedinUrl', 'githubUrl', 'location', 'responseNote', 'availability'];
const urlValid = value => !value || /^https?:\/\//i.test(value);

router.get('/', async (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'MongoDB indisponible.' });
  try {
    const settings = await SiteSettings.findOne({ key: 'main' }).lean();
    res.json({ settings: settings || defaultSettings });
  } catch (error) { next(error); }
});

router.put('/', requireAdmin, async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'MongoDB indisponible.' });
  try {
    const updates = {};
    for (const key of allowed) if (req.body?.[key] !== undefined) updates[key] = req.body[key];
    for (const key of ['linkedinUrl', 'githubUrl']) {
      if (!urlValid(updates[key])) return res.status(400).json({ message: `${key} doit être une URL http(s) valide.` });
    }
    if (updates.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.contactEmail)) {
      return res.status(400).json({ message: 'Adresse e-mail invalide.' });
    }
    const settings = await SiteSettings.findOneAndUpdate({ key: 'main' }, { $set: updates, $setOnInsert: { key: 'main' } }, { new: true, upsert: true, runValidators: true });
    res.json({ settings });
  } catch (error) { next(error); }
});

export default router;
