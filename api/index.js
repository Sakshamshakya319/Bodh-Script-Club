import connectDB from '../lib/db.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/UserModel.js';
import Event from '../models/EventModel.js';
import EventRegistration from '../models/EventRegistrationModel.js';
import Gallery from '../models/GalleryModel.js';
import Member from '../models/MemberModel.js';
import Submission from '../models/SubmissionModel.js';
import Testimonial from '../models/TestimonialModel.js';
import About from '../models/AboutModel.js';

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

async function getAuthUser(req) {
  const auth = req.headers.authorization || req.headers.Authorization;
  console.log('Auth Header:', auth ? 'Present' : 'Missing');

  if (!auth?.startsWith('Bearer ')) {
    console.log('Auth error: No Bearer token');
    throw { code: 401, msg: 'No token' };
  }

  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', { userId: decoded.userId });

    const user = await User.findById(decoded.userId || decoded.id);
    if (!user) {
      console.log('Auth error: User not found for ID', decoded.userId);
      throw { code: 401, msg: 'User not found' };
    }
    return user;
  } catch (error) {
    console.error('JWT Verify Error:', error.message);
    throw { code: 401, msg: 'Invalid token' };
  }
}

async function requireAdmin(req) {
  const user = await getAuthUser(req);
  if (!user.isAdmin && user.role !== 'admin') throw { code: 403, msg: 'Admin only' };
  return user;
}

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    const url = new URL(req.url, `http://${req.headers.host}`);
    let path = url.pathname.replace('/api', '') || '/';
    const method = req.method;
    const body = req.body || {};

    console.log(`[${method}] ${path}`);

    // AUTH
    if (method === 'POST' && path === '/auth/login') {
      const { email, password } = body;
      if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, isAdmin: user.isAdmin || user.role === 'admin' } });
    }

    if (method === 'POST' && path === '/auth/signup') {
      const { name, email, password, registrationNumber, phone, stream, section, session } = body;
      if (await User.findOne({ email })) return res.status(400).json({ message: 'Email exists' });

      const user = new User({ name, email, password, registrationNumber, phone, stream, section, session });
      await user.save();

      const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, isAdmin: user.isAdmin } });
    }

    if (method === 'GET' && path === '/auth/me') {
      const user = await getAuthUser(req);
      return res.json({ id: user._id, name: user.name, email: user.email, role: user.role, isAdmin: user.isAdmin || user.role === 'admin' });
    }

    // EVENTS
    if (method === 'GET' && path === '/events') {
      const events = await Event.find().sort({ date: -1 });
      return res.json(events);
    }

    if (method === 'GET' && path.startsWith('/events/') && !path.includes('/register') && !path.includes('/registrations') && !path.includes('/check-registration')) {
      const id = path.split('/')[2];
      let event = mongoose.Types.ObjectId.isValid(id) ? await Event.findById(id) : await Event.findOne({ slug: id });
      if (!event) return res.status(404).json({ message: 'Event not found' });
      return res.json(event);
    }

    if (method === 'POST' && path === '/events') {
      await requireAdmin(req);
      const event = new Event(body);
      await event.save();
      return res.status(201).json(event);
    }

    if (method === 'PUT' && path.startsWith('/events/')) {
      await requireAdmin(req);
      const id = path.split('/')[2];
      const event = await Event.findByIdAndUpdate(id, body, { new: true });
      if (!event) return res.status(404).json({ message: 'Event not found' });
      return res.json(event);
    }

    if (method === 'DELETE' && path.startsWith('/events/')) {
      await requireAdmin(req);
      const id = path.split('/')[2];
      await Event.findByIdAndDelete(id);
      return res.json({ message: 'Deleted' });
    }

    // EVENT REGISTRATION
    if (method === 'POST' && path.includes('/register')) {
      const eventId = path.split('/')[2];
      let event = mongoose.Types.ObjectId.isValid(eventId) ? await Event.findById(eventId) : await Event.findOne({ slug: eventId });
      if (!event) return res.status(404).json({ message: 'Event not found' });

      const required = ['name', 'registrationNo', 'phoneNumber', 'course', 'section', 'year', 'department'];
      const missing = required.filter(f => !body[f]);
      if (missing.length) return res.status(400).json({ message: `Missing: ${missing.join(', ')}` });

      const regNo = body.registrationNo.trim().toUpperCase();
      if (await EventRegistration.findOne({ event: event._id, registrationNo: regNo })) {
        return res.status(400).json({ message: 'This registration number is already registered for this event', error: 'DUPLICATE_REGISTRATION' });
      }

      try {
        const user = await getAuthUser(req);
        if (await EventRegistration.findOne({ event: event._id, user: user._id })) {
          return res.status(400).json({ message: 'You have already registered for this event', error: 'DUPLICATE_REGISTRATION' });
        }
      } catch (e) { }

      const reg = new EventRegistration({
        event: event._id,
        user: null,
        name: body.name.trim(),
        registrationNo: regNo,
        phoneNumber: body.phoneNumber.trim(),
        whatsappNumber: body.whatsappNumber?.trim() || body.phoneNumber.trim(),
        section: body.section.trim(),
        department: body.department.trim(),
        year: body.year.trim(),
        course: body.course.trim(),
        isTeamRegistration: body.isTeamRegistration || false,
        teamName: body.teamName?.trim() || null,
        teamMembers: body.teamMembers || [],
        paymentStatus: event.isPaid ? 'pending' : 'free',
        registeredAt: new Date()
      });

      await reg.save();
      await Event.findByIdAndUpdate(event._id, { $inc: { registrationCount: 1 } });
      return res.status(201).json({ success: true, message: 'Registration successful!', registration: { id: reg._id, name: reg.name, eventTitle: event.title } });
    }

    if (method === 'GET' && path.includes('/registrations')) {
      await requireAdmin(req);
      const eventId = path.split('/')[2];
      let event = mongoose.Types.ObjectId.isValid(eventId) ? await Event.findById(eventId) : await Event.findOne({ slug: eventId });
      if (!event) return res.status(404).json({ message: 'Event not found' });

      const regs = await EventRegistration.find({ event: event._id }).populate('user', 'name email').sort({ registeredAt: -1 });
      return res.json(regs);
    }

    if (method === 'GET' && path.includes('/check-registration')) {
      try {
        const eventId = path.split('/')[2];
        const user = await getAuthUser(req);
        let event = mongoose.Types.ObjectId.isValid(eventId) ? await Event.findById(eventId) : await Event.findOne({ slug: eventId });
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const reg = await EventRegistration.findOne({ event: event._id, user: user._id });
        return res.json({ isRegistered: !!reg, registration: reg });
      } catch (e) {
        return res.json({ isRegistered: false });
      }
    }

    if (method === 'GET' && path === '/events/user/registrations') {
      const user = await getAuthUser(req);
      const regs = await EventRegistration.find({ user: user._id }).populate('event').sort({ registeredAt: -1 });
      return res.json(regs);
    }

    // MEMBERS
    if (method === 'GET' && path === '/members') {
      const members = await Member.find().sort({ order: 1 });
      return res.json(members);
    }

    if (method === 'POST' && path === '/members/request') {
      // Public endpoint for member requests
      // We save it to Member model but with a default role
      // Admin can then change the role or delete it
      const memberData = {
        ...body,
        role: 'other', // Default role for requests
        status: 'pending', // Member requests start as pending
        order: 99, // Default order
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const member = new Member(memberData);
      await member.save();
      return res.status(201).json(member);
    }

    if (method === 'POST' && path === '/members') {
      await requireAdmin(req);
      const member = new Member(body);
      await member.save();
      return res.status(201).json(member);
    }

    if (method === 'PUT' && path.startsWith('/members/')) {
      await requireAdmin(req);
      const id = path.split('/')[2];
      const member = await Member.findByIdAndUpdate(id, { ...body, updatedAt: new Date() }, { new: true, runValidators: true });
      if (!member) return res.status(404).json({ message: 'Member not found' });
      return res.json(member);
    }

    if (method === 'DELETE' && path.startsWith('/members/')) {
      await requireAdmin(req);
      const id = path.split('/')[2];
      await Member.findByIdAndDelete(id);
      return res.json({ message: 'Deleted' });
    }

    // SUBMISSIONS
    if (method === 'POST' && path === '/submissions') {
      try {
        // Check for existing registration number
        const existingReg = await Submission.findOne({ registrationNumber: body.registrationNumber });
        if (existingReg) {
          return res.status(400).json({
            error: 'DUPLICATE_REGISTRATION',
            message: `Registration number ${body.registrationNumber} is already registered.`,
            existingSubmission: {
              registrationNumber: existingReg.registrationNumber,
              name: existingReg.name,
              email: existingReg.email,
              status: existingReg.status,
              submittedAt: existingReg.submittedAt
            }
          });
        }

        // Check for existing email
        const existingEmail = await Submission.findOne({ email: body.email });
        if (existingEmail) {
          return res.status(400).json({
            error: 'DUPLICATE_EMAIL',
            message: `Email ${body.email} is already registered.`,
            existingSubmission: {
              registrationNumber: existingEmail.registrationNumber,
              name: existingEmail.name,
              email: existingEmail.email,
              status: existingEmail.status,
              submittedAt: existingEmail.submittedAt
            }
          });
        }

        const sub = new Submission({
          ...body,
          status: body.status || 'pending',
          submittedAt: new Date()
        });
        await sub.save();
        return res.status(201).json({ success: true, message: 'Join request submitted!', submission: sub });
      } catch (error) {
        console.error('Submission creation error:', error);
        return res.status(500).json({
          message: 'Failed to submit join request',
          error: error.message
        });
      }
    }

    if (method === 'GET' && path === '/submissions') {
      await requireAdmin(req);
      const subs = await Submission.find().sort({ submittedAt: -1 });
      return res.json(subs);
    }

    if (method === 'PUT' && path.startsWith('/submissions/')) {
      await requireAdmin(req);
      const id = path.split('/')[2];
      const sub = await Submission.findByIdAndUpdate(id, body, { new: true });
      if (!sub) return res.status(404).json({ message: 'Not found' });
      return res.json(sub);
    }

    if (method === 'DELETE' && path.startsWith('/submissions/')) {
      await requireAdmin(req);
      const id = path.split('/')[2];
      const sub = await Submission.findByIdAndDelete(id);
      if (!sub) return res.status(404).json({ message: 'Submission not found' });
      return res.json({ message: 'Submission deleted successfully', submission: sub });
    }

    // GALLERY
    if (method === 'GET' && path === '/gallery') {
      const items = await Gallery.find().sort({ createdAt: -1 });
      return res.json(items);
    }

    if (method === 'POST' && path === '/gallery') {
      await requireAdmin(req);
      const item = new Gallery(body);
      await item.save();
      return res.status(201).json(item);
    }

    if (method === 'DELETE' && path.startsWith('/gallery/')) {
      await requireAdmin(req);
      const id = path.split('/')[2];
      await Gallery.findByIdAndDelete(id);
      return res.json({ message: 'Deleted' });
    }

    // TESTIMONIALS
    if (method === 'GET' && path === '/testimonials/all') {
      await requireAdmin(req);
      const items = await Testimonial.find().sort({ createdAt: -1 });
      return res.json(items);
    }

    if (method === 'GET' && path === '/testimonials') {
      const items = await Testimonial.find({ status: 'approved' }).sort({ createdAt: -1 });
      return res.json(items);
    }

    if (method === 'POST' && path === '/testimonials/submit') {
      const item = new Testimonial({ ...body, status: 'pending' });
      await item.save();
      return res.status(201).json({ message: 'Submitted for approval' });
    }

    if (method === 'PUT' && path.startsWith('/testimonials/')) {
      await requireAdmin(req);
      const id = path.split('/')[2];
      const item = await Testimonial.findByIdAndUpdate(id, body, { new: true });
      if (!item) return res.status(404).json({ message: 'Not found' });
      return res.json(item);
    }

    if (method === 'DELETE' && path.startsWith('/testimonials/')) {
      await requireAdmin(req);
      const id = path.split('/')[2];
      await Testimonial.findByIdAndDelete(id);
      return res.json({ message: 'Deleted' });
    }

    // HEALTH
    if (method === 'GET' && path === '/health') {
      return res.json({ status: 'OK', timestamp: new Date().toISOString(), mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
    }

    // ABOUT
    if (method === 'GET' && path === '/about') {
      let about = await About.findOne();
      if (!about) {
        about = {
          description: 'Bodh Script Club is a community of passionate developers and tech enthusiasts.',
          mission: 'To foster innovation and learning in technology',
          vision: 'Building the future, one line of code at a time',
          values: ['Innovation', 'Collaboration', 'Excellence'],
          achievements: [],
          stats: []
        };
      }
      return res.json(about);
    }

    if (method === 'PUT' && path === '/about') {
      await requireAdmin(req);
      let about = await About.findOne();
      if (!about) {
        about = new About(body);
      } else {
        Object.assign(about, body);
        about.updatedAt = new Date();
      }
      await about.save();
      return res.json(about);
    }

    return res.status(404).json({ message: 'Endpoint not found', method, path });

  } catch (error) {
    console.error('[API Error]', error);

    // Handle JWT errors specifically
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const code = error.code || error.statusCode || 500;
    const message = error.msg || error.message || 'Server error';
    return res.status(code).json({ success: false, message });
  }
}
