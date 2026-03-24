const express = require('express');
const router = express.Router();
const {
  getLinks,
  getClusteredLinks,
  saveLink,
  getRelatedItems,
  getHighlightsByLink,
} = require('../controllers/linksController');

// IMPORTANT: specific routes must come before parameterized routes
router.get('/', getLinks);
router.get('/clustered', getClusteredLinks);
router.post('/', saveLink);
router.get('/:id/related', getRelatedItems);
router.get('/:id/highlights', getHighlightsByLink);

module.exports = router;
