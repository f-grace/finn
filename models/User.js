const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Role & Institution
  role: {
    type: String,
    enum: ['student', 'alumni', 'faculty', 'admin', 'employer'],
    default: 'student'
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  graduationYear: Number,
  major: String,
  minor: String,
  gpa: Number,
  
  // Professional Profile
  professionalProfile: {
    headline: String,
    bio: {
      type: String,
      maxlength: 1000
    },
    avatar: String,
    coverPhoto: String,
    location: {
      city: String,
      state: String,
      country: String
    },
    website: String,
    linkedin: String,
    github: String,
    portfolio: String
  },
  
  // Career Information
  career: {
    currentPosition: String,
    currentCompany: String,
    industry: String,
    yearsOfExperience: Number,
    skills: [String],
    interests: [String],
    salaryRange: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' }
    },
    openToOpportunities: {
      type: Boolean,
      default: false
    },
    remotePreference: {
      type: String,
      enum: ['remote', 'hybrid', 'onsite', 'flexible'],
      default: 'flexible'
    }
  },
  
  // Work Experience
  workExperience: [{
    title: String,
    company: String,
    location: String,
    startDate: Date,
    endDate: Date,
    current: { type: Boolean, default: false },
    description: String,
    achievements: [String]
  }],
  
  // Education
  education: [{
    degree: String,
    field: String,
    institution: String,
    startDate: Date,
    endDate: Date,
    gpa: Number,
    honors: [String]
  }],
  
  // Certifications
  certifications: [{
    name: String,
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String
  }],
  
  // Networking & Connections
  connections: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'blocked'],
      default: 'pending'
    },
    connectedAt: Date,
    relationship: {
      type: String,
      enum: ['classmate', 'alumni', 'mentor', 'mentee', 'colleague', 'friend'],
      default: 'alumni'
    }
  }],
  
  // Outreach & Communication
  outreachHistory: [{
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['connection', 'mentorship', 'job-inquiry', 'informational-interview'],
      default: 'connection'
    },
    status: {
      type: String,
      enum: ['sent', 'read', 'replied', 'accepted', 'declined'],
      default: 'sent'
    },
    message: String,
    sentAt: Date,
    repliedAt: Date,
    followUpDate: Date,
    notes: String
  }],
  
  // Job Search & Applications
  jobApplications: [{
    position: String,
    company: String,
    applicationDate: Date,
    status: {
      type: String,
      enum: ['applied', 'interviewing', 'offered', 'accepted', 'rejected'],
      default: 'applied'
    },
    source: String, // How they found the job
    contactPerson: String,
    notes: String,
    followUpDate: Date
  }],
  
  // Mentorship
  mentorship: {
    isMentor: { type: Boolean, default: false },
    isMentee: { type: Boolean, default: false },
    mentorPreferences: [String],
    menteePreferences: [String],
    availability: [{
      day: String,
      timeSlots: [String]
    }]
  },
  
  // Preferences & Settings
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'connections', 'private'], default: 'connections' },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false }
    },
    communication: {
      allowOutreach: { type: Boolean, default: true },
      autoResponder: { type: Boolean, default: false },
      autoResponderMessage: String
    }
  },
  
  // Verification & Status
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Analytics & Tracking
  analytics: {
    profileViews: { type: Number, default: 0 },
    connectionRequests: { type: Number, default: 0 },
    messagesSent: { type: Number, default: 0 },
    messagesReceived: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Get connection count
userSchema.virtual('connectionCount').get(function() {
  return this.connections.filter(conn => conn.status === 'accepted').length;
});

// Remove sensitive data from JSON response
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationToken;
  delete user.resetPasswordToken;
  return user;
};

// Update last active
userSchema.methods.updateLastActive = function() {
  this.analytics.lastActive = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);