import express from 'express';
import About from '../models/About.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get about content
router.get('/', async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) {
      about = new About({});
      await about.save();
    }
    res.json(about);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update about content (admin only)
router.put('/', authenticate, isAdmin, async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) {
      about = new About(req.body);
    } else {
      Object.assign(about, req.body);
      about.updatedAt = Date.now();
    }
    await about.save();
    res.json({ message: 'About content updated', about });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
