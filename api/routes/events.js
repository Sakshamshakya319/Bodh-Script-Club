import express from 'express';
import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import xlsx from 'xlsx';

const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    
    // Get registration counts for each event
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await EventRegistration.countDocuments({ 
          event: event._id, 
          status: 'confirmed' 
        });
        return {
          ...event.toObject(),
          registrationCount
        };
      })
    );
    
    res.json(eventsWithCounts);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user's registrations (requires auth) - MUST BE BEFORE /:id
router.get('/user/registrations', authenticate, async (req, res) => {
  try {
    console.log('Fetching registrations for user:', req.user._id);
    
    const registrations = await EventRegistration.find({ 
      user: req.user._id,
      status: 'confirmed'
    })
      .populate('event')
      .sort({ registeredAt: -1 });
    
    console.log('Found registrations:', registrations.length);
    res.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Get registration count
    const registrationCount = await EventRegistration.countDocuments({ event: req.params.id, status: 'confirmed' });
    
    res.json({ ...event.toObject(), registrationCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if user is registered for event
router.get('/:id/check-registration', authenticate, async (req, res) => {
  try {
    const registration = await EventRegistration.findOne({ 
      event: req.params.id, 
      user: req.user._id,
      status: 'confirmed'
    });
    res.json({ isRegistered: !!registration });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register for event (requires auth)
router.post('/:id/register', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if already registered
    const existingRegistration = await EventRegistration.findOne({
      event: req.params.id,
      user: req.user._id
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Check max attendees
    if (event.maxAttendees) {
      const currentCount = await EventRegistration.countDocuments({ event: req.params.id, status: 'confirmed' });
      if (currentCount >= event.maxAttendees) {
        return res.status(400).json({ message: 'Event is full' });
      }
    }

    // Create registration
    const registration = new EventRegistration({
      event: req.params.id,
      user: req.user._id,
      ...req.body
    });

    await registration.save();

    res.status(201).json({ message: 'Registration successful', registration });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get registrations for an event (admin only)
router.get('/:id/registrations', authenticate, isAdmin, async (req, res) => {
  try {
    console.log('Fetching registrations for event:', req.params.id);
    
    const registrations = await EventRegistration.find({ 
      event: req.params.id, 
      status: 'confirmed' 
    })
      .populate('user', 'email')
      .sort({ registeredAt: -1 });
    
    console.log('Found registrations:', registrations.length);
    res.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export registrations to Excel (admin only)
router.get('/:id/registrations/export', authenticate, isAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    const registrations = await EventRegistration.find({ event: req.params.id, status: 'confirmed' })
      .populate('user', 'email')
      .sort({ registeredAt: -1 });

    // Prepare data for Excel
    const data = registrations.map((reg, index) => ({
      'S.No': index + 1,
      'Name': reg.name,
      'Registration No': reg.registrationNo,
      'Email': reg.user?.email || 'N/A',
      'Phone Number': reg.phoneNumber,
      'WhatsApp Number': reg.whatsappNumber,
      'Section': reg.section,
      'Department': reg.department,
      'Year': reg.year,
      'Registered At': new Date(reg.registeredAt).toLocaleString()
    }));

    // Create workbook
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 25 }, // Name
      { wch: 18 }, // Registration No
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 15 }, // WhatsApp
      { wch: 10 }, // Section
      { wch: 20 }, // Department
      { wch: 8 },  // Year
      { wch: 20 }  // Registered At
    ];

    xlsx.utils.book_append_sheet(wb, ws, 'Registrations');

    // Generate buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers
    res.setHeader('Content-Disposition', `attachment; filename="${event.title.replace(/[^a-z0-9]/gi, '_')}_registrations.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create event (admin only)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json({ message: 'Event created', event });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update event (admin only)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Event updated', event });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete event (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    console.log('Deleting event:', req.params.id);
    
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const deletedRegistrations = await EventRegistration.deleteMany({ event: req.params.id });
    console.log('Deleted registrations:', deletedRegistrations.deletedCount);
    
    res.json({ 
      message: 'Event deleted successfully',
      deletedRegistrations: deletedRegistrations.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
