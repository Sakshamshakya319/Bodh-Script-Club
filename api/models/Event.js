import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: String,
  location: String,
  image: String,
  tags: [String],
  maxAttendees: Number,
  status: { type: String, enum: ['upcoming', 'previous'], default: 'upcoming' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Event', eventSchema);
