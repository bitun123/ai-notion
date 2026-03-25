const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ""
  },
  tags: {
    type: [String],
    default: []
  },
  embedding: {
    type: [Number],
    default: []
  },
  clusterId: {
    type: String,
    default: null
  },
  clusterName: {
    type: String,
    default: "Uncategorized"
  },
  type: {
    type: String,
    enum: ['article', 'pdf', 'image'],
    default: 'article'
  },
  chunkCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Link', LinkSchema);
