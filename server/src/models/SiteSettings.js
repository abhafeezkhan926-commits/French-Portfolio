import mongoose from 'mongoose';

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'main' },
  contactEmail: { type: String, trim: true, default: 'contact@lobna-maalej.com' },
  whatsapp: { type: String, trim: true, default: '' },
  linkedinUrl: { type: String, trim: true, default: '' },
  githubUrl: { type: String, trim: true, default: 'https://github.com/lobna8maalej' },
  location: { type: String, trim: true, default: 'Tunisie · Disponible à l’international' },
  responseNote: { type: String, trim: true, default: 'Réponse sous 1 à 2 jours ouvrés' },
  availability: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema);
