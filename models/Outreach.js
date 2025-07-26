const mongoose = require('mongoose');

const outreachSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OutreachCampaign'
  },
  type: {
    type: String,
    enum: [
      'connection-request',
      'mentorship-request',
      'job-inquiry',
      'informational-interview',
      'referral-request',
      'general-networking',
      'follow-up'
    ],
    default: 'connection-request'
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'delivered', 'read', 'replied', 'accepted', 'declined', 'bounced'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Message content
  subject: String,
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  personalization: {
    recipientName: String,
    recipientCompany: String,
    recipientPosition: String,
    sharedConnections: [String],
    sharedInterests: [String],
    mutualAlumni: Boolean
  },
  
  // Timing and scheduling
  scheduledFor: Date,
  sentAt: Date,
  readAt: Date,
  repliedAt: Date,
  followUpDate: Date,
  
  // Response tracking
  response: {
    message: String,
    action: {
      type: String,
      enum: ['accepted', 'declined', 'maybe', 'referred', 'no-response'],
      default: 'no-response'
    },
    nextSteps: String,
    notes: String
  },
  
  // Follow-up sequence
  followUps: [{
    message: String,
    scheduledFor: Date,
    sentAt: Date,
    status: {
      type: String,
      enum: ['scheduled', 'sent', 'read', 'replied'],
      default: 'scheduled'
    },
    response: String
  }],
  
  // Tags and categorization
  tags: [String],
  category: {
    type: String,
    enum: ['warm-lead', 'cold-outreach', 'referral', 'alumni', 'mentor'],
    default: 'cold-outreach'
  },
  
  // Analytics
  analytics: {
    openCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    responseTime: Number, // in hours
    engagementScore: { type: Number, default: 0 }
  },
  
  // Notes and reminders
  notes: String,
  reminders: [{
    date: Date,
    message: String,
    completed: { type: Boolean, default: false }
  }],
  
  // Integration with other systems
  externalId: String, // For CRM integration
  source: String // How this outreach was initiated
}, {
  timestamps: true
});

// Indexes for efficient querying
outreachSchema.index({ sender: 1, status: 1 });
outreachSchema.index({ recipient: 1, status: 1 });
outreachSchema.index({ scheduledFor: 1, status: 1 });
outreachSchema.index({ followUpDate: 1 });

// Virtual for response time
outreachSchema.virtual('responseTimeHours').get(function() {
  if (this.sentAt && this.repliedAt) {
    return (this.repliedAt - this.sentAt) / (1000 * 60 * 60);
  }
  return null;
});

// Pre-save middleware to update status timestamps
outreachSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    switch (this.status) {
      case 'sent':
        this.sentAt = new Date();
        break;
      case 'read':
        this.readAt = new Date();
        break;
      case 'replied':
        this.repliedAt = new Date();
        break;
    }
  }
  next();
});

// Method to calculate engagement score
outreachSchema.methods.calculateEngagementScore = function() {
  let score = 0;
  
  if (this.status === 'read') score += 10;
  if (this.status === 'replied') score += 25;
  if (this.status === 'accepted') score += 50;
  
  if (this.response && this.response.action === 'accepted') score += 25;
  if (this.response && this.response.action === 'referred') score += 30;
  
  score += this.analytics.openCount * 5;
  score += this.analytics.clickCount * 10;
  
  this.analytics.engagementScore = Math.min(score, 100);
  return this.save();
};

// Static method to find overdue follow-ups
outreachSchema.statics.findOverdueFollowUps = function() {
  return this.find({
    followUpDate: { $lt: new Date() },
    status: { $in: ['sent', 'read', 'replied'] },
    'followUps.status': { $ne: 'sent' }
  }).populate('sender recipient');
};

module.exports = mongoose.model('Outreach', outreachSchema);