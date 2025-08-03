const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Playlist = require('../models/Playlist');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Validation middleware
const validatePlaylistCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Playlist name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

const validatePlaylistId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid playlist ID')
];

const validateSongData = [
  body('title').notEmpty().withMessage('Song title is required'),
  body('channelTitle').notEmpty().withMessage('Channel title is required'),
  body('thumbnails').isObject().withMessage('Thumbnails object is required'),
  body('duration').notEmpty().withMessage('Duration is required'),
  body('publishedAt').notEmpty().withMessage('Published date is required')
];

// @desc    Create a new playlist
// @route   POST /api/playlists
// @access  Private
router.post('/', validatePlaylistCreation, async (req, res) => {
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

    const { name, description } = req.body;

    // Create playlist
    const playlist = await Playlist.create({
      name,
      description,
      owner: req.user.id
    });

    // Add playlist to user's playlists array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { playlists: playlist._id }
    });

    await playlist.populate('owner', 'username email');

    res.status(201).json({
      success: true,
      message: 'Playlist created successfully',
      data: {
        playlist
      }
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating playlist'
    });
  }
});

// @desc    Get all playlists for current user
// @route   GET /api/playlists/me
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.user.id })
      .populate('owner', 'username email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: playlists.length,
      data: {
        playlists
      }
    });
  } catch (error) {
    console.error('Get user playlists error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching playlists'
    });
  }
});

// @desc    Get a specific playlist
// @route   GET /api/playlists/:id
// @access  Private
router.get('/:id', validatePlaylistId, async (req, res) => {
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

    const playlist = await Playlist.findById(req.params.id)
      .populate('owner', 'username email');

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check if user has permission to view playlist
    if (playlist.owner._id.toString() !== req.user.id && !playlist.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this playlist'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        playlist
      }
    });
  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching playlist'
    });
  }
});

// @desc    Update playlist details
// @route   PUT /api/playlists/:id
// @access  Private
router.put('/:id', validatePlaylistId, validatePlaylistCreation, async (req, res) => {
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

    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check if user owns the playlist
    if (playlist.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own playlists'
      });
    }

    const { name, description } = req.body;
    
    playlist.name = name;
    playlist.description = description;
    await playlist.save();

    await playlist.populate('owner', 'username email');

    res.status(200).json({
      success: true,
      message: 'Playlist updated successfully',
      data: {
        playlist
      }
    });
  } catch (error) {
    console.error('Update playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating playlist'
    });
  }
});

// @desc    Add song to playlist
// @route   PUT /api/playlists/:id/add-song
// @access  Private
router.put('/:id/add-song', validatePlaylistId, validateSongData, async (req, res) => {
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

    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check if user owns the playlist
    if (playlist.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only add songs to your own playlists'
      });
    }

    const { songId, ...songData } = req.body;
    const songToAdd = { id: songId, ...songData };

    // Add song to playlist
    const wasAdded = playlist.addSong(songToAdd);

    if (!wasAdded) {
      return res.status(400).json({
        success: false,
        message: 'Song is already in this playlist'
      });
    }

    await playlist.save();
    await playlist.populate('owner', 'username email');

    res.status(200).json({
      success: true,
      message: 'Song added to playlist successfully',
      data: {
        playlist
      }
    });
  } catch (error) {
    console.error('Add song to playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding song to playlist'
    });
  }
});

// @desc    Remove song from playlist
// @route   DELETE /api/playlists/:id/remove-song/:songId
// @access  Private
router.delete('/:id/remove-song/:songId', validatePlaylistId, async (req, res) => {
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

    const { id, songId } = req.params;
    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check if user owns the playlist
    if (playlist.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only remove songs from your own playlists'
      });
    }

    // Remove song from playlist
    const wasRemoved = playlist.removeSong(songId);

    if (!wasRemoved) {
      return res.status(400).json({
        success: false,
        message: 'Song not found in this playlist'
      });
    }

    await playlist.save();
    await playlist.populate('owner', 'username email');

    res.status(200).json({
      success: true,
      message: 'Song removed from playlist successfully',
      data: {
        playlist
      }
    });
  } catch (error) {
    console.error('Remove song from playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing song from playlist'
    });
  }
});

// @desc    Delete playlist
// @route   DELETE /api/playlists/:id
// @access  Private
router.delete('/:id', validatePlaylistId, async (req, res) => {
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

    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check if user owns the playlist
    if (playlist.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own playlists'
      });
    }

    // Remove playlist from user's playlists array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { playlists: playlist._id }
    });

    // Delete the playlist
    await Playlist.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Playlist deleted successfully'
    });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting playlist'
    });
  }
});

module.exports = router;