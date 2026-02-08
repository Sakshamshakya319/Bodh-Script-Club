import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['president', 'vice-president', 'event-coordinator', 'technical-lead', 'developer', 'designer', 'content-writer', 'social-media-manager', 'other'],
    default: 'developer'
  },
  image: String,
  bio: String,
  order: { type: Number, default: 0 },
  github: String,
  linkedin: String,
  twitter: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Member || mongoose.model('Member', memberSchema);
