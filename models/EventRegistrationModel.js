import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true },
  registrationNo: String,
  phoneNumber: String,
  whatsappNumber: String,
  section: String,
  department: String,
  year: String,
  course: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Team registration fields (for hackathons)
  isTeamRegistration: { type: Boolean, default: false },
  teamName: String,
  teamMembers: [{
    name: String,
    registrationNo: String,
    phoneNumber: String,
    course: String
  }],
  
  // Payment fields
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'free'], default: 'free' },
  
  registeredAt: { type: Date, default: Date.now }
});

// Professional Indexing for Vercel/Production
// 1. One user per event (sparse allows guests to register multiple times if user is null)
registrationSchema.index({ event: 1, user: 1 }, { unique: true, sparse: true });

// 2. One registration number per event (prevent same student registering twice)
registrationSchema.index({ event: 1, registrationNo: 1 }, { unique: true });

export default mongoose.models.EventRegistration || mongoose.model('EventRegistration', registrationSchema);
