import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import settingsRoutes from './routes/settings.js';
import messageRoutes from './routes/messages.js';
import mediaRoutes from './routes/media.js';
import Project from './models/Project.js';
import SiteSettings from './models/SiteSettings.js';
import { seedProjects, defaultSettings } from './seedData.js';

const app = express();
const PORT = Number(process.env.PORT || 5000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsPath = path.resolve(__dirname, '../uploads');
const clientDist = path.resolve(__dirname, '../../client/dist');
const allowedOrigins = [
  'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174',
  'https://french-portfolio.vercel.app',
  ...(process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',').map(s => s.trim()) : [])
];
const corsOrigin = (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return callback(null, true);
  return callback(null, false);
};

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      mediaSrc: ["'self'", 'https:', 'blob:'],
      connectSrc: ["'self'"],
      frameSrc: ["'self'", 'https://www.youtube.com', 'https://www.youtube-nocookie.com', 'https://player.vimeo.com']
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(cors({ origin: corsOrigin, credentials: false }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('tiny'));
app.use('/uploads', express.static(uploadsPath, { maxAge: '7d', immutable: true, dotfiles: 'deny' }));

app.use('/api', async (_req, _res, next) => {
  try { await ensureDatabase(); } catch { /* per-route guards respond 503 */ }
  next();
});
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'lobna-portfolio-api', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/media', mediaRoutes);

app.use('/api', (_req, res) => res.status(404).json({ message: 'Route API introuvable.' }));

app.get(/^\/(?!api(?:\/|$)|uploads(?:\/|$)).*/, (_req, res, next) => {
  res.sendFile(path.join(clientDist, 'index.html'), error => { if (error) next(); });
});

app.use((error, _req, res, _next) => {
  if (error?.message?.startsWith('Formats acceptés')) return res.status(400).json({ message: error.message });
  if (error?.name === 'MulterError') {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? `Chaque image doit peser moins de ${Number(process.env.MAX_UPLOAD_MB || 12)} Mo.`
      : error.message;
    return res.status(400).json({ message });
  }
  if (error?.name === 'ValidationError') return res.status(400).json({ message: 'Certaines informations ne sont pas valides.' });
  if (error?.name === 'CastError') return res.status(400).json({ message: 'Identifiant invalide.' });
  console.error('API error:', error?.message || error);
  return res.status(500).json({ message: error?.message || 'Erreur serveur. Réessayez.' });
});

let dbInitPromise = null;

function ensureDatabase() {
  if (process.env.NODE_ENV === 'test') return undefined;
  // Serverless/Atlas drops idle connections: never trust a cached promise when
  // the connection is actually down — reconnect instead of serving 503s.
  if (mongoose.connection.readyState === 1) return dbInitPromise;
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI absent. Le serveur API démarre, mais la base de données et le CMS resteront indisponibles.');
    return undefined;
  }
  dbInitPromise = mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
    .then(async () => {
      console.log('MongoDB connected.');
      if ((await Project.countDocuments()) === 0) {
        await Project.insertMany(seedProjects);
        console.log(`Initial portfolio data inserted (${seedProjects.length} projects).`);
      }
      await SiteSettings.findOneAndUpdate({ key: 'main' }, { $setOnInsert: defaultSettings }, { upsert: true, new: true });
    })
    .catch(error => {
      console.error('MongoDB connection failed:', error.message);
      console.warn('The public site can still render its built-in preview. Configure MONGO_URI to enable persistence and admin actions.');
      dbInitPromise = null;
    });
}

ensureDatabase();

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: corsOrigin, credentials: false }
});
io.use((socket, next) => {
  try {
    const payload = jwt.verify(socket.handshake.auth?.token || '', process.env.JWT_SECRET || '');
    if (payload.role !== 'admin') throw new Error('not admin');
    socket.join('admins');
    return next();
  } catch {
    return next(new Error('unauthorized'));
  }
});
app.set('io', io);
io.on('connection', socket => socket.emit('ready', { adminsRoom: socket.rooms.has('admins') }));

server.listen(PORT, () => {
  console.log(`Portfolio API listening on http://localhost:${PORT}`);
});
