import mongoose from 'mongoose';

const localizedContentSchema = new mongoose.Schema({
  title: { type: String, trim: true, maxlength: 140, default: '' },
  tagline: { type: String, trim: true, maxlength: 220, default: '' },
  description: { type: String, trim: true, maxlength: 1200, default: '' },
  details: { type: String, trim: true, maxlength: 5000, default: '' },
  features: { type: [String], default: [] },
  pricingLabel: { type: String, trim: true, maxlength: 180, default: '' }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
  category: { type: String, enum: ['printer-store', 'travel', 'power-bi', 'sponsorship', 'solar', 'healthcare', 'other'], default: 'other' },
  status: { type: String, enum: ['published', 'draft', 'coming-soon'], default: 'draft' },
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 100 },
  content: {
    fr: { type: localizedContentSchema, default: () => ({}) },
    en: { type: localizedContentSchema, default: () => ({}) },
    pt: { type: localizedContentSchema, default: () => ({}) },
    es: { type: localizedContentSchema, default: () => ({}) }
  },
  technologies: { type: [String], default: [] },
  repositoryUrl: { type: String, trim: true, default: '' },
  documentationUrl: { type: String, trim: true, default: '' },
  demoUrl: { type: String, trim: true, default: '' },
  videoUrl: { type: String, trim: true, default: '' },
  coverImage: { type: String, trim: true, default: '' },
  galleryImages: { type: [String], default: [] }
}, { timestamps: true, minimize: false });

projectSchema.index({ status: 1, featured: -1, order: 1, createdAt: -1 });
export default mongoose.models.Project || mongoose.model('Project', projectSchema);
