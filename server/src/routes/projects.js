import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
const routeDir = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(routeDir, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 12);
// The Cloudinary SDK parses CLOUDINARY_URL at import time and throws on malformed
// values, which would crash the whole serverless function — so import it lazily
// only when the value looks valid.
const cloudinaryUrl = String(process.env.CLOUDINARY_URL || '').trim();
const cloudinaryEnabled = cloudinaryUrl.startsWith('cloudinary://');
const cloudinaryConfigError = process.env.CLOUDINARY_URL && !cloudinaryEnabled
  ? "CLOUDINARY_URL est invalide : la valeur doit commencer par cloudinary:// (sans préfixe CLOUDINARY_URL=). Recopiez la variable d'environnement depuis les réglages Cloudinary (Settings > API Keys)."
  : null;
let cloudinary = null;
async function loadCloudinary() {
  cloudinary ??= (await import('cloudinary')).v2;
  cloudinary.config({ secure: true });
  return cloudinary;
}

async function storeFile(file) {
  if (cloudinaryEnabled) {
    try {
      const sdk = await loadCloudinary();
      const result = await new Promise((resolve, reject) => {
        const stream = sdk.uploader.upload_stream({ folder: 'lobna-portfolio', resource_type: 'image' }, (error, uploaded) => {
          if (!error) return resolve(uploaded);
          const httpCode = error.http_code ? ` (${error.http_code})` : '';
          const hint = [401, 403].includes(error.http_code)
            ? ' — clé API, secret ou cloud name invalide : recopiez CLOUDINARY_URL depuis les réglages Cloudinary (Settings > API Keys)'
            : ` — ${error.message}`;
          reject(new Error(`Cloudinary: upload refusé${httpCode}${hint}`));
        });
        stream.end(file.buffer);
      });
      return result.secure_url;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Cloudinary:')) throw error;
      throw new Error('Cloudinary: CLOUDINARY_URL est invalide. La valeur doit ressembler à cloudinary://<api_key>:<api_secret>@<cloud_name> — recopiez-la depuis les réglages Cloudinary (Settings > API Keys).');
    }
  }
  const ext = path.extname(file.originalname || '').toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 10);
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  try {
    fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
  } catch (error) {
    if (error?.code === 'EROFS') throw new Error(cloudinaryConfigError || "Cloudinary n'est pas configuré : ajoutez CLOUDINARY_URL dans les variables d'environnement Vercel pour activer l'upload des images.");
    throw error;
  }
  return `/uploads/${filename}`;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadMb * 1024 * 1024, files: 9 },
  fileFilter: (_req, file, cb) => {
    const valid = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'].includes(file.mimetype);
    cb(valid ? null : new Error('Formats acceptés : JPG, PNG, WEBP, AVIF ou GIF.'), valid);
  }
});
const mediaFields = upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'galleryImages', maxCount: 8 }]);
const isHttpUrl = value => !value || (typeof value === 'string' && /^https?:\/\//i.test(value));
const optionalUrlFields = ['repositoryUrl', 'documentationUrl', 'demoUrl', 'videoUrl'];

async function parseBody(body, files, existing = {}) {
  const next = { ...body };
  for (const field of ['content', 'technologies', 'galleryImages']) {
    if (typeof next[field] === 'string') {
      try { next[field] = JSON.parse(next[field]); } catch { throw new Error(`Le champ ${field} doit contenir des données valides.`); }
    }
  }
  for (const field of optionalUrlFields) {
    if (next[field] != null && !isHttpUrl(next[field])) throw new Error(`Le lien ${field} doit commencer par http:// ou https://.`);
  }
  if (typeof next.slug === 'string') next.slug = next.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (typeof next.featured === 'string') next.featured = next.featured === 'true';
  if (typeof next.order === 'string') next.order = Number(next.order || 100);
  if (typeof next.content === 'string') next.content = JSON.parse(next.content);
  if (Array.isArray(next.technologies)) next.technologies = next.technologies.map(String).map(s => s.trim()).filter(Boolean).slice(0, 30);
  const uploadedCover = files?.coverImage?.[0];
  const uploadedGallery = files?.galleryImages || [];
  const submittedCover = Object.prototype.hasOwnProperty.call(next, 'coverImage') ? String(next.coverImage || '') : String(existing.coverImage || '');
  next.coverImage = uploadedCover ? await storeFile(uploadedCover) : submittedCover;
  const oldGallery = Array.isArray(next.galleryImages) ? next.galleryImages : existing.galleryImages || [];
  next.galleryImages = [...oldGallery, ...(await Promise.all(uploadedGallery.map(storeFile)))].slice(0, 12);
  return next;
}

router.get('/', async (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'MongoDB est indisponible. Configurez MONGO_URI puis relancez le serveur.' });
  try {
    const projects = await Project.find({ status: { $in: ['published', 'coming-soon'] } }).sort({ order: 1, createdAt: -1 }).lean();
    res.json({ projects });
  } catch (error) { next(error); }
});

router.get('/admin/all', requireAdmin, async (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'MongoDB est indisponible. Configurez MONGO_URI puis relancez le serveur.' });
  try {
    const projects = await Project.find().sort({ order: 1, createdAt: -1 }).lean();
    res.json({ projects });
  } catch (error) { next(error); }
});

router.post('/', requireAdmin, (req, res, next) => mediaFields(req, res, async error => {
  if (error) return next(error);
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'MongoDB est indisponible.' });
  try {
    const data = await parseBody(req.body, req.files);
    if (!data.slug) return res.status(400).json({ message: 'Le slug du projet est obligatoire.' });
    if (!data.content?.fr?.title?.trim()) return res.status(400).json({ message: 'Le titre français du projet est obligatoire.' });
    const project = await Project.create(data);
    res.status(201).json({ project });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Ce slug est déjà utilisé. Choisissez un autre slug.' });
    next(err);
  }
}));

router.put('/:id', requireAdmin, (req, res, next) => mediaFields(req, res, async error => {
  if (error) return next(error);
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'MongoDB est indisponible.' });
  try {
    const current = await Project.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Projet introuvable.' });
    const data = await parseBody(req.body, req.files, current.toObject());
    if (!data.slug) return res.status(400).json({ message: 'Le slug du projet est obligatoire.' });
    if (!data.content?.fr?.title?.trim()) return res.status(400).json({ message: 'Le titre français du projet est obligatoire.' });
    Object.assign(current, data);
    await current.save();
    res.json({ project: current });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Ce slug est déjà utilisé. Choisissez un autre slug.' });
    next(err);
  }
}));

router.delete('/:id', requireAdmin, async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'MongoDB est indisponible.' });
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Projet introuvable.' });
    res.json({ message: 'Projet supprimé.' });
  } catch (error) { next(error); }
});

export default router;
