/**
 * Chunk.js
 * MongoDB model for storing individual text chunks from saved resources.
 * Each Link document can have many Chunk documents (1-to-many).
 * The embedding field serves as local fallback when Pinecone is unavailable.
 */

const mongoose = require('mongoose');

const ChunkSchema = new mongoose.Schema({
  linkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Link',
    required: true,
    index: true
  },
  chunkIndex: {
    type: Number,
    required: true,
    default: 0
  },
  chunkText: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    default: []
  },
  // Denormalized from parent Link for faster search fallback
  linkTitle: {
    type: String,
    default: ''
  },
  linkUrl: {
    type: String,
    default: ''
  },
  linkType: {
    type: String,
    enum: ['article', 'pdf', 'image'],
    default: 'article'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient lookup: get all chunks for a link
ChunkSchema.index({ linkId: 1, chunkIndex: 1 });

module.exports = mongoose.model('Chunk', ChunkSchema);
