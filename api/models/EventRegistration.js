import mongoose from 'mongoose';

const eventRegistrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Registration Details
  name: { type: String, required: true },
  registrationNo: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  whatsappNumber: { type: String, required: true },
  section: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  
  // Metadata
  registeredAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' }
});

// Prevent duplicate registrations
eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

export default mongoose.model('EventRegistration', eventRegistrationSchema);
