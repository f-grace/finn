const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: ['university', 'college', 'community-college', 'technical-school'],
    default: 'university'
  },
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  contact: {
    email: String,
    phone: String,
    website: String
  },
  branding: {
    logo: String,
    colors: {
      primary: String,
      secondary: String,
      accent: String
    },
    customDomain: String
  },
  
  // Subscription & Billing
  subscription: {
    plan: {
      type: String,
      enum: ['starter', 'professional', 'enterprise'],
      default: 'starter'
    },
    status: {
      type: String,
      enum: ['active', 'trial', 'expired', 'cancelled'],
      default: 'trial'
    },
    startDate: Date,
    endDate: Date,
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual'],
      default: 'annual'
    },
    price: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  
  // Features & Limits
  features: {
    maxStudents: Number,
    maxAlumni: Number,
    maxFaculty: Number,
    customBranding: { type: Boolean, default: false },
    advancedAnalytics: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    whiteLabel: { type: Boolean, default: false },
    dedicatedSupport: { type: Boolean, default: false }
  },
  
  // Academic Programs
  programs: [{
    name: String,
    type: {
      type: String,
      enum: ['undergraduate', 'graduate', 'certificate', 'diploma'],
      default: 'undergraduate'
    },
    department: String,
    duration: Number, // in years
    isActive: { type: Boolean, default: true }
  }],
  
  // Career Services
  careerServices: {
    departmentName: String,
    staff: [{
      name: String,
      title: String,
      email: String,
      phone: String
    }],
    services: [{
      name: String,
      description: String,
      isActive: { type: Boolean, default: true }
    }],
    resources: [{
      name: String,
      type: String,
      url: String,
      description: String
    }]
  },
  
  // Alumni Relations
  alumniRelations: {
    departmentName: String,
    staff: [{
      name: String,
      title: String,
      email: String,
      phone: String
    }],
    events: [{
      name: String,
      date: Date,
      location: String,
      description: String,
      isActive: { type: Boolean, default: true }
    }]
  },
  
  // Analytics & Metrics
  analytics: {
    totalStudents: { type: Number, default: 0 },
    totalAlumni: { type: Number, default: 0 },
    totalFaculty: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    jobPlacementRate: { type: Number, default: 0 },
    averageSalary: { type: Number, default: 0 },
    topIndustries: [{
      industry: String,
      count: Number
    }],
    topCompanies: [{
      company: String,
      count: Number
    }],
    connectionRate: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 }
  },
  
  // Settings & Configuration
  settings: {
    allowStudentRegistration: { type: Boolean, default: true },
    allowAlumniRegistration: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false },
    defaultPrivacySettings: {
      profileVisibility: { type: String, enum: ['public', 'connections', 'private'], default: 'connections' },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false }
    },
    customFields: [{
      name: String,
      type: { type: String, enum: ['text', 'number', 'select', 'date'], default: 'text' },
      required: { type: Boolean, default: false },
      options: [String] // for select type
    }],
    integrations: {
      lms: {
        enabled: { type: Boolean, default: false },
        type: String, // Canvas, Blackboard, etc.
        apiKey: String,
        apiUrl: String
      },
      crm: {
        enabled: { type: Boolean, default: false },
        type: String, // Salesforce, HubSpot, etc.
        apiKey: String,
        apiUrl: String
      }
    }
  },
  
  // Admin Users
  admins: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['super-admin', 'admin', 'moderator'],
      default: 'admin'
    },
    permissions: [String]
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate slug from name
institutionSchema.pre('save', function(next) {
  if (!this.isModified('name')) return next();
  
  this.slug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  next();
});

// Update analytics
institutionSchema.methods.updateAnalytics = async function() {
  const User = require('./User');
  
  const [students, alumni, faculty] = await Promise.all([
    User.countDocuments({ institution: this._id, role: 'student' }),
    User.countDocuments({ institution: this._id, role: 'alumni' }),
    User.countDocuments({ institution: this._id, role: 'faculty' })
  ]);
  
  this.analytics.totalStudents = students;
  this.analytics.totalAlumni = alumni;
  this.analytics.totalFaculty = faculty;
  
  return this.save();
};

module.exports = mongoose.model('Institution', institutionSchema);