import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  filename: { type: String, default: '' },
  mimetype: { type: String, required: true },
  size: { type: Number, default: 0 },
  data: { type: Buffer, required: true }
}, { timestamps: true, collection: 'media' });

export default mongoose.model('Media', mediaSchema);
