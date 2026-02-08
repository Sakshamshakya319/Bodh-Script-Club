import express from 'express';
import Member from '../models/Member.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all members
router.get('/', async (req, res) => {
  try {
    const members = await Member.find().sort({ order: 1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create member (admin only)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const member = new Member(req.body);
    await member.save();
    res.status(201).json({ message: 'Member added', member });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update member (admin only)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Member updated', member });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete member (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.json({ message: 'Member deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
