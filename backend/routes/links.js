const express = require('express');
const router = express.Router();
const {
  saveLinkController,
  getLinksController,
  deleteLinkController
} = require('../controllers/linksController');

// IMPORTANT: specific routes must come before parameterized routes



router.post('/', saveLinkController);
router.get('/', getLinksController);
router.delete('/:id', deleteLinkController);

module.exports = router;
