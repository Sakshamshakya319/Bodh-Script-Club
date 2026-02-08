import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  registrationNumber: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  whatsapp: { type: String, required: true },
  course: { type: String, required: true },
  section: { type: String, required: true },
  year: { type: String, required: true },
  batch: { type: String, required: true },
  github: String,
  photo: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Submission', submissionSchema);
