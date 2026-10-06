const express = require('express');
const HelpTicket = require('../../models/HelpTicket');
const User = require('../../models/User');
const { authenticateToken } = require('../../middleware/auth');
const { logEvent } = require('../../services/securityLogger');

const router = express.Router();

// Helper to enforce admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. System Administrator clearance required.' });
  }
  next();
};

// 1. Submit a new Help Ticket (Doctors, Crew, Patients)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const rawMessage = req.body.message || req.body.description;
    const { subject, category, priority, patientQrCodeId } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Subject is required' });
    }
    if (!rawMessage || !rawMessage.trim()) {
      return res.status(400).json({ error: 'Detailed message description is required' });
    }

    const user = await User.findById(req.user.userId).lean();
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    // Generate unique readable Ticket ID, e.g. TKT-7K9A-402
    const ticketId = `TKT-${Date.now().toString(36).toUpperCase().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;

    const validCategories = [
      'EMERGENCY_OVERRIDE',
      'MEDICATION_SAFETY',
      'IDENTITY_MISMATCH',
      'SYSTEM_TECHNICAL',
      'ACCOUNT_VERIFICATION',
      'MEDICAL_RECORD',
      'QR_BADGE',
      'PROFILE_UPDATE',
      'GENERAL_ASSISTANCE'
    ];
    const ticketCategory = validCategories.includes(category) ? category : 'GENERAL_ASSISTANCE';

    const validPriorities = ['NORMAL', 'HIGH', 'CRITICAL'];
    const ticketPriority = validPriorities.includes(priority) ? priority : 'NORMAL';

    const ticket = await HelpTicket.create({
      ticketId,
      requesterId: user._id,
      requesterName: user.name || 'Practitioner',
      requesterEmail: user.email,
      requesterRole: user.role,
      patientQrCodeId: (patientQrCodeId || '').trim(),
      category: ticketCategory,
      priority: ticketPriority,
      subject: subject.trim(),
      message: rawMessage.trim(),
      status: 'PENDING'
    });

    logEvent('HELP_TICKET_CREATED', {
      ticketId: ticket.ticketId,
      userId: user._id,
      role: user.role,
      priority: ticket.priority,
      category: ticket.category
    });

    // Notify connected admin via Socket.IO if available
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin:all').emit('help-ticket-created', {
          ticketId: ticket.ticketId,
          requesterName: ticket.requesterName,
          requesterRole: ticket.requesterRole,
          subject: ticket.subject,
          priority: ticket.priority,
          createdAt: ticket.createdAt
        });
      }
    } catch (e) {
      console.warn('Socket notification error for help ticket:', e.message);
    }

    res.status(201).json({
      message: 'Help request submitted successfully. LifeQR administrators have been notified.',
      ticket
    });
  } catch (error) {
    console.error('Error creating help ticket:', error);
    res.status(500).json({ error: 'Failed to submit help ticket' });
  }
});

// 2. Get tickets created by the logged-in user
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const tickets = await HelpTicket.find({ requesterId: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ tickets });
  } catch (error) {
    console.error('Error fetching user help tickets:', error);
    res.status(500).json({ error: 'Failed to retrieve your tickets' });
  }
});

// 3. Admin: Get all tickets with optional filtering
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, priority, role } = req.query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (priority && priority !== 'ALL') {
      filter.priority = priority;
    }
    if (role && role !== 'ALL') {
      filter.requesterRole = role;
    }

    const tickets = await HelpTicket.find(filter)
      .sort({ createdAt: -1 })
      .populate('resolvedBy', 'name email')
      .lean();

    const pendingCount = await HelpTicket.countDocuments({ status: 'PENDING' });
    const inProgressCount = await HelpTicket.countDocuments({ status: 'IN_PROGRESS' });
    const resolvedCount = await HelpTicket.countDocuments({ status: 'RESOLVED' });
    const criticalCount = await HelpTicket.countDocuments({ priority: 'CRITICAL', status: { $ne: 'RESOLVED' } });

    res.json({
      tickets,
      counts: {
        total: tickets.length,
        pending: pendingCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        critical: criticalCount
      }
    });
  } catch (error) {
    console.error('Error fetching admin tickets:', error);
    res.status(500).json({ error: 'Failed to retrieve help tickets' });
  }
});

// 4. Admin: Update Ticket Status & Admin Resolution Notes
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid ticket status' });
    }

    // Look up by _id or ticketId
    const ticket = await HelpTicket.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { ticketId: id }]
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Help ticket not found' });
    }

    if (status) ticket.status = status;
    if (typeof adminNotes === 'string') ticket.adminNotes = adminNotes.trim();

    if (status === 'RESOLVED') {
      ticket.resolvedBy = req.user.userId;
      ticket.resolvedAt = new Date();
    }

    await ticket.save();

    logEvent('HELP_TICKET_UPDATED', {
      ticketId: ticket.ticketId,
      updatedBy: req.user.userId,
      newStatus: ticket.status
    });

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${ticket.requesterId}`).emit('help-ticket-updated', {
          ticketId: ticket.ticketId,
          status: ticket.status,
          adminNotes: ticket.adminNotes
        });
      }
    } catch (e) {}

    res.json({
      message: 'Help ticket updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Error updating help ticket:', error);
    res.status(500).json({ error: 'Failed to update help ticket' });
  }
});

module.exports = router;
