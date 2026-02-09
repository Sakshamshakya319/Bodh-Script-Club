// Consolidated API handler for all routes
import connectDB from '../lib/db.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Import all models
import User from '../models/UserModel.js';
import Event from '../models/EventModel.js';
import EventRegistration from '../models/EventRegistrationModel.js';
import Gallery from '../models/GalleryModel.js';
import Member from '../models/MemberModel.js';
import Submission from '../models/SubmissionModel.js';
import Testimonial from '../models/TestimonialModel.js';
import Payment from '../models/PaymentModel.js';

import jwt from 'jsonwebtoken';

// Initialize Razorpay
let razorpay;
try {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (keyId && keySecret) {
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    console.log('✅ Razorpay initialized in index.js');
  }
} catch (error) {
  console.error('❌ Razorpay init failed:', error.message);
}

// CORS headers helper
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Auth middleware
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }
  
  const token = authHeader.substring(7);
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Route handlers
const handlers = {
  // Health check
  'GET /health': async (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      nodeVersion: process.version,
      vercel: true,
      message: 'Consolidated API is working'
    });
  },

  // Create admin
  'POST /create-admin': async (req, res) => {
    await connectDB();
    
    const adminData = {
      name: 'Admin',
      email: 'admin@bodhscriptclub.com',
      password: 'Admin@123!',
      role: 'admin',
      isAdmin: true,
      registrationNumber: 'ADMIN001',
      stream: 'Administration',
      session: '2024-25',
      phone: '+91-9999999999',
      section: 'ADMIN'
    };

    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      const passwordMatch = await existingAdmin.comparePassword('Admin@123!');
      return res.status(200).json({
        status: 'exists',
        message: 'Admin user already exists',
        admin: {
          email: existingAdmin.email,
          name: existingAdmin.name,
          role: existingAdmin.role,
          isAdmin: existingAdmin.isAdmin,
          createdAt: existingAdmin.createdAt
        },
        passwordTest: passwordMatch ? 'PASS' : 'FAIL',
        credentials: {
          email: 'admin@bodhscriptclub.com',
          password: 'Admin@123!'
        }
      });
    }

    const admin = new User(adminData);
    await admin.save();

    res.status(201).json({
      status: 'created',
      message: 'Admin user created successfully',
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isAdmin: admin.isAdmin,
        createdAt: admin.createdAt
      },
      credentials: {
        email: 'admin@bodhscriptclub.com',
        password: 'Admin@123!'
      }
    });
  },

  // Auth - Signup
  'POST /auth/signup': async (req, res) => {
    await connectDB();
    
    try {
      const { name, email, password } = req.body;
      
      // Validation
      if (!name || !email || !password) {
        return res.status(400).json({
          message: 'Name, email, and password are required',
          error: 'MISSING_FIELDS'
        });
      }

      // Password strength validation
      if (password.length < 6) {
        return res.status(400).json({
          message: 'Password must be at least 6 characters long',
          error: 'WEAK_PASSWORD'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return res.status(400).json({
          message: 'Email already registered',
          error: 'EMAIL_EXISTS'
        });
      }

      // Create new user
      const user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password,
        role: 'user',
        isAdmin: false,
        createdAt: new Date()
      });

      await user.save();

      // Generate JWT token
      const payload = {
        userId: user._id,
        email: user.email,
        role: user.role,
        isAdmin: false
      };

      const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '7d',
        algorithm: 'HS256'
      });

      res.status(201).json({
        message: 'Account created successfully',
        accessToken,
        tokenType: 'Bearer',
        expiresIn: '7d',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isAdmin: false
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(400).json({
          message: 'Email already registered',
          error: 'EMAIL_EXISTS'
        });
      }
      
      res.status(500).json({
        message: 'Failed to create account',
        error: error.message
      });
    }
  },

  // Auth - Login
  'POST /auth/login': async (req, res) => {
    await connectDB();
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
        error: 'MISSING_CREDENTIALS'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      isAdmin: user.role === 'admin' || user.isAdmin
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d',
      algorithm: 'HS256'
    });

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      tokenType: 'Bearer',
      expiresIn: '7d',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.role === 'admin' || user.isAdmin
      }
    });
  },

  // Auth - Me
  'GET /auth/me': async (req, res) => {
    await connectDB();
    
    const decoded = verifyToken(req);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.status(200).json({
      message: 'User verified',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.role === 'admin' || user.isAdmin
      }
    });
  },

  // About
  'GET /about': async (req, res) => {
    res.status(200).json({
      title: "About Bodh Script Club",
      description: "We are a community of tech enthusiasts, coders, and innovators dedicated to learning and growing together.",
      mission: "To foster a collaborative environment where students can enhance their programming skills and work on innovative projects.",
      vision: "To become the leading tech community in our institution, inspiring the next generation of developers.",
      values: ["Innovation", "Collaboration", "Learning", "Excellence"],
      founded: "2024",
      members: "50+",
      projects: "25+",
      events: "15+"
    });
  },

  // Events
  'GET /events': async (req, res) => {
    await connectDB();
    
    try {
      const events = await Event.find().sort({ createdAt: -1 });
      res.status(200).json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({
        message: 'Failed to fetch events',
        error: error.message
      });
    }
  },

  // Gallery
  'GET /gallery': async (req, res) => {
    await connectDB();
    
    try {
      const gallery = await Gallery.find().sort({ createdAt: -1 });
      res.status(200).json(gallery);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      res.status(500).json({
        message: 'Failed to fetch gallery',
        error: error.message
      });
    }
  },

  // Members
  'GET /members': async (req, res) => {
    await connectDB();
    
    try {
      const members = await Member.find().sort({ order: 1, createdAt: -1 });
      res.status(200).json(members);
    } catch (error) {
      console.error('Error fetching members:', error);
      res.status(500).json({
        message: 'Failed to fetch members',
        error: error.message
      });
    }
  },

  // Testimonials
  'GET /testimonials': async (req, res) => {
    await connectDB();
    
    try {
      const testimonials = await Testimonial.find({ status: 'approved' })
        .sort({ createdAt: -1 })
        .limit(10);
      
      res.status(200).json(testimonials);
    } catch (error) {
      console.error('Error fetching approved testimonials:', error);
      res.status(500).json({
        message: 'Failed to fetch testimonials',
        error: error.message
      });
    }
  },

  // Submit testimonial
  'POST /testimonials/submit': async (req, res) => {
    await connectDB();
    
    const { name, email, role, message, rating } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({
        message: 'Name, email, and message are required'
      });
    }

    try {
      const testimonial = new Testimonial({
        name,
        email,
        role: role || 'Student',
        message,
        rating: rating || 5,
        status: 'pending',
        createdAt: new Date()
      });

      await testimonial.save();

      res.status(200).json({
        message: 'Testimonial submitted successfully! It will be reviewed before publishing.',
        testimonial: {
          name,
          email,
          role: role || 'Student',
          message,
          rating: rating || 5,
          status: 'pending',
          submittedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error saving testimonial:', error);
      res.status(500).json({
        message: 'Failed to submit testimonial',
        error: error.message
      });
    }
  },

  // Testimonials - Get all (for admin)
  'GET /testimonials/all': async (req, res) => {
    await connectDB();
    
    try {
      const testimonials = await Testimonial.find().sort({ createdAt: -1 });
      res.status(200).json(testimonials);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      res.status(500).json({
        message: 'Failed to fetch testimonials',
        error: error.message
      });
    }
  },

  // Testimonials - Update
  'PUT /testimonials/:id': async (req, res) => {
    await connectDB();
    
    const { id } = req.params;
    const { status } = req.body;
    
    try {
      const testimonial = await Testimonial.findByIdAndUpdate(
        id,
        { status, updatedAt: new Date() },
        { new: true }
      );

      if (!testimonial) {
        return res.status(404).json({ message: 'Testimonial not found' });
      }

      res.status(200).json({
        message: 'Testimonial updated successfully',
        testimonial
      });
    } catch (error) {
      console.error('Error updating testimonial:', error);
      res.status(500).json({
        message: 'Failed to update testimonial',
        error: error.message
      });
    }
  },

  // Testimonials - Delete
  'DELETE /testimonials/:id': async (req, res) => {
    await connectDB();
    
    const { id } = req.params;
    
    try {
      const testimonial = await Testimonial.findByIdAndDelete(id);

      if (!testimonial) {
        return res.status(404).json({ message: 'Testimonial not found' });
      }

      res.status(200).json({
        message: 'Testimonial deleted successfully',
        id
      });
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      res.status(500).json({
        message: 'Failed to delete testimonial',
        error: error.message
      });
    }
  },

  // Submissions - Get all
  'GET /submissions': async (req, res) => {
    await connectDB();
    
    try {
      const submissions = await Submission.find().sort({ createdAt: -1 });
      res.status(200).json(submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({
        message: 'Failed to fetch submissions',
        error: error.message
      });
    }
  },

  // Submissions - Check registration
  'GET /submissions/check/:regNo': async (req, res) => {
    await connectDB();
    
    const { regNo } = req.params;
    
    try {
      // Check if registration number exists in database
      const existingSubmission = await Submission.findOne({ 
        registrationNumber: regNo.trim().toUpperCase() 
      });
      
      if (existingSubmission) {
        return res.status(200).json({
          exists: true,
          registrationNumber: regNo,
          message: 'Registration number already exists',
          submission: {
            name: existingSubmission.name,
            email: existingSubmission.email,
            status: existingSubmission.status,
            submittedAt: existingSubmission.createdAt
          }
        });
      }
      
      res.status(200).json({
        exists: false,
        registrationNumber: regNo,
        message: 'Registration number available'
      });
    } catch (error) {
      console.error('Error checking registration:', error);
      res.status(500).json({
        message: 'Failed to check registration',
        error: error.message
      });
    }
  },

  // Submissions - Export
  'GET /submissions/export': async (req, res) => {
    await connectDB();
    
    try {
      const submissions = await Submission.find().sort({ createdAt: -1 });
      
      console.log(`Exporting ${submissions.length} submissions to CSV`);
      
      // Create CSV header with all fields
      const csvHeader = 'Name,Email,Registration Number,Phone,WhatsApp,Course,Section,Year,Batch,GitHub,Status,Submitted At\n';
      
      // Create CSV rows with proper escaping
      const csvRows = submissions.map(sub => {
        // Helper function to escape CSV values
        const escapeCSV = (value) => {
          if (!value) return '""';
          const stringValue = String(value);
          // Escape double quotes by doubling them
          const escaped = stringValue.replace(/"/g, '""');
          // Wrap in quotes if contains comma, newline, or quote
          if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
            return `"${escaped}"`;
          }
          return `"${escaped}"`;
        };
        
        return [
          escapeCSV(sub.name || ''),
          escapeCSV(sub.email || ''),
          escapeCSV(sub.registrationNumber || ''),
          escapeCSV(sub.phone || ''),
          escapeCSV(sub.whatsapp || ''),
          escapeCSV(sub.course || ''),
          escapeCSV(sub.section || ''),
          escapeCSV(sub.year || ''),
          escapeCSV(sub.batch || ''),
          escapeCSV(sub.github || ''),
          escapeCSV(sub.status || 'pending'),
          escapeCSV(sub.createdAt ? new Date(sub.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          }) : '')
        ].join(',');
      }).join('\n');
      
      // Add UTF-8 BOM for Excel compatibility
      const BOM = '\uFEFF';
      const csvData = BOM + csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="join-requests-${new Date().toISOString().split('T')[0]}.csv"`);
      res.status(200).send(csvData);
      
      console.log('CSV export successful');
    } catch (error) {
      console.error('Error exporting submissions:', error);
      res.status(500).json({
        message: 'Failed to export submissions',
        error: error.message
      });
    }
  },

  // Submissions - Update status
  'PUT /submissions/:id': async (req, res) => {
    await connectDB();
    
    const { id } = req.params;
    const { status } = req.body;
    
    try {
      const submission = await Submission.findByIdAndUpdate(
        id,
        { status, updatedAt: new Date() },
        { new: true }
      );

      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      res.status(200).json({
        message: 'Submission status updated successfully',
        submission
      });
    } catch (error) {
      console.error('Error updating submission:', error);
      res.status(500).json({
        message: 'Failed to update submission',
        error: error.message
      });
    }
  },

  // Events - Create
  'POST /events': async (req, res) => {
    await connectDB();
    
    const eventData = req.body;
    
    try {
      const event = new Event({
        ...eventData,
        createdAt: new Date()
      });

      await event.save();

      res.status(201).json({
        message: 'Event created successfully',
        event
      });
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({
        message: 'Failed to create event',
        error: error.message
      });
    }
  },

  // Events - Update
  'PUT /events/:id': async (req, res) => {
    await connectDB();
    
    const { id } = req.params;
    const eventData = req.body;
    
    try {
      const event = await Event.findByIdAndUpdate(
        id,
        { ...eventData, updatedAt: new Date() },
        { new: true }
      );

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      res.status(200).json({
        message: 'Event updated successfully',
        event
      });
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({
        message: 'Failed to update event',
        error: error.message
      });
    }
  },

  // Events - Delete
  'DELETE /events/:id': async (req, res) => {
    await connectDB();
    
    const { id } = req.params;
    
    try {
      const event = await Event.findByIdAndDelete(id);

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      res.status(200).json({
        message: 'Event deleted successfully',
        id
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({
        message: 'Failed to delete event',
        error: error.message
      });
    }
  },

  // Event Registration - Register for event
  'POST /events/:id/register': async (req, res) => {
    await connectDB();
    
    try {
      const decoded = verifyToken(req);
      const { id } = req.params;
      const registrationData = req.body;

      // Check if event exists
      const event = await Event.findById(id);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Check if event is paid (should go through payment flow)
      if (event.isPaid && event.price > 0) {
        return res.status(400).json({ 
          message: 'This is a paid event. Please complete payment first.',
          requiresPayment: true,
          price: event.price
        });
      }

      // Check if already registered
      const existingRegistration = await EventRegistration.findOne({
        event: id,
        user: decoded.userId
      });

      if (existingRegistration) {
        return res.status(400).json({ message: 'You are already registered for this event' });
      }

      // Create registration for free event
      const registration = new EventRegistration({
        event: id,
        user: decoded.userId,
        name: registrationData.name,
        registrationNo: registrationData.registrationNo,
        phoneNumber: registrationData.phoneNumber,
        whatsappNumber: registrationData.whatsappNumber,
        section: registrationData.section,
        department: registrationData.department,
        year: registrationData.year,
        course: registrationData.course,
        paymentStatus: 'free',
        registeredAt: new Date()
      });

      await registration.save();

      // Update event registration count
      await Event.findByIdAndUpdate(id, {
        $inc: { registrationCount: 1 }
      });

      res.status(201).json({
        message: 'Registration successful',
        registration
      });
    } catch (error) {
      console.error('Error registering for event:', error);
      res.status(500).json({
        message: 'Failed to register for event',
        error: error.message
      });
    }
  },

  // Event Registration - Get registrations for an event (Admin)
  'GET /events/:id/registrations': async (req, res) => {
    await connectDB();
    
    try {
      const decoded = verifyToken(req);
      const { id } = req.params;

      console.log(`📋 Fetching registrations for event: ${id}`);

      // Check if user is admin
      if (decoded.role !== 'admin' && !decoded.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Fetch registrations with lean() for better performance
      const registrations = await EventRegistration.find({ event: id })
        .populate({
          path: 'user',
          select: 'name email',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'payment',
          select: 'orderId paymentId amount status',
          options: { strictPopulate: false }
        })
        .lean()
        .sort({ registeredAt: -1 });

      console.log(`✅ Found ${registrations.length} registrations`);

      // Transform data to ensure all fields are present
      const transformedRegistrations = registrations.map(reg => ({
        _id: reg._id,
        name: reg.name || 'N/A',
        registrationNo: reg.registrationNo || 'N/A',
        phoneNumber: reg.phoneNumber || 'N/A',
        whatsappNumber: reg.whatsappNumber || reg.phoneNumber || 'N/A',
        course: reg.course || 'N/A',
        section: reg.section || 'N/A',
        year: reg.year || 'N/A',
        department: reg.department || 'N/A',
        paymentStatus: reg.paymentStatus || 'free',
        registeredAt: reg.registeredAt,
        user: reg.user || null,
        payment: reg.payment ? {
          _id: reg.payment._id,
          orderId: reg.payment.orderId || 'N/A',
          paymentId: reg.payment.paymentId || 'N/A',
          amount: reg.payment.amount || 0,
          status: reg.payment.status || 'pending'
        } : null
      }));

      res.status(200).json({
        success: true,
        count: transformedRegistrations.length,
        registrations: transformedRegistrations
      });
    } catch (error) {
      console.error('❌ Error fetching registrations:', error);
      res.status(500).json({
        message: 'Failed to fetch registrations',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Event Registration - Export registrations to CSV (Admin)
  'GET /events/:id/registrations/export': async (req, res) => {
    await connectDB();
    
    try {
      const decoded = verifyToken(req);
      const { id } = req.params;

      // Check if user is admin
      if (decoded.role !== 'admin' && !decoded.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const event = await Event.findById(id);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      const registrations = await EventRegistration.find({ event: id })
        .populate({
          path: 'user',
          select: 'name email',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'payment',
          select: 'orderId paymentId amount status',
          options: { strictPopulate: false }
        })
        .lean()
        .sort({ registeredAt: -1 });

      console.log(`Exporting ${registrations.length} registrations for event: ${event.title}`);

      // Create CSV header with payment info
      const csvHeader = 'Registration No,Name,Phone Number,WhatsApp,Course,Section,Year,Department,Payment Status,Amount,Order ID,Payment ID,Registered At\n';

      // Create CSV rows
      const csvRows = registrations.map(reg => {
        const escapeCSV = (value) => {
          if (!value) return '""';
          const stringValue = String(value);
          const escaped = stringValue.replace(/"/g, '""');
          if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
            return `"${escaped}"`;
          }
          return `"${escaped}"`;
        };

        return [
          escapeCSV(reg.registrationNo || 'N/A'),
          escapeCSV(reg.name || 'N/A'),
          escapeCSV(reg.phoneNumber || 'N/A'),
          escapeCSV(reg.whatsappNumber || reg.phoneNumber || 'N/A'),
          escapeCSV(reg.course || 'N/A'),
          escapeCSV(reg.section || 'N/A'),
          escapeCSV(reg.year || 'N/A'),
          escapeCSV(reg.department || 'N/A'),
          escapeCSV(reg.paymentStatus || 'free'),
          escapeCSV(reg.payment?.amount ? `₹${reg.payment.amount}` : 'Free'),
          escapeCSV(reg.payment?.orderId || 'N/A'),
          escapeCSV(reg.payment?.paymentId || 'N/A'),
          escapeCSV(reg.registeredAt ? new Date(reg.registeredAt).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          }) : 'N/A')
        ].join(',');
      }).join('\n');

      // Add UTF-8 BOM for Excel compatibility
      const BOM = '\uFEFF';
      const csvData = BOM + csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${event.title.replace(/[^a-z0-9]/gi, '-')}-registrations-${new Date().toISOString().split('T')[0]}.csv"`);
      res.status(200).send(csvData);

      console.log('CSV export successful');
    } catch (error) {
      console.error('Error exporting registrations:', error);
      res.status(500).json({
        message: 'Failed to export registrations',
        error: error.message
      });
    }
  },

  // Event Registration - Check if user is registered
  'GET /events/:id/check-registration': async (req, res) => {
    await connectDB();
    
    try {
      const decoded = verifyToken(req);
      const { id } = req.params;

      const registration = await EventRegistration.findOne({
        event: id,
        user: decoded.userId
      });

      res.status(200).json({
        isRegistered: !!registration,
        registration: registration || null
      });
    } catch (error) {
      console.error('Error checking registration:', error);
      res.status(500).json({
        message: 'Failed to check registration',
        error: error.message
      });
    }
  },

  // Event Registration - Get user's registrations
  'GET /events/user/registrations': async (req, res) => {
    await connectDB();
    
    try {
      const decoded = verifyToken(req);

      console.log(`📋 Fetching registrations for user: ${decoded.userId}`);

      const registrations = await EventRegistration.find({ user: decoded.userId })
        .populate({
          path: 'event',
          select: 'title date location image price isPaid',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'payment',
          select: 'orderId paymentId amount status',
          options: { strictPopulate: false }
        })
        .lean()
        .sort({ registeredAt: -1 });

      console.log(`✅ Found ${registrations.length} registrations`);

      // Transform data to ensure all fields are present
      const transformedRegistrations = registrations.map(reg => ({
        _id: reg._id,
        name: reg.name || 'N/A',
        registrationNo: reg.registrationNo || 'N/A',
        phoneNumber: reg.phoneNumber || 'N/A',
        whatsappNumber: reg.whatsappNumber || reg.phoneNumber || 'N/A',
        course: reg.course || 'N/A',
        section: reg.section || 'N/A',
        year: reg.year || 'N/A',
        department: reg.department || 'N/A',
        paymentStatus: reg.paymentStatus || 'free',
        registeredAt: reg.registeredAt,
        event: reg.event ? {
          _id: reg.event._id,
          title: reg.event.title || 'Event',
          date: reg.event.date,
          location: reg.event.location || 'TBA',
          image: reg.event.image,
          price: reg.event.price || 0,
          isPaid: reg.event.isPaid || false
        } : { title: 'Unknown Event' },
        payment: reg.payment ? {
          _id: reg.payment._id,
          orderId: reg.payment.orderId || 'N/A',
          paymentId: reg.payment.paymentId || 'N/A',
          amount: reg.payment.amount || 0,
          status: reg.payment.status || 'pending'
        } : null
      }));

      res.status(200).json({
        success: true,
        count: transformedRegistrations.length,
        registrations: transformedRegistrations
      });
    } catch (error) {
      console.error('❌ Error fetching user registrations:', error);
      res.status(500).json({
        message: 'Failed to fetch registrations',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Members - Create
  'POST /members': async (req, res) => {
    await connectDB();
    
    const memberData = req.body;
    
    try {
      const member = new Member({
        ...memberData,
        createdAt: new Date()
      });

      await member.save();

      res.status(201).json({
        message: 'Member added successfully',
        member
      });
    } catch (error) {
      console.error('Error creating member:', error);
      res.status(500).json({
        message: 'Failed to add member',
        error: error.message
      });
    }
  },

  // Members - Update
  'PUT /members/:id': async (req, res) => {
    await connectDB();
    
    const { id } = req.params;
    const memberData = req.body;
    
    try {
      const member = await Member.findByIdAndUpdate(
        id,
        { ...memberData, updatedAt: new Date() },
        { new: true }
      );

      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      res.status(200).json({
        message: 'Member updated successfully',
        member
      });
    } catch (error) {
      console.error('Error updating member:', error);
      res.status(500).json({
        message: 'Failed to update member',
        error: error.message
      });
    }
  },

  // Members - Delete
  'DELETE /members/:id': async (req, res) => {
    await connectDB();
    
    const { id } = req.params;
    
    try {
      const member = await Member.findByIdAndDelete(id);

      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      res.status(200).json({
        message: 'Member deleted successfully',
        id
      });
    } catch (error) {
      console.error('Error deleting member:', error);
      res.status(500).json({
        message: 'Failed to delete member',
        error: error.message
      });
    }
  },

  // Gallery - Create
  'POST /gallery': async (req, res) => {
    await connectDB();
    
    const galleryData = req.body;
    
    try {
      const gallery = new Gallery({
        ...galleryData,
        createdAt: new Date()
      });

      await gallery.save();

      res.status(201).json({
        message: 'Gallery item created successfully',
        gallery
      });
    } catch (error) {
      console.error('Error creating gallery item:', error);
      res.status(500).json({
        message: 'Failed to create gallery item',
        error: error.message
      });
    }
  },

  // Gallery - Update
  'PUT /gallery/:id': async (req, res) => {
    await connectDB();
    
    const { id } = req.params;
    const galleryData = req.body;
    
    try {
      const gallery = await Gallery.findByIdAndUpdate(
        id,
        { ...galleryData, updatedAt: new Date() },
        { new: true }
      );

      if (!gallery) {
        return res.status(404).json({ message: 'Gallery item not found' });
      }

      res.status(200).json({
        message: 'Gallery item updated successfully',
        gallery
      });
    } catch (error) {
      console.error('Error updating gallery item:', error);
      res.status(500).json({
        message: 'Failed to update gallery item',
        error: error.message
      });
    }
  },

  // Gallery - Delete
  'DELETE /gallery/:id': async (req, res) => {
    await connectDB();
    
    const { id } = req.params;
    
    try {
      const gallery = await Gallery.findByIdAndDelete(id);

      if (!gallery) {
        return res.status(404).json({ message: 'Gallery item not found' });
      }

      res.status(200).json({
        message: 'Gallery item deleted successfully',
        id
      });
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      res.status(500).json({
        message: 'Failed to delete gallery item',
        error: error.message
      });
    }
  },

  // Submit join request
  'POST /submissions': async (req, res) => {
    await connectDB();
    
    const { name, email, registrationNumber, phone, whatsapp, course, section, year, batch, github } = req.body;
    
    if (!name || !email || !registrationNumber) {
      return res.status(400).json({
        message: 'Name, email, and registration number are required'
      });
    }

    try {
      // Check if registration number already exists
      const existingSubmission = await Submission.findOne({ 
        registrationNumber: registrationNumber.trim().toUpperCase() 
      });
      
      if (existingSubmission) {
        return res.status(400).json({
          message: 'Registration number already exists',
          error: 'DUPLICATE_REGISTRATION',
          existingSubmission: {
            name: existingSubmission.name,
            email: existingSubmission.email,
            registrationNumber: existingSubmission.registrationNumber,
            status: existingSubmission.status,
            submittedAt: existingSubmission.createdAt
          }
        });
      }

      // Check if email already exists
      const existingEmail = await Submission.findOne({ 
        email: email.trim().toLowerCase() 
      });
      
      if (existingEmail) {
        return res.status(400).json({
          message: 'Email already exists. You have already submitted an application.',
          error: 'DUPLICATE_EMAIL',
          existingSubmission: {
            name: existingEmail.name,
            email: existingEmail.email,
            registrationNumber: existingEmail.registrationNumber,
            status: existingEmail.status,
            submittedAt: existingEmail.createdAt
          }
        });
      }

      const submission = new Submission({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        registrationNumber: registrationNumber.trim().toUpperCase(),
        phone: phone?.trim(),
        whatsapp: whatsapp?.trim(),
        course: course?.trim(),
        section: section?.trim(),
        year: year?.trim(),
        batch: batch?.trim(),
        github: github?.trim(),
        status: 'pending',
        createdAt: new Date()
      });

      await submission.save();

      res.status(201).json({
        message: 'Join request submitted successfully! We will review your application.',
        submission: {
          id: submission._id,
          name: submission.name,
          email: submission.email,
          registrationNumber: submission.registrationNumber,
          status: submission.status,
          submittedAt: submission.createdAt
        }
      });
    } catch (error) {
      console.error('Error submitting join request:', error);
      res.status(500).json({
        message: 'Failed to submit join request',
        error: error.message
      });
    }
  },

  // Payment - Get All Payments (Admin)
  'GET /payment/admin/all': async (req, res) => {
    try {
      await connectDB();
      
      const decoded = verifyToken(req);
      
      if (decoded.role !== 'admin' && !decoded.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      console.log('📋 [index.js] Fetching all payments (Admin)');

      const payments = await Payment.find()
        .populate({
          path: 'event',
          select: 'title date location price',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'user',
          select: 'name email',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'registration',
          select: 'registrationNo phoneNumber',
          options: { strictPopulate: false }
        })
        .lean()
        .sort({ createdAt: -1 });

      console.log(`✅ [index.js] Found ${payments.length} payments`);

      const transformedPayments = payments.map(payment => ({
        _id: payment._id,
        orderId: payment.orderId || 'N/A',
        paymentId: payment.paymentId || 'Pending',
        amount: payment.amount || 0,
        currency: payment.currency || 'INR',
        status: payment.status || 'pending',
        userName: payment.userName || (payment.user?.name) || 'N/A',
        userEmail: payment.userEmail || (payment.user?.email) || 'N/A',
        registrationNo: payment.registrationNo || (payment.registration?.registrationNo) || 'N/A',
        phoneNumber: payment.phoneNumber || (payment.registration?.phoneNumber) || 'N/A',
        createdAt: payment.createdAt,
        paidAt: payment.paidAt,
        event: payment.event ? {
          _id: payment.event._id,
          title: payment.event.title || 'Event',
          date: payment.event.date,
          location: payment.event.location || 'TBA',
          price: payment.event.price || 0
        } : { title: 'Unknown Event' },
        user: payment.user || null,
        registration: payment.registration || null
      }));

      res.status(200).json({
        success: true,
        count: transformedPayments.length,
        payments: transformedPayments
      });
    } catch (error) {
      console.error('❌ [index.js] Error fetching all payments:', error);
      res.status(500).json({ 
        message: 'Failed to fetch payments', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Payment - Get Payment History (User)
  'GET /payment/history': async (req, res) => {
    try {
      await connectDB();
      
      const decoded = verifyToken(req);
      
      console.log(`📋 [index.js] Fetching payment history for user: ${decoded.userId}`);

      const payments = await Payment.find({ user: decoded.userId })
        .populate({
          path: 'event',
          select: 'title date location image price',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'registration',
          select: 'registrationNo name phoneNumber',
          options: { strictPopulate: false }
        })
        .lean()
        .sort({ createdAt: -1 });

      console.log(`✅ [index.js] Found ${payments.length} payments`);

      const transformedPayments = payments.map(payment => ({
        _id: payment._id,
        orderId: payment.orderId || 'N/A',
        paymentId: payment.paymentId || 'Pending',
        amount: payment.amount || 0,
        currency: payment.currency || 'INR',
        status: payment.status || 'pending',
        userName: payment.userName || 'N/A',
        userEmail: payment.userEmail || 'N/A',
        registrationNo: payment.registrationNo || 'N/A',
        phoneNumber: payment.phoneNumber || 'N/A',
        createdAt: payment.createdAt,
        paidAt: payment.paidAt,
        event: payment.event ? {
          _id: payment.event._id,
          title: payment.event.title || 'Event',
          date: payment.event.date,
          location: payment.event.location || 'TBA',
          image: payment.event.image,
          price: payment.event.price || 0
        } : null,
        registration: payment.registration || null
      }));

      res.status(200).json({
        success: true,
        count: transformedPayments.length,
        payments: transformedPayments
      });
    } catch (error) {
      console.error('❌ [index.js] Error fetching payment history:', error);
      res.status(500).json({ 
        message: 'Failed to fetch payment history', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Payment - Get Payments by Event (Admin)
  'GET /payment/admin/event/:eventId': async (req, res) => {
    try {
      await connectDB();
      
      const decoded = verifyToken(req);
      const { eventId } = req.params;
      
      if (decoded.role !== 'admin' && !decoded.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      console.log(`📋 [index.js] Fetching payments for event: ${eventId}`);

      const payments = await Payment.find({ event: eventId })
        .populate({
          path: 'user',
          select: 'name email',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'registration',
          select: 'registrationNo phoneNumber name',
          options: { strictPopulate: false }
        })
        .lean()
        .sort({ createdAt: -1 });

      console.log(`✅ [index.js] Found ${payments.length} payments for event`);

      const transformedPayments = payments.map(payment => ({
        _id: payment._id,
        orderId: payment.orderId || 'N/A',
        paymentId: payment.paymentId || 'Pending',
        amount: payment.amount || 0,
        currency: payment.currency || 'INR',
        status: payment.status || 'pending',
        userName: payment.userName || (payment.user?.name) || (payment.registration?.name) || 'N/A',
        userEmail: payment.userEmail || (payment.user?.email) || 'N/A',
        registrationNo: payment.registrationNo || (payment.registration?.registrationNo) || 'N/A',
        phoneNumber: payment.phoneNumber || (payment.registration?.phoneNumber) || 'N/A',
        createdAt: payment.createdAt,
        paidAt: payment.paidAt,
        user: payment.user || null,
        registration: payment.registration || null
      }));

      res.status(200).json({
        success: true,
        count: transformedPayments.length,
        payments: transformedPayments
      });
    } catch (error) {
      console.error('❌ [index.js] Error fetching event payments:', error);
      res.status(500).json({ 
        message: 'Failed to fetch event payments', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },


};

export default async function handler(req, res) {
  setCORSHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api', '');
    const route = `${req.method} ${path}`;
    
    console.log('API Route:', route);
    
    let matchedHandler = handlers[route];
    
    if (!matchedHandler) {
      for (const [pattern, patternHandler] of Object.entries(handlers)) {
        const [method, patternPath] = pattern.split(' ');
        
        if (method !== req.method) continue;
        
        const regexPattern = patternPath.replace(/:[^/]+/g, '([^/]+)');
        const regex = new RegExp(`^${regexPattern}$`);
        const match = path.match(regex);
        
        if (match) {
          const paramNames = (patternPath.match(/:[^/]+/g) || []).map(p => p.substring(1));
          req.params = {};
          paramNames.forEach((name, index) => {
            req.params[name] = match[index + 1];
          });
          
          matchedHandler = patternHandler;
          break;
        }
      }
    }
    
    if (!matchedHandler) {
      return res.status(404).json({
        message: 'API endpoint not found',
        route: route,
        method: req.method,
        path: path,
        availableRoutes: Object.keys(handlers).filter(r => r.startsWith(req.method))
      });
    }

    await matchedHandler(req, res);
    
  } catch (error) {
    console.error('API Error:', error);
    
    if (error.message === 'No token provided' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'INVALID_TOKEN'
      });
    }
    
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
    });
  }
}
