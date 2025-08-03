const express = require('express');
const { body, param, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Validation middleware
const validateSongId = [
  param('id')
    .notEmpty()
    .withMessage('Song ID is required')
];

const validateSongData = [
  body('title').notEmpty().withMessage('Song title is required'),
  body('channelTitle').notEmpty().withMessage('Channel title is required'),
  body('thumbnails').isObject().withMessage('Thumbnails object is required'),
  body('duration').notEmpty().withMessage('Duration is required'),
  body('publishedAt').notEmpty().withMessage('Published date is required')
];

// @desc    Get all liked songs for current user
// @route   GET /api/songs/me/liked
// @access  Private
router.get('/me/liked', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      count: user.likedSongs.length,
      data: {
        likedSongs: user.likedSongs.sort((a, b) => new Date(b.likedAt) - new Date(a.likedAt))
      }
    });
  } catch (error) {
    console.error('Get liked songs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching liked songs'
    });
  }
});

// @desc    Like a song
// @route   POST /api/songs/:id/like
// @access  Private
router.post('/:id/like', validateSongId, validateSongData, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const songData = { id, ...req.body };

    const user = await User.findById(req.user.id);

    // Check if song is already liked
    if (user.hasLikedSong(id)) {
      return res.status(400).json({
        success: false,
        message: 'Song is already in your liked songs'
      });
    }

    // Add song to liked songs
    user.addLikedSong(songData);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Song added to liked songs',
      data: {
        likedSongs: user.likedSongs
      }
    });
  } catch (error) {
    console.error('Like song error:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking song'
    });
  }
});

// @desc    Unlike a song
// @route   DELETE /api/songs/:id/unlike
// @access  Private
router.delete('/:id/unlike', validateSongId, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const user = await User.findById(req.user.id);

    // Check if song is liked
    if (!user.hasLikedSong(id)) {
      return res.status(400).json({
        success: false,
        message: 'Song is not in your liked songs'
      });
    }

    // Remove song from liked songs
    user.removeLikedSong(id);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Song removed from liked songs',
      data: {
        likedSongs: user.likedSongs
      }
    });
  } catch (error) {
    console.error('Unlike song error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unliking song'
    });
  }
});

// @desc    Check if song is liked
// @route   GET /api/songs/:id/liked
// @access  Private
router.get('/:id/liked', validateSongId, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        isLiked: user.hasLikedSong(id)
      }
    });
  } catch (error) {
    console.error('Check liked song error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking if song is liked'
    });
  }
});

module.exports = router;