const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'text', 'quiz', 'assignment', 'live'],
    default: 'video'
  },
  content: {
    video: {
      url: String,
      duration: Number, // in seconds
      thumbnail: String,
      transcript: String
    },
    text: {
      content: String,
      attachments: [{
        name: String,
        url: String,
        type: String
      }]
    },
    quiz: {
      questions: [{
        question: String,
        type: {
          type: String,
          enum: ['multiple-choice', 'true-false', 'short-answer'],
          default: 'multiple-choice'
        },
        options: [String],
        correctAnswer: String,
        points: {
          type: Number,
          default: 1
        }
      }],
      passingScore: {
        type: Number,
        default: 70
      },
      timeLimit: Number // in minutes
    },
    assignment: {
      description: String,
      dueDate: Date,
      maxPoints: Number,
      submissionType: {
        type: String,
        enum: ['file', 'text', 'link'],
        default: 'text'
      }
    }
  },
  description: {
    type: String,
    maxlength: 500
  },
  isFree: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  materials: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  notes: String,
  completionCriteria: {
    type: String,
    enum: ['watch', 'complete-quiz', 'submit-assignment', 'manual'],
    default: 'watch'
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  tags: [String],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 0
  }
}, {
  timestamps: true
});

// Auto-increment order within course
lessonSchema.pre('save', async function(next) {
  if (!this.isModified('order')) return next();
  
  if (!this.order) {
    const lastLesson = await this.constructor.findOne({ course: this.course })
      .sort({ order: -1 });
    this.order = lastLesson ? lastLesson.order + 1 : 1;
  }
  
  next();
});

module.exports = mongoose.model('Lesson', lessonSchema);