const express = require('express');
const router = express.Router();
const {
  getCollections,
  createCollection,
  addToCollection,
  getCollectionLinks,
} = require('../controllers/collectionsController');

router.get('/', getCollections);
router.post('/', createCollection);
router.post('/:id/add', addToCollection);
router.get('/:id/links', getCollectionLinks);

module.exports = router;
