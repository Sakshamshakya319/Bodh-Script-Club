import express from 'express';
import Gallery from '../models/Gallery.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all gallery images
router.get('/', async (req, res) => {
  try {
    const { category, featured } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (featured) query.featured = featured === 'true';
    
    const images = await Gallery.find(query).sort({ order: 1, createdAt: -1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single gallery image
router.get('/:id', async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    res.json(image);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create gallery image (admin only)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const image = new Gallery(req.body);
    await image.save();
    res.status(201).json({ message: 'Image added to gallery', image });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update gallery image (admin only)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const image = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Image updated', image });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete gallery image (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
