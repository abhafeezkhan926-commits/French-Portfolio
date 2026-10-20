import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
const messageLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 6, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Trop de messages envoyés. Réessayez dans 10 minutes.' } });
const dbOffline = res => mongoose.connection.readyState !== 1 ? (res.status(503).json({ message: 'MongoDB est indisponible. Configurez MONGO_URI puis relancez le serveur.' }), true) : false;

router.post('/', messageLimiter, async (req, res, next) => {
  try {
    if (dbOffline(res)) return;
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim();
    const subject = String(req.body?.subject || '').trim();
    const message = String(req.body?.message || '').trim();
    if (!name || name.length > 120) return res.status(400).json({ message: 'Le nom est obligatoire (120 caractères max.).' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Adresse e-mail invalide.' });
    if (!message || message.length > 4000) return res.status(400).json({ message: 'Le message est obligatoire (4000 caractères max.).' });
    const created = await Message.create({ name, email, phone, subject, message });
    req.app.get('io')?.to('admins').emit('message:new', created.toObject());
    return res.status(201).json({ message: created });
  } catch (error) { next(error); }
});

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    if (dbOffline(res)) return;
    const messages = await Message.find().sort({ createdAt: -1 }).limit(100).lean();
    const unread = await Message.countDocuments({ read: false });
    return res.json({ messages, unread });
  } catch (error) { next(error); }
});

router.patch('/read-all', requireAdmin, async (req, res, next) => {
  try {
    if (dbOffline(res)) return;
    await Message.updateMany({ read: false }, { $set: { read: true } });
    return res.json({ ok: true });
  } catch (error) { next(error); }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    if (dbOffline(res)) return;
    const deleted = await Message.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Message introuvable.' });
    return res.json({ ok: true });
  } catch (error) { next(error); }
});

export default router;
