const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'expired'],
    default: 'active'
  },
  progress: {
    completedLessons: [{
      lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      score: Number, // for quizzes/assignments
      timeSpent: Number // in seconds
    }],
    currentLesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    totalTimeSpent: {
      type: Number,
      default: 0 // in minutes
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    }
  },
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issuedAt: Date,
    certificateId: String,
    downloadUrl: String
  },
  payment: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    paymentMethod: String,
    transactionId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    }
  },
  accessExpiry: Date,
  notes: String
}, {
  timestamps: true
});

// Ensure unique enrollment per student per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Update completion percentage
enrollmentSchema.methods.updateProgress = function() {
  const totalLessons = this.course.lessons ? this.course.lessons.length : 0;
  if (totalLessons > 0) {
    this.progress.completionPercentage = Math.round(
      (this.progress.completedLessons.length / totalLessons) * 100
    );
  }
  
  if (this.progress.completionPercentage >= 100) {
    this.status = 'completed';
  }
  
  return this.save();
};

// Mark lesson as completed
enrollmentSchema.methods.completeLesson = function(lessonId, score = null, timeSpent = 0) {
  const existingCompletion = this.progress.completedLessons.find(
    completion => completion.lesson.toString() === lessonId.toString()
  );
  
  if (!existingCompletion) {
    this.progress.completedLessons.push({
      lesson: lessonId,
      score,
      timeSpent
    });
  }
  
  this.progress.lastAccessed = new Date();
  this.progress.totalTimeSpent += timeSpent;
  
  return this.updateProgress();
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);