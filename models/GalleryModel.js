import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  category: { type: String, required: true, default: 'events' },
  eventDate: Date,
  coverImage: String, // Optional - will use first image from images array if not provided
  images: { 
    type: [String], 
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length > 0 && arr.length <= 20;
      },
      message: 'Gallery must have between 1 and 20 images'
    }
  },
  description: String,
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to set coverImage if not provided
gallerySchema.pre('save', function(next) {
  if (!this.coverImage && this.images && this.images.length > 0) {
    this.coverImage = this.images[0];
  }
  next();
});

export default mongoose.models.Gallery || mongoose.model('Gallery', gallerySchema);
