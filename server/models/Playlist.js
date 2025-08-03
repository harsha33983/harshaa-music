const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Playlist name is required'],
    trim: true,
    maxlength: [100, 'Playlist name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  songs: [{
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
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Playlist must have an owner']
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
playlistSchema.index({ owner: 1 });
playlistSchema.index({ name: 1, owner: 1 });

// Instance method to check if song exists in playlist
playlistSchema.methods.hasSong = function(songId) {
  return this.songs.some(song => song.songId === songId);
};

// Instance method to add song to playlist
playlistSchema.methods.addSong = function(songData) {
  if (!this.hasSong(songData.id)) {
    this.songs.push({
      songId: songData.id,
      title: songData.title,
      channelTitle: songData.channelTitle,
      thumbnails: songData.thumbnails,
      duration: songData.duration,
      publishedAt: songData.publishedAt
    });
    return true;
  }
  return false;
};

// Instance method to remove song from playlist
playlistSchema.methods.removeSong = function(songId) {
  const initialLength = this.songs.length;
  this.songs = this.songs.filter(song => song.songId !== songId);
  return this.songs.length < initialLength;
};

// Virtual for song count
playlistSchema.virtual('songCount').get(function() {
  return this.songs.length;
});

// Ensure virtual fields are serialized
playlistSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Playlist', playlistSchema);