const mongoose = require('mongoose');

const CollectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  userId: {
    type: String,
    default: 'default-user',
  },
  itemIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Link',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Collection', CollectionSchema);
