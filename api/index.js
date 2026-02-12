// Consolidated API handler for all routes - Professional Vercel Version
import connectDB from '../lib/db.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Import all models
import User from '../models/UserModel.js';
import Event from '../models/EventModel.js';
import EventRegistration from '../models/EventRegistrationModel.js';
import Gallery from '../models/GalleryModel.js';
import Member from '../models/MemberModel.js';
import Submission from '../models/SubmissionModel.js';
import Testimonial from '../models/TestimonialModel.js';

// CORS headers helper
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Auth middleware helper
async function authenticate(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId || decoded.id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }
    return user;
  } catch (error) {
    const authError = new Error('Invalid or expired token');
    authError.statusCode = 401;
    throw authError;
  }
}

// Admin check helper
async function checkAdmin(req) {
  const user = await authenticate(req);
  if (!user.isAdmin && user.role !== 'admin') {
    const error = new Error('Admin access required');
    error.statusCode = 403;
    throw error;
  }
  return user;
}

// Registration Logic Helper
async function handleRegistration(req, res) {
  const eventId = req.params.id || req.query.eventId || req.body.eventId;
  const registrationData = req.body;

  if (!eventId) {
    return res.status(400).json({ message: 'Event ID is required' });
  }

  console.log(`🎯 [REGISTRATION] Registering for event: ${eventId}`);

  // 1. Find the event
  let event;
  if (mongoose.Types.ObjectId.isValid(eventId)) {
    event = await Event.findById(eventId);
  }
  if (!event) {
    event = await Event.findOne({ slug: eventId });
  }
  
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  // 2. Validate required fields
  const requiredFields = ['name', 'registrationNo', 'phoneNumber', 'course', 'section', 'year', 'department'];
  const missingFields = requiredFields.filter(field => !registrationData[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      message: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    });
  }

  // 3. Authenticate user if token is provided
  let loggedInUser = null;
  try {
    loggedInUser = await authenticate(req);
  } catch (e) {
    // Not logged in or invalid token, continue as guest
  }

  // 4. Check for duplicate registration
  // Case A: Check by registration number (for everyone)
  const existingByRegNo = await EventRegistration.findOne({
    event: event._id,
    registrationNo: registrationData.registrationNo.trim().toUpperCase()
  });

  if (existingByRegNo) {
    return res.status(400).json({ 
      message: 'This registration number is already registered for this event.',
      error: 'DUPLICATE_REGISTRATION'
    });
  }

  // Case B: Check by user ID (if logged in)
  if (loggedInUser) {
    const existingByUser = await EventRegistration.findOne({
      event: event._id,
      user: loggedInUser._id
    });

    if (existingByUser) {
      return res.status(400).json({ 
        message: 'You have already registered for this event.',
        error: 'DUPLICATE_REGISTRATION'
      });
    }
  } else {
    // Case C: Check by registration number if NOT logged in (redundant but safe)
    // We already checked by regNo in Case A, so this is just for logic completeness
  }

  // 5. Handle team registration for hackathons
  if (event.eventType === 'hackathon' && registrationData.isTeamRegistration) {
    const teamSize = (registrationData.teamMembers?.length || 0) + 1;
    const minSize = event.teamSettings?.minTeamSize || 1;
    const maxSize = event.teamSettings?.maxTeamSize || 4;

    if (teamSize < minSize || teamSize > maxSize) {
      return res.status(400).json({ 
        message: `Team size must be between ${minSize} and ${maxSize} members.` 
      });
    }
  }

  // 6. Create the registration
  const registration = new EventRegistration({
    event: event._id,
    user: loggedInUser ? loggedInUser._id : null, 
    name: registrationData.name.trim(),
    registrationNo: registrationData.registrationNo.trim().toUpperCase(),
    phoneNumber: registrationData.phoneNumber.trim(),
    whatsappNumber: registrationData.whatsappNumber?.trim() || registrationData.phoneNumber.trim(),
    section: registrationData.section.trim(),
    department: registrationData.department.trim(),
    year: registrationData.year.trim(),
    course: registrationData.course.trim(),
    isTeamRegistration: registrationData.isTeamRegistration || false,
    teamName: registrationData.teamName?.trim() || null,
    teamMembers: registrationData.teamMembers || [],
    paymentStatus: event.isPaid ? 'pending' : 'free',
    registeredAt: new Date()
  });

  try {
    await registration.save();

    // 7. Update event registration count
    await Event.findByIdAndUpdate(event._id, {
      $inc: { registrationCount: 1 }
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      registration: {
        id: registration._id,
        name: registration.name,
        eventTitle: event.title
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'You have already registered for this event.',
        error: 'DUPLICATE_REGISTRATION'
      });
    }
    throw error;
  }
}

// Route handlers
const handlers = {
  // --- AUTH ROUTES ---
  
  'POST /auth/login': async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // 1. Find user by email
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        console.log(`❌ Login failed: User not found (${email})`);
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // 2. Verify password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log(`❌ Login failed: Incorrect password for ${email}`);
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // 3. Generate Token
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role, isAdmin: user.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log(`✅ Login successful: ${email} (Admin: ${user.isAdmin || user.role === 'admin'})`);

      res.status(200).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin || user.role === 'admin'
        }
      });
    } catch (error) {
      console.error('🔥 Login Error:', error);
      res.status(500).json({ message: 'Internal Server Error during login' });
    }
  },

  'POST /auth/signup': async (req, res) => {
    try {
      const { name, email, password, registrationNumber, phone, stream, section, session } = req.body;
      
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const user = new User({
        name,
        email,
        password,
        registrationNumber,
        phone,
        stream,
        section,
        session
      });

      await user.save();

      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role, isAdmin: user.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin || user.role === 'admin'
        }
      });
    } catch (error) {
      console.error('🔥 Signup Error:', error);
      res.status(500).json({ message: 'Internal Server Error during signup' });
    }
  },

  'GET /auth/me': async (req, res) => {
    try {
      const user = await authenticate(req);
      res.status(200).json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin || user.role === 'admin'
      });
    } catch (error) {
      console.error('🔥 Auth Me Error:', error);
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  },

  // --- EVENT ROUTES ---

  'GET /events': async (req, res) => {
    try {
      const events = await Event.find().sort({ date: -1 });
      res.status(200).json(events);
    } catch (error) {
      console.error('🔥 Fetch Events Error:', error);
      res.status(500).json({ message: 'Internal Server Error fetching events' });
    }
  },

  'GET /events/:id': async (req, res) => {
    try {
      const { id } = req.params;
      let event;
      
      if (mongoose.Types.ObjectId.isValid(id)) {
        event = await Event.findById(id);
      }
      
      if (!event) {
        event = await Event.findOne({ slug: id });
      }
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      res.status(200).json(event);
    } catch (error) {
      console.error('🔥 Fetch Event Error:', error);
      res.status(500).json({ message: 'Internal Server Error fetching event' });
    }
  },

  'POST /events': async (req, res) => {
    try {
      await checkAdmin(req);
      const event = new Event(req.body);
      await event.save();
      res.status(201).json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  },

  'PUT /events/:id': async (req, res) => {
    try {
      await checkAdmin(req);
      const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!event) return res.status(404).json({ message: 'Event not found' });
      res.status(200).json(event);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  },

  'DELETE /events/:id': async (req, res) => {
    try {
      await checkAdmin(req);
      const event = await Event.findByIdAndDelete(req.params.id);
      if (!event) return res.status(404).json({ message: 'Event not found' });
      res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('🔥 Delete Event Error:', error);
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  },

  // CRITICAL: Event Registration Handler (Handles both /api/events/:id/register and /api/register?eventId=...)
  'POST /events/:id/register': handleRegistration,

  // Alias for /api/register?eventId=...
  'POST /register': handleRegistration,

  'GET /events/:id/check-registration': async (req, res) => {
    try {
      const { id: eventId } = req.params;
      const user = await authenticate(req);
      
      let event;
      if (mongoose.Types.ObjectId.isValid(eventId)) {
        event = await Event.findById(eventId);
      } else {
        event = await Event.findOne({ slug: eventId });
      }
      
      if (!event) return res.status(404).json({ message: 'Event not found' });

      const registration = await EventRegistration.findOne({
        event: event._id,
        user: user._id
      });

      res.status(200).json({ isRegistered: !!registration, registration });
    } catch (error) {
      // If not authenticated, they can't be "registered" as a user
      if (error.statusCode === 401) {
        return res.status(200).json({ isRegistered: false });
      }
      console.error('🔥 Check Registration Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  'GET /events/user/registrations': async (req, res) => {
    try {
      const user = await authenticate(req);
      const registrations = await EventRegistration.find({ user: user._id })
        .populate('event')
        .sort({ registeredAt: -1 });
      res.status(200).json(registrations);
    } catch (error) {
      console.error('🔥 User Registrations Error:', error);
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  },

  'GET /events/:id/registrations': async (req, res) => {
    try {
      await checkAdmin(req);
      const { id } = req.params;
      
      let event;
      if (mongoose.Types.ObjectId.isValid(id)) {
        event = await Event.findById(id);
      } else {
        event = await Event.findOne({ slug: id });
      }
      
      if (!event) return res.status(404).json({ message: 'Event not found' });

      const registrations = await EventRegistration.find({ event: event._id })
        .populate('user', 'name email registrationNumber')
        .sort({ registeredAt: -1 });
      res.status(200).json(registrations);
    } catch (error) {
      console.error('🔥 Fetch Event Registrations Error:', error);
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  },

  // --- MEMBER ROUTES ---

  'GET /members': async (req, res) => {
    try {
      const members = await Member.find().sort({ order: 1 });
      res.status(200).json(members);
    } catch (error) {
      console.error('🔥 Fetch Members Error:', error);
      res.status(500).json({ message: 'Internal Server Error fetching members' });
    }
  },

  'POST /members': async (req, res) => {
    try {
      await checkAdmin(req);
      const member = new Member(req.body);
      await member.save();
      res.status(201).json(member);
    } catch (error) {
      console.error('Error adding member:', error);
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  },

  'PUT /members/:id': async (req, res) => {
    try {
      await checkAdmin(req);
      const member = await Member.findByIdAndUpdate(
        req.params.id, 
        { ...req.body, updatedAt: new Date() }, 
        { new: true, runValidators: true }
      );
      if (!member) return res.status(404).json({ message: 'Member not found' });
      res.status(200).json(member);
    } catch (error) {
      console.error('Error updating member:', error);
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  },

  'DELETE /members/:id': async (req, res) => {
    try {
      await checkAdmin(req);
      const member = await Member.findByIdAndDelete(req.params.id);
      if (!member) return res.status(404).json({ message: 'Member not found' });
      res.status(200).json({ message: 'Member deleted successfully' });
    } catch (error) {
      console.error('🔥 Delete Member Error:', error);
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  },

  // --- SUBMISSION ROUTES ---

  'POST /submissions': async (req, res) => {
    try {
      const submission = new Submission({
        ...req.body,
        status: 'pending',
        submittedAt: new Date()
      });
      await submission.save();
      res.status(201).json({
        success: true,
        message: 'Join request submitted successfully!',
        submission
      });
    } catch (error) {
      console.error('🔥 Submission Error:', error);
      res.status(500).json({ message: 'Internal Server Error submitting request' });
    }
  },

  'GET /submissions': async (req, res) => {
    try {
      await checkAdmin(req);
      const submissions = await Submission.find().sort({ submittedAt: -1, createdAt: -1 });
      res.status(200).json(submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  },

  'PUT /submissions/:id': async (req, res) => {
    try {
      await checkAdmin(req);
      const submission = await Submission.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!submission) return res.status(404).json({ message: 'Submission not found' });
      res.status(200).json(submission);
    } catch (error) {
      console.error('🔥 Update Submission Error:', error);
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  },

  // --- GALLERY ROUTES ---

  'GET /gallery': async (req, res) => {
    try {
      const gallery = await Gallery.find().sort({ createdAt: -1 });
      res.status(200).json(gallery);
    } catch (error) {
      console.error('🔥 Fetch Gallery Error:', error);
      res.status(500).json({ message: 'Internal Server Error fetching gallery' });
    }
  },

  'POST /gallery': async (req, res) => {
    try {
      await checkAdmin(req);
      const item = new Gallery(req.body);
      await item.save();
      res.status(201).json(item);
    } catch (error) {
      console.error('🔥 Add Gallery Item Error:', error);
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  },

  'DELETE /gallery/:id': async (req, res) => {
    try {
      await checkAdmin(req);
      const item = await Gallery.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ message: 'Gallery item not found' });
      res.status(200).json({ message: 'Gallery item deleted' });
    } catch (error) {
      console.error('🔥 Delete Gallery Item Error:', error);
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  },

  // --- TESTIMONIAL ROUTES ---

  'GET /testimonials': async (req, res) => {
    try {
      const testimonials = await Testimonial.find({ status: 'approved' }).sort({ createdAt: -1 });
      res.status(200).json(testimonials);
    } catch (error) {
      console.error('🔥 Fetch Testimonials Error:', error);
      res.status(500).json({ message: 'Internal Server Error fetching testimonials' });
    }
  },

  'GET /testimonials/all': async (req, res) => {
    try {
      await checkAdmin(req);
      const testimonials = await Testimonial.find().sort({ createdAt: -1 });
      res.status(200).json(testimonials);
    } catch (error) {
      console.error('🔥 Fetch All Testimonials Error:', error);
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  },

  'POST /testimonials/submit': async (req, res) => {
    try {
      const testimonial = new Testimonial({ ...req.body, status: 'pending' });
      await testimonial.save();
      res.status(201).json({ message: 'Testimonial submitted for approval' });
    } catch (error) {
      console.error('🔥 Submit Testimonial Error:', error);
      res.status(500).json({ message: 'Internal Server Error submitting testimonial' });
    }
  },

  'PUT /testimonials/:id': async (req, res) => {
    try {
      await checkAdmin(req);
      const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });
      res.status(200).json(testimonial);
    } catch (error) {
      console.error('🔥 Update Testimonial Error:', error);
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  },

  'DELETE /testimonials/:id': async (req, res) => {
    try {
      await checkAdmin(req);
      const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
      if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });
      res.status(200).json({ message: 'Testimonial deleted' });
    } catch (error) {
      console.error('🔥 Delete Testimonial Error:', error);
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  },

  // --- SYSTEM ROUTES ---

  'GET /health': async (req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
  }
};

// Main Vercel API Handler
export default async function handler(req, res) {
  setCORSHeaders(res);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Parse URL and Path
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let path = url.pathname;
    
    // Remove /api prefix if present
    if (path.startsWith('/api')) {
      path = path.substring(4);
    }
    
    // Ensure path starts with /
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    const routeKey = `${req.method} ${path}`;
    console.log(`🚀 API Request: ${routeKey}`);

    // 3. Find Matching Handler (with dynamic parameters)
    let matchedHandler = handlers[routeKey];
    let params = {};

    if (!matchedHandler) {
      // Try regex matching for routes with parameters (e.g., /events/:id)
      for (const [pattern, handlerFunc] of Object.entries(handlers)) {
        const [method, patternPath] = pattern.split(' ');
        
        if (method !== req.method) continue;
        
        // Convert :param to regex capture group
        const regexPattern = patternPath.replace(/:[^/]+/g, '([^/]+)');
        const regex = new RegExp(`^${regexPattern}$`);
        const match = path.match(regex);
        
        if (match) {
          // Extract parameter names and values
          const paramNames = (patternPath.match(/:[^/]+/g) || []).map(p => p.substring(1));
          paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
          });
          
          matchedHandler = handlerFunc;
          break;
        }
      }
    }

    // 4. Execute Handler
    if (matchedHandler) {
      req.params = params;
      req.query = Object.fromEntries(url.searchParams);
      
      await matchedHandler(req, res);
    } else {
      console.log(`❌ No handler found for: ${routeKey}`);
      res.status(404).json({
        message: 'API endpoint not found',
        method: req.method,
        path: path,
        availableRoutes: Object.keys(handlers).filter(r => r.startsWith(req.method))
      });
    }

  } catch (error) {
    console.error('🔥 API Error:', error);
    
    // Default status code
    let statusCode = 500;
    
    // Custom status code from error object
    if (error.statusCode) {
      statusCode = error.statusCode;
    } else if (error.message.includes('Authentication')) {
      statusCode = 401;
    } else if (error.message.includes('Admin')) {
      statusCode = 403;
    }
                       
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
