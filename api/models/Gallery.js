import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  eventDate: { type: Date, required: true },
  description: String,
  category: { type: String, enum: ['event', 'workshop', 'hackathon', 'meetup', 'other'], default: 'other' },
  
  // Multiple images support
  images: [{
    url: { type: String, required: true },
    caption: String,
    order: { type: Number, default: 0 }
  }],
  
  // Cover image (one of the images array, stored as index)
  coverImageIndex: { type: Number, default: 0 },
  
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Virtual to get cover image URL
gallerySchema.virtual('coverImage').get(function() {
  if (this.images && this.images.length > 0) {
    return this.images[this.coverImageIndex]?.url || this.images[0].url;
  }
  return null;
});

// Ensure virtuals are included in JSON
gallerySchema.set('toJSON', { virtuals: true });
gallerySchema.set('toObject', { virtuals: true });

export default mongoose.model('Gallery', gallerySchema);
