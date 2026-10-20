import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true, maxlength: 120 },
  email: { type: String, trim: true, required: true, lowercase: true, maxlength: 180, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  phone: { type: String, trim: true, maxlength: 40, default: '' },
  subject: { type: String, trim: true, maxlength: 180, default: '' },
  message: { type: String, trim: true, required: true, maxlength: 4000 },
  read: { type: Boolean, default: false }
}, { timestamps: true });

messageSchema.index({ read: 1, createdAt: -1 });
export default mongoose.models.Message || mongoose.model('Message', messageSchema);
