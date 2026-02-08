import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  registrationNumber: { type: String, required: true },
  phone: String,
  whatsapp: String,
  course: String,
  section: String,
  year: String,
  batch: String,
  github: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Submission || mongoose.model('Submission', submissionSchema);
