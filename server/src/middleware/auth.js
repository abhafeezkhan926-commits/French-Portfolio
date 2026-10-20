import jwt from 'jsonwebtoken';

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Authentification requise.' });
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32) return res.status(503).json({ message: 'Administration non configurée. Définissez un JWT_SECRET robuste.' });
  try {
    const payload = jwt.verify(token, secret);
    if (payload.role !== 'admin') return res.status(403).json({ message: 'Accès réservé à l’administration.' });
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Session expirée. Reconnectez-vous.' });
  }
}
