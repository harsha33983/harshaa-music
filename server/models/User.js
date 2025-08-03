const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  likedSongs: [{
    songId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    channelTitle: {
      type: String,
      required: true
    },
    thumbnails: {
      default: {
        url: String,
        width: Number,
        height: Number
      },
      medium: {
        url: String,
        width: Number,
        height: Number
      },
      high: {
        url: String,
        width: Number,
        height: Number
      }
    },
    duration: String,
    publishedAt: String,
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  playlists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist'
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if user has liked a song
userSchema.methods.hasLikedSong = function(songId) {
  return this.likedSongs.some(song => song.songId === songId);
};

// Instance method to add liked song
userSchema.methods.addLikedSong = function(songData) {
  if (!this.hasLikedSong(songData.id)) {
    this.likedSongs.push({
      songId: songData.id,
      title: songData.title,
      channelTitle: songData.channelTitle,
      thumbnails: songData.thumbnails,
      duration: songData.duration,
      publishedAt: songData.publishedAt
    });
  }
};

// Instance method to remove liked song
userSchema.methods.removeLikedSong = function(songId) {
  this.likedSongs = this.likedSongs.filter(song => song.songId !== songId);
};

module.exports = mongoose.model('User', userSchema);