// Professional User model for Vercel serverless (bcryptjs = pure JS, no native bindings)
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isAdmin: { type: Boolean, default: false },
  registrationNumber: String,
  stream: String,
  session: String,
  phone: String,
  section: String,
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving (bcryptjs compatible with existing bcrypt hashes)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method (works with both bcrypt and bcryptjs hashes)
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Prevent re-compilation in serverless environment
export default mongoose.models.User || mongoose.model('User', userSchema);