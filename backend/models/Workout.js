const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  exercise: {
    type: String,
    required: [true, 'Exercise type is required'],
    enum: ['bicep-curls', 'arm-circles', 'shoulder-press', 'squats', 'jumping-jacks']
  },
  exerciseName: {
    type: String,
    required: [true, 'Exercise name is required']
  },
  reps: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Reps cannot be negative']
  },
  calories: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Calories cannot be negative']
  },
  duration: {
    type: Number, // in seconds
    required: true,
    default: 0,
    min: [0, 'Duration cannot be negative']
  },
  accuracy: {
    type: Number,
    default: 0,
    min: [0, 'Accuracy cannot be negative'],
    max: [100, 'Accuracy cannot exceed 100']
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
workoutSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Workout', workoutSchema);
