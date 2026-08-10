const express = require('express');
const Workout = require('../models/Workout');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/workouts
// @desc    Save a new workout
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { exercise, exerciseName, reps, calories, duration, accuracy } = req.body;

    // Validate required fields
    if (!exercise || !exerciseName) {
      return res.status(400).json({ message: 'Exercise type and name are required' });
    }

    const workout = await Workout.create({
      userId: req.user._id,
      exercise,
      exerciseName,
      reps: reps || 0,
      calories: calories || 0,
      duration: duration || 0,
      accuracy: accuracy || 0
    });

    console.log(`✅ Workout saved: ${exerciseName} - ${reps} reps`);

    res.status(201).json(workout);
  } catch (error) {
    console.error('Save workout error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/workouts
// @desc    Get all workouts for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 50, skip = 0, exercise } = req.query;

    const query = { userId: req.user._id };
    if (exercise) {
      query.exercise = exercise;
    }

    const workouts = await Workout.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Workout.countDocuments(query);

    res.json({
      workouts,
      total,
      hasMore: skip + workouts.length < total
    });
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/workouts/stats
// @desc    Get workout statistics for user
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await Workout.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalReps: { $sum: '$reps' },
          totalCalories: { $sum: '$calories' },
          totalDuration: { $sum: '$duration' },
          avgAccuracy: { $avg: '$accuracy' }
        }
      }
    ]);

    // Get workout breakdown by exercise
    const exerciseBreakdown = await Workout.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$exercise',
          exerciseName: { $first: '$exerciseName' },
          count: { $sum: 1 },
          totalReps: { $sum: '$reps' },
          totalCalories: { $sum: '$calories' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await Workout.aggregate([
      { 
        $match: { 
          userId: req.user._id,
          date: { $gte: sevenDaysAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          workouts: { $sum: 1 },
          calories: { $sum: '$calories' },
          reps: { $sum: '$reps' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      overview: stats[0] || {
        totalWorkouts: 0,
        totalReps: 0,
        totalCalories: 0,
        totalDuration: 0,
        avgAccuracy: 0
      },
      exerciseBreakdown,
      recentActivity
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/workouts/:id
// @desc    Get single workout
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.json(workout);
  } catch (error) {
    console.error('Get workout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/workouts/:id
// @desc    Delete a workout
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    await workout.deleteOne();

    console.log(`✅ Workout deleted: ${workout.exerciseName}`);

    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
