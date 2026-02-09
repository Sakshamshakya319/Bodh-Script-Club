import Razorpay from 'razorpay';
import crypto from 'crypto';
import connectDB from '../lib/db.js';
import Payment from '../models/PaymentModel.js';
import Event from '../models/EventModel.js';
import EventRegistration from '../models/EventRegistrationModel.js';
import jwt from 'jsonwebtoken';

// Razorpay initialization - environment variables are auto-injected in Vercel
let razorpay;
try {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId || !keySecret) {
    console.error('❌ RAZORPAY credentials missing');
    console.error('   RAZORPAY_KEY_ID:', keyId ? 'SET' : 'NOT SET');
    console.error('   RAZORPAY_KEY_SECRET:', keySecret ? 'SET' : 'NOT SET');
  } else {
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    console.log('✅ Razorpay initialized');
  }
} catch (error) {
  console.error('❌ Razorpay init failed:', error.message);
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

// CORS headers helper
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const handlers = {
  // Create Order
  'POST /create-order': async (req, res) => {
    try {
      await connectDB();
      
      // Check if Razorpay is initialized
      if (!razorpay) {
        return res.status(500).json({ 
          message: 'Payment service not configured',
          error: 'Razorpay credentials missing. Please contact administrator.'
        });
      }

      const decoded = verifyToken(req);
      const { eventId, amount, registrationData } = req.body;

      console.log('📝 Create Order Request:', { eventId, amount, userId: decoded.userId });

      if (!eventId || !amount) {
        return res.status(400).json({ message: 'Event ID and amount are required' });
      }

      // Verify event exists and is paid
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      if (!event.isPaid) {
        return res.status(400).json({ message: 'This event is free' });
      }

      // Create Razorpay order
      const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`, // Keep it short (max 40 chars)
        notes: {
          eventId: eventId,
          userId: decoded.userId,
          userName: registrationData?.name || 'User'
        }
      };

      console.log('🔄 Creating Razorpay order with options:', options);
      const razorpayOrder = await razorpay.orders.create(options);
      console.log('✅ Razorpay order created:', razorpayOrder.id);

      // Save payment record in database
      const payment = new Payment({
        orderId: razorpayOrder.id,
        event: eventId,
        user: decoded.userId,
        userName: registrationData?.name || 'User',
        userEmail: decoded.email,
        registrationNo: registrationData?.registrationNo,
        phoneNumber: registrationData?.phoneNumber,
        amount: amount,
        currency: 'INR',
        status: 'pending',
        createdAt: new Date()
      });

      await payment.save();
      console.log('✅ Payment record saved:', payment._id);

      res.status(200).json({
        success: true,
        order: razorpayOrder,
        paymentId: payment._id
      });
    } catch (error) {
      console.error('❌ Error creating order:', error);
      res.status(500).json({ 
        message: 'Failed to create order', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Verify Payment
  'POST /verify': async (req, res) => {
    await connectDB();
    
    try {
      const decoded = verifyToken(req);
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        registrationData
      } = req.body;

      // Verify signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        // Update payment status to failed
        await Payment.findOneAndUpdate(
          { orderId: razorpay_order_id },
          { 
            status: 'failed',
            updatedAt: new Date()
          }
        );

        return res.status(400).json({ 
          success: false, 
          message: 'Payment verification failed' 
        });
      }

      // Update payment record
      const payment = await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        {
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: 'success',
          paidAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!payment) {
        return res.status(404).json({ 
          success: false, 
          message: 'Payment record not found' 
        });
      }

      // Create event registration
      const registration = new EventRegistration({
        event: payment.event,
        user: decoded.userId,
        name: registrationData.name,
        registrationNo: registrationData.registrationNo,
        phoneNumber: registrationData.phoneNumber,
        whatsappNumber: registrationData.whatsappNumber,
        section: registrationData.section,
        department: registrationData.department,
        year: registrationData.year,
        course: registrationData.course,
        payment: payment._id,
        paymentStatus: 'completed',
        registeredAt: new Date()
      });

      await registration.save();

      // Update payment with registration reference
      payment.registration = registration._id;
      await payment.save();

      // Update event registration count
      await Event.findByIdAndUpdate(payment.event, {
        $inc: { registrationCount: 1 }
      });

      res.status(200).json({
        success: true,
        message: 'Payment verified and registration completed',
        payment: {
          orderId: payment.orderId,
          paymentId: payment.paymentId,
          status: payment.status,
          amount: payment.amount
        },
        registration: {
          id: registration._id,
          name: registration.name,
          registrationNo: registration.registrationNo
        }
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({ 
        success: false,
        message: 'Payment verification failed', 
        error: error.message 
      });
    }
  },

  // Get Payment History (User)
  'GET /history': async (req, res) => {
    try {
      await connectDB();
      
      const decoded = verifyToken(req);
      
      console.log(`📋 Fetching payment history for user: ${decoded.userId}`);

      // Ensure Payment model is loaded
      if (!Payment) {
        console.error('❌ Payment model not loaded');
        return res.status(500).json({ 
          message: 'Payment model not available',
          error: 'MODEL_NOT_LOADED'
        });
      }

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

      console.log(`✅ Found ${payments.length} payments`);

      // Transform data to ensure all fields are present
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
      console.error('❌ Error fetching payment history:', error);
      res.status(500).json({ 
        message: 'Failed to fetch payment history', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Get All Payments (Admin)
  'GET /admin/all': async (req, res) => {
    console.log('🔍 GET /admin/all - Starting request');
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
    
    try {
      // Step 1: Connect to database
      console.log('🔌 Connecting to database...');
      await connectDB();
      console.log('✅ Database connected');
      
      // Step 2: Verify JWT token
      console.log('🔐 Verifying token...');
      let decoded;
      try {
        decoded = verifyToken(req);
        console.log('✅ Token verified:', { userId: decoded.userId, role: decoded.role, isAdmin: decoded.isAdmin });
      } catch (tokenError) {
        console.error('❌ Token verification failed:', tokenError.message);
        return res.status(401).json({ 
          success: false,
          message: 'Authentication failed', 
          error: tokenError.message,
          hint: 'Please login again'
        });
      }
      
      // Step 3: Check admin role
      console.log('👤 Checking admin role...');
      const isAdmin = decoded.role === 'admin' || decoded.isAdmin === true;
      console.log('Admin check result:', { role: decoded.role, isAdmin: decoded.isAdmin, result: isAdmin });
      
      if (!isAdmin) {
        console.error('❌ Access denied - User is not admin');
        return res.status(403).json({ 
          success: false,
          message: 'Access denied',
          error: 'Only admins can access payment history'
        });
      }

      console.log('📋 Fetching all payments (Admin)...');

      // Step 4: Ensure Payment model is loaded
      if (!Payment) {
        console.error('❌ Payment model not loaded');
        return res.status(500).json({ 
          success: false,
          message: 'Payment model not available',
          error: 'MODEL_NOT_LOADED'
        });
      }

      // Step 5: Fetch payments
      console.log('🔄 Querying database for payments...');
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

      console.log(`✅ Found ${payments.length} payments`);

      // Step 6: Transform data to ensure all fields are present
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

      console.log('✅ Sending response with', transformedPayments.length, 'payments');
      res.status(200).json({
        success: true,
        count: transformedPayments.length,
        payments: transformedPayments
      });
    } catch (error) {
      console.error('❌ Error fetching all payments:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch payments', 
        error: error.message,
        errorName: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Get Payments by Event (Admin)
  'GET /admin/event/:eventId': async (req, res) => {
    try {
      await connectDB();
      
      const decoded = verifyToken(req);
      const { eventId } = req.params;
      
      // Check if user is admin
      if (decoded.role !== 'admin' && !decoded.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      console.log(`📋 Fetching payments for event: ${eventId}`);

      // Ensure Payment model is loaded
      if (!Payment) {
        console.error('❌ Payment model not loaded');
        return res.status(500).json({ 
          message: 'Payment model not available',
          error: 'MODEL_NOT_LOADED'
        });
      }

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

      console.log(`✅ Found ${payments.length} payments for event`);

      // Transform data to ensure all fields are present
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
      console.error('❌ Error fetching event payments:', error);
      res.status(500).json({ 
        message: 'Failed to fetch event payments', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
};

export default async function handler(req, res) {
  console.log('\n🚀 ========== PAYMENT API REQUEST ==========');
  console.log('📍 Full URL:', req.url);
  console.log('🔧 Method:', req.method);
  console.log('🌐 Host:', req.headers.host);
  
  setCORSHeaders(res);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return res.status(200).end();
  }

  try {
    // Parse URL and extract path
    const url = new URL(req.url, `http://${req.headers.host}`);
    const fullPath = url.pathname;
    console.log('📂 Full Path:', fullPath);
    
    // Remove /api/payment prefix
    const path = fullPath.replace('/api/payment', '') || '/';
    const route = `${req.method} ${path}`;
    
    console.log('🎯 Route to match:', route);
    console.log('🗝️  Available handlers:', Object.keys(handlers).join(', '));
    
    // Check environment variables
    console.log('🔐 JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : '❌ NOT SET');
    console.log('🔐 MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : '❌ NOT SET');
    
    let matchedHandler = handlers[route];
    
    if (!matchedHandler) {
      console.log('🔍 Trying pattern matching...');
      for (const [pattern, patternHandler] of Object.entries(handlers)) {
        const [method, patternPath] = pattern.split(' ');
        
        if (method !== req.method) continue;
        
        const regexPattern = patternPath.replace(/:[^/]+/g, '([^/]+)');
        const regex = new RegExp(`^${regexPattern}$`);
        const match = path.match(regex);
        
        if (match) {
          console.log('✅ Pattern matched:', pattern);
          const paramNames = (patternPath.match(/:[^/]+/g) || []).map(p => p.substring(1));
          req.params = {};
          paramNames.forEach((name, index) => {
            req.params[name] = match[index + 1];
          });
          
          matchedHandler = patternHandler;
          break;
        }
      }
    } else {
      console.log('✅ Exact match found for route:', route);
    }
    
    if (!matchedHandler) {
      console.error('❌ No handler found for route:', route);
      return res.status(404).json({
        success: false,
        message: 'Payment API endpoint not found',
        route: route,
        availableRoutes: Object.keys(handlers)
      });
    }

    console.log('🚀 Executing handler...');
    await matchedHandler(req, res);
    console.log('✅ Handler execution completed');
    
  } catch (error) {
    console.error('❌ ========== PAYMENT API ERROR ==========');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.message === 'No token provided' || error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: error.message,
        errorType: error.name
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR',
      errorType: error.name
    });
  } finally {
    console.log('========================================\n');
  }
}
