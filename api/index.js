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
    throw new Error('Authentication required');
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId || decoded.id);
    if (!user) throw new Error('User not found');
    return user;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Admin check helper
async function checkAdmin(req) {
  const user = await authenticate(req);
  if (!user.isAdmin && user.role !== 'admin') {
    throw new Error('Admin access required');
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

  // 3. Check for duplicate registration
  const existingRegistration = await EventRegistration.findOne({
    event: event._id,
    registrationNo: registrationData.registrationNo.trim().toUpperCase()
  });

  if (existingRegistration) {
    return res.status(400).json({ 
      message: 'You have already registered for this event with this registration number.',
      error: 'DUPLICATE_REGISTRATION'
    });
  }

  // 4. Handle team registration for hackathons
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

  // 5. Create the registration
  const registration = new EventRegistration({
    event: event._id,
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

  // Link to user if logged in
  try {
    const user = await authenticate(req);
    registration.user = user._id;
  } catch (e) {
    // Not logged in, that's fine for public registration
  }

  await registration.save();

  // 6. Update event registration count
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
}

// Route handlers
const handlers = {
  // --- AUTH ROUTES ---
  
  'POST /auth/login': async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin
      }
    });
  },

  'POST /auth/signup': async (req, res) => {
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
        role: user.role
      }
    });
  },

  'GET /auth/me': async (req, res) => {
    const user = await authenticate(req);
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin
    });
  },

  // --- EVENT ROUTES ---

  'GET /events': async (req, res) => {
    const events = await Event.find().sort({ date: -1 });
    res.status(200).json(events);
  },

  'GET /events/:id': async (req, res) => {
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
  },

  'POST /events': async (req, res) => {
    await checkAdmin(req);
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  },

  'PUT /events/:id': async (req, res) => {
    await checkAdmin(req);
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json(event);
  },

  'DELETE /events/:id': async (req, res) => {
    await checkAdmin(req);
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({ message: 'Event deleted successfully' });
  },

  // CRITICAL: Event Registration Handler (Handles both /api/events/:id/register and /api/register?eventId=...)
  'POST /events/:id/register': handleRegistration,

  // Alias for /api/register?eventId=...
  'POST /register': handleRegistration,

  'GET /events/:id/check-registration': async (req, res) => {
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
  },

  'GET /events/user/registrations': async (req, res) => {
    const user = await authenticate(req);
    const registrations = await EventRegistration.find({ user: user._id })
      .populate('event')
      .sort({ registeredAt: -1 });
    res.status(200).json(registrations);
  },

  'GET /events/:id/registrations': async (req, res) => {
    await checkAdmin(req);
    const registrations = await EventRegistration.find({ event: req.params.id })
      .sort({ registeredAt: -1 });
    res.status(200).json(registrations);
  },

  // --- MEMBER ROUTES ---

  'GET /members': async (req, res) => {
    const members = await Member.find().sort({ order: 1 });
    res.status(200).json(members);
  },

  'POST /members': async (req, res) => {
    await checkAdmin(req);
    const member = new Member(req.body);
    await member.save();
    res.status(201).json(member);
  },

  'PUT /members/:id': async (req, res) => {
    await checkAdmin(req);
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(member);
  },

  'DELETE /members/:id': async (req, res) => {
    await checkAdmin(req);
    await Member.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Member deleted successfully' });
  },

  // --- SUBMISSION ROUTES ---

  'POST /submissions': async (req, res) => {
    const submission = new Submission(req.body);
    await submission.save();
    res.status(201).json(submission);
  },

  'GET /submissions': async (req, res) => {
    await checkAdmin(req);
    const submissions = await Submission.find().sort({ createdAt: -1 });
    res.status(200).json(submissions);
  },

  'PUT /submissions/:id': async (req, res) => {
    await checkAdmin(req);
    const submission = await Submission.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(submission);
  },

  // --- GALLERY ROUTES ---

  'GET /gallery': async (req, res) => {
    const gallery = await Gallery.find().sort({ createdAt: -1 });
    res.status(200).json(gallery);
  },

  'POST /gallery': async (req, res) => {
    await checkAdmin(req);
    const item = new Gallery(req.body);
    await item.save();
    res.status(201).json(item);
  },

  'DELETE /gallery/:id': async (req, res) => {
    await checkAdmin(req);
    await Gallery.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Gallery item deleted' });
  },

  // --- TESTIMONIAL ROUTES ---

  'GET /testimonials': async (req, res) => {
    const testimonials = await Testimonial.find({ status: 'approved' }).sort({ createdAt: -1 });
    res.status(200).json(testimonials);
  },

  'GET /testimonials/all': async (req, res) => {
    await checkAdmin(req);
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.status(200).json(testimonials);
  },

  'POST /testimonials/submit': async (req, res) => {
    const testimonial = new Testimonial({ ...req.body, status: 'pending' });
    await testimonial.save();
    res.status(201).json({ message: 'Testimonial submitted for approval' });
  },

  'PUT /testimonials/:id': async (req, res) => {
    await checkAdmin(req);
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(testimonial);
  },

  'DELETE /testimonials/:id': async (req, res) => {
    await checkAdmin(req);
    await Testimonial.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Testimonial deleted' });
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
    
    const statusCode = error.message.includes('Authentication') ? 401 : 
                       error.message.includes('Admin') ? 403 : 500;
                       
    res.status(statusCode).json({
      message: error.message || 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
