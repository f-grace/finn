const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Connection = require('../models/Connection');
const Outreach = require('../models/Outreach');
const Institution = require('../models/Institution');

const router = express.Router();

// @route   GET /api/networking/discover
// @desc    Discover potential connections (alumni, mentors, etc.)
// @access  Private
router.get('/discover', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('institution');
    const { 
      role, 
      industry, 
      company, 
      location, 
      skills, 
      graduationYear,
      page = 1,
      limit = 20 
    } = req.query;

    // Build search criteria
    const searchCriteria = {
      _id: { $ne: user._id }, // Exclude self
      institution: user.institution._id,
      isActive: true
    };

    if (role) searchCriteria.role = role;
    if (industry) searchCriteria['career.industry'] = { $regex: industry, $options: 'i' };
    if (company) searchCriteria['career.currentCompany'] = { $regex: company, $options: 'i' };
    if (location) {
      searchCriteria['professionalProfile.location.city'] = { $regex: location, $options: 'i' };
    }
    if (skills) {
      searchCriteria['career.skills'] = { $in: skills.split(',').map(s => s.trim()) };
    }
    if (graduationYear) {
      searchCriteria.graduationYear = parseInt(graduationYear);
    }

    // Find users
    const users = await User.find(searchCriteria)
      .select('firstName lastName professionalProfile career graduationYear major role')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'analytics.lastActive': -1 });

    // Get connection status for each user
    const usersWithConnectionStatus = await Promise.all(
      users.map(async (potentialConnection) => {
        const connection = await Connection.findOne({
          $or: [
            { requester: user._id, recipient: potentialConnection._id },
            { requester: potentialConnection._id, recipient: user._id }
          ]
        });

        return {
          ...potentialConnection.toJSON(),
          connectionStatus: connection ? connection.status : 'none',
          mutualConnections: connection ? connection.mutualConnections.length : 0
        };
      })
    );

    const total = await User.countDocuments(searchCriteria);

    res.json({
      users: usersWithConnectionStatus,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Discover error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/networking/connect
// @desc    Send connection request
// @access  Private
router.post('/connect', [
  auth,
  body('recipientId').isMongoId().withMessage('Valid recipient ID required'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message too long'),
  body('relationship').optional().isIn(['classmate', 'alumni', 'mentor', 'mentee', 'colleague', 'friend', 'professional'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipientId, message, relationship = 'alumni' } = req.body;
    const senderId = req.user.userId;

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: senderId, recipient: recipientId },
        { requester: recipientId, recipient: senderId }
      ]
    });

    if (existingConnection) {
      return res.status(400).json({ 
        message: 'Connection already exists',
        status: existingConnection.status 
      });
    }

    // Create new connection request
    const connection = new Connection({
      requester: senderId,
      recipient: recipientId,
      message,
      relationship
    });

    await connection.save();

    // Update user analytics
    await User.findByIdAndUpdate(senderId, {
      $inc: { 'analytics.connectionRequests': 1 }
    });

    // Populate user details for response
    await connection.populate('requester recipient', 'firstName lastName professionalProfile');

    res.status(201).json({
      message: 'Connection request sent successfully',
      connection
    });

  } catch (error) {
    console.error('Connect error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/networking/connections/:connectionId
// @desc    Accept/decline connection request
// @access  Private
router.put('/connections/:connectionId', [
  auth,
  body('action').isIn(['accept', 'decline']).withMessage('Action must be accept or decline'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { connectionId } = req.params;
    const { action, message } = req.body;
    const userId = req.user.userId;

    const connection = await Connection.findById(connectionId);
    
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    if (connection.recipient.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Connection request already processed' });
    }

    // Update connection status
    connection.status = action === 'accept' ? 'accepted' : 'declined';
    connection.respondedAt = new Date();
    
    if (action === 'accept') {
      connection.acceptedAt = new Date();
    }

    await connection.save();

    // Update user connections arrays
    if (action === 'accept') {
      await Promise.all([
        User.findByIdAndUpdate(connection.requester, {
          $push: {
            connections: {
              user: connection.recipient,
              status: 'accepted',
              connectedAt: new Date(),
              relationship: connection.relationship
            }
          }
        }),
        User.findByIdAndUpdate(connection.recipient, {
          $push: {
            connections: {
              user: connection.requester,
              status: 'accepted',
              connectedAt: new Date(),
              relationship: connection.relationship
            }
          }
        })
      ]);
    }

    await connection.populate('requester recipient', 'firstName lastName professionalProfile');

    res.json({
      message: `Connection ${action}ed successfully`,
      connection
    });

  } catch (error) {
    console.error('Connection response error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/networking/connections
// @desc    Get user's connections
// @access  Private
router.get('/connections', auth, async (req, res) => {
  try {
    const { status = 'accepted', page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;

    const connections = await Connection.find({
      $or: [
        { requester: userId, status },
        { recipient: userId, status }
      ]
    })
    .populate('requester recipient', 'firstName lastName professionalProfile career graduationYear major')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Connection.countDocuments({
      $or: [
        { requester: userId, status },
        { recipient: userId, status }
      ]
    });

    res.json({
      connections,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/networking/outreach
// @desc    Send outreach message
// @access  Private
router.post('/outreach', [
  auth,
  body('recipientId').isMongoId().withMessage('Valid recipient ID required'),
  body('type').isIn(['connection-request', 'mentorship-request', 'job-inquiry', 'informational-interview', 'referral-request', 'general-networking']),
  body('message').isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters'),
  body('subject').optional().isLength({ max: 100 }).withMessage('Subject too long'),
  body('scheduledFor').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      recipientId, 
      type, 
      message, 
      subject, 
      scheduledFor,
      priority = 'medium',
      tags = []
    } = req.body;
    const senderId = req.user.userId;

    // Check if recipient exists and is active
    const recipient = await User.findById(recipientId);
    if (!recipient || !recipient.isActive) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Create outreach
    const outreach = new Outreach({
      sender: senderId,
      recipient: recipientId,
      type,
      message,
      subject,
      priority,
      tags,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
      status: scheduledFor ? 'draft' : 'sent'
    });

    await outreach.save();

    // Update analytics
    await User.findByIdAndUpdate(senderId, {
      $inc: { 'analytics.messagesSent': 1 }
    });

    await outreach.populate('sender recipient', 'firstName lastName professionalProfile');

    res.status(201).json({
      message: 'Outreach sent successfully',
      outreach
    });

  } catch (error) {
    console.error('Outreach error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/networking/outreach
// @desc    Get user's outreach history
// @access  Private
router.get('/outreach', auth, async (req, res) => {
  try {
    const { 
      type, 
      status, 
      page = 1, 
      limit = 20,
      direction = 'sent' // sent or received
    } = req.query;
    const userId = req.user.userId;

    const query = direction === 'sent' 
      ? { sender: userId }
      : { recipient: userId };

    if (type) query.type = type;
    if (status) query.status = status;

    const outreach = await Outreach.find(query)
      .populate('sender recipient', 'firstName lastName professionalProfile')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Outreach.countDocuments(query);

    res.json({
      outreach,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get outreach error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/networking/alumni-map
// @desc    Get alumni distribution by location/company
// @access  Private
router.get('/alumni-map', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('institution');
    
    const alumni = await User.find({
      institution: user.institution._id,
      role: { $in: ['alumni', 'faculty'] },
      isActive: true,
      'professionalProfile.location.city': { $exists: true, $ne: '' }
    })
    .select('professionalProfile.location career.currentCompany graduationYear major')
    .limit(1000);

    // Group by location
    const locationMap = {};
    const companyMap = {};

    alumni.forEach(alum => {
      const location = alum.professionalProfile.location;
      const company = alum.career.currentCompany;
      
      if (location && location.city) {
        const key = `${location.city}, ${location.state || location.country}`;
        if (!locationMap[key]) {
          locationMap[key] = {
            location: key,
            count: 0,
            alumni: []
          };
        }
        locationMap[key].count++;
        locationMap[key].alumni.push({
          id: alum._id,
          name: `${alum.firstName} ${alum.lastName}`,
          company: company,
          graduationYear: alum.graduationYear,
          major: alum.major
        });
      }

      if (company) {
        if (!companyMap[company]) {
          companyMap[company] = {
            company,
            count: 0,
            alumni: []
          };
        }
        companyMap[company].count++;
        companyMap[company].alumni.push({
          id: alum._id,
          name: `${alum.firstName} ${alum.lastName}`,
          location: location ? `${location.city}, ${location.state || location.country}` : '',
          graduationYear: alum.graduationYear,
          major: alum.major
        });
      }
    });

    res.json({
      locations: Object.values(locationMap).sort((a, b) => b.count - a.count),
      companies: Object.values(companyMap).sort((a, b) => b.count - a.count)
    });

  } catch (error) {
    console.error('Alumni map error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;