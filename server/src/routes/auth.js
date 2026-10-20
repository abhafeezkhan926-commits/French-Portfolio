import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' } });
let cachedPasswordHash;

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const configuredPassword = process.env.ADMIN_PASSWORD || '';
    if (!adminEmail || !configuredPassword || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return res.status(503).json({ message: 'Configurez ADMIN_EMAIL, ADMIN_PASSWORD et un JWT_SECRET solide dans server/.env.' });
    }
    if (!cachedPasswordHash) cachedPasswordHash = await bcrypt.hash(configuredPassword, 12);
    const emailMatches = email.length === adminEmail.length && email === adminEmail;
    const passwordMatches = await bcrypt.compare(password, cachedPasswordHash);
    if (!emailMatches || !passwordMatches) return res.status(401).json({ message: 'Adresse e-mail ou mot de passe incorrect.' });
    const token = jwt.sign({ role: 'admin', email: adminEmail }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    return res.json({ token, admin: { email: adminEmail, role: 'admin' }, expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  } catch (error) {
    console.error('Admin login error:', error.message);
    return res.status(500).json({ message: 'Connexion impossible pour le moment.' });
  }
});

export default router;
