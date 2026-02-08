import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: Date,
  time: String,
  location: String,
  image: String,
  tags: [String],
  status: { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' },
  maxAttendees: Number,
  registrationCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Event || mongoose.model('Event', eventSchema);
