import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';

const app = express();
const PORT = Number(process.env.PORT || 5010);
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
app.use(cors({ origin: corsOrigin, credentials: false }));
app.use(express.json({ limit: '256kb' }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: corsOrigin, credentials: false } });
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
io.on('connection', socket => socket.emit('ready', { adminsRoom: socket.rooms.has('admins') }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'lobna-realtime', connectedClients: io.engine.clientsCount }));
app.post('/api/notify', (req, res) => {
  if (!process.env.NOTIFY_SECRET || req.header('x-notify-secret') !== process.env.NOTIFY_SECRET) {
    return res.status(401).json({ message: 'Secret invalide.' });
  }
  const message = req.body?.message;
  if (!message?._id) return res.status(400).json({ message: 'Message payload invalide.' });
  io.to('admins').emit('message:new', message);
  return res.json({ ok: true, delivered: io.engine.clientsCount });
});

server.listen(PORT, () => {
  console.log(`Realtime notification service listening on http://localhost:${PORT}`);
});
