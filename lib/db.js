// Professional MongoDB connection for Vercel serverless
import mongoose from 'mongoose';

// Do NOT throw at module load - Vercel may load the module before env is available.
// Check inside connectDB() so the function can run and return a clear error.

// Global cache for connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI || typeof MONGODB_URI !== 'string' || !MONGODB_URI.trim()) {
    throw new Error('MONGODB_URI environment variable is not set. Add it in Vercel Project Settings → Environment Variables.');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(MONGODB_URI.trim(), opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}