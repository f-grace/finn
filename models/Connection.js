const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending'
  },
  relationship: {
    type: String,
    enum: ['classmate', 'alumni', 'mentor', 'mentee', 'colleague', 'friend', 'professional'],
    default: 'alumni'
  },
  message: {
    type: String,
    maxlength: 500
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: Date,
  acceptedAt: Date,
  
  // Connection strength and interaction
  interactionHistory: [{
    type: {
      type: String,
      enum: ['message', 'meeting', 'referral', 'endorsement', 'recommendation'],
      default: 'message'
    },
    date: {
      type: Date,
      default: Date.now
    },
    description: String,
    notes: String
  }],
  
  // Tags and categorization
  tags: [String],
  notes: String,
  
  // Mutual connections
  mutualConnections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Professional context
  professionalContext: {
    sharedInstitution: Boolean,
    sharedMajor: Boolean,
    sharedIndustry: Boolean,
    sharedCompany: Boolean,
    graduationYearDifference: Number
  }
}, {
  timestamps: true
});

// Ensure unique connections
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Virtual for connection duration
connectionSchema.virtual('duration').get(function() {
  if (this.acceptedAt) {
    return Date.now() - this.acceptedAt.getTime();
  }
  return null;
});

// Pre-save middleware to update mutual connections
connectionSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'accepted') {
    // Find mutual connections
    const User = require('./User');
    
    const [requesterConnections, recipientConnections] = await Promise.all([
      User.findById(this.requester).select('connections'),
      User.findById(this.recipient).select('connections')
    ]);
    
    const requesterConnectedIds = requesterConnections.connections
      .filter(conn => conn.status === 'accepted')
      .map(conn => conn.user.toString());
    
    const recipientConnectedIds = recipientConnections.connections
      .filter(conn => conn.status === 'accepted')
      .map(conn => conn.user.toString());
    
    // Find mutual connections
    const mutualIds = requesterConnectedIds.filter(id => 
      recipientConnectedIds.includes(id)
    );
    
    this.mutualConnections = mutualIds;
  }
  
  next();
});

// Static method to find mutual connections
connectionSchema.statics.findMutualConnections = async function(userId1, userId2) {
  const User = require('./User');
  
  const [user1, user2] = await Promise.all([
    User.findById(userId1).populate('connections.user'),
    User.findById(userId2).populate('connections.user')
  ]);
  
  const user1Connections = user1.connections
    .filter(conn => conn.status === 'accepted')
    .map(conn => conn.user._id.toString());
  
  const user2Connections = user2.connections
    .filter(conn => conn.status === 'accepted')
    .map(conn => conn.user._id.toString());
  
  const mutualIds = user1Connections.filter(id => user2Connections.includes(id));
  
  return await User.find({ _id: { $in: mutualIds } });
};

module.exports = mongoose.model('Connection', connectionSchema);