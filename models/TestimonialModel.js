import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: String,
  message: { type: String, required: true },
  rating: { type: Number, default: 5 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Testimonial || mongoose.model('Testimonial', testimonialSchema);
