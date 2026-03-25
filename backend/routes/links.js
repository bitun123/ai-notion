const express = require('express');
const router = express.Router();
const {
  getLinks,
  getClusteredLinks,
  saveLink,
  uploadPdf,
  deleteLink,
  getRelatedItems,
  getHighlightsByLink,
} = require('../controllers/linksController');

// IMPORTANT: specific routes must come before parameterized routes
router.get('/', getLinks);
router.get('/clustered', getClusteredLinks);
router.post('/', saveLink);
router.post('/upload-pdf', uploadPdf); // PDF file upload
router.delete('/:id', deleteLink);     // Delete a link
router.get('/:id/related', getRelatedItems);
router.get('/:id/highlights', getHighlightsByLink);

module.exports = router;
