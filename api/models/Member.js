import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: [
      'president',
      'vice-president', 
      'event-coordinator',
      'technical-lead',
      'developer',
      'designer',
      'content-writer',
      'social-media-manager',
      'other'
    ]
  },
  image: String,
  github: String,
  linkedin: String,
  twitter: String,
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Member', memberSchema);
