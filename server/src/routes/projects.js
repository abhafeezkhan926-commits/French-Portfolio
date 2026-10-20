import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import Project from '../models/Project.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
const routeDir = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(routeDir, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 12);
const cloudinaryEnabled = Boolean(process.env.CLOUDINARY_URL);
if (cloudinaryEnabled) cloudinary.config({ secure: true });

async function storeFile(file) {
  if (cloudinaryEnabled) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'lobna-portfolio', resource_type: 'image' }, (error, uploaded) => error ? reject(error) : resolve(uploaded));
      stream.end(file.buffer);
    });
    return result.secure_url;
  }
  const ext = path.extname(file.originalname || '').toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 10);
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  try {
    fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
  } catch (error) {
    if (error?.code === 'EROFS') throw new Error("Cloudinary n'est pas configuré : ajoutez CLOUDINARY_URL dans les variables d'environnement Vercel pour activer l'upload des images.");
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
