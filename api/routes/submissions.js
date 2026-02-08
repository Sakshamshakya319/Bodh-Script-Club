import express from 'express';
import xlsx from 'xlsx';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Submission from '../models/Submission.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/submissions';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 }, // 1MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed!'));
    }
  }
});

// Check if registration number exists (MUST be before POST /)
router.get('/check/:registrationNumber', async (req, res) => {
  try {
    console.log('Checking registration number:', req.params.registrationNumber);
    const existing = await Submission.findOne({ 
      registrationNumber: req.params.registrationNumber 
    });
    console.log('Registration exists:', !!existing);
    res.json({ exists: !!existing });
  } catch (error) {
    console.error('Check registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export to Excel (admin only) - MUST be before GET /
router.get('/export', authenticate, isAdmin, async (req, res) => {
  try {
    const submissions = await Submission.find();
    
    const data = submissions.map(sub => ({
      Name: sub.name,
      Email: sub.email,
      'Registration Number': sub.registrationNumber,
      Phone: sub.phone,
      WhatsApp: sub.whatsapp,
      Course: sub.course,
      Section: sub.section,
      Year: sub.year,
      Batch: sub.batch,
      GitHub: sub.github || 'N/A',
      Status: sub.status,
      'Submitted At': sub.createdAt.toLocaleDateString()
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Submissions');
    
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename=submissions.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all submissions (admin only)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit join form (no auth required)
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    console.log('Received submission request');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'registrationNumber', 'phone', 'whatsapp', 'course', 'section', 'year', 'batch'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }
    
    // Check if registration number already exists
    const existing = await Submission.findOne({ 
      registrationNumber: req.body.registrationNumber 
    });
    
    if (existing) {
      console.log('Registration number already exists:', req.body.registrationNumber);
      return res.status(400).json({ 
        message: 'Registration number already exists',
        exists: true 
      });
    }

    const submissionData = {
      ...req.body,
      photo: req.file ? `/uploads/submissions/${req.file.filename}` : null
    };

    console.log('Creating submission with data:', submissionData);
    const submission = new Submission(submissionData);
    await submission.save();
    
    console.log('Submission saved successfully:', submission._id);
    res.status(201).json({ message: 'Submission successful', submission });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update submission status (admin only)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json({ message: 'Status updated', submission });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
