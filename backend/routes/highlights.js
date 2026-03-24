const express = require('express');
const router = express.Router();
const { createHighlight, deleteHighlight } = require('../controllers/highlightsController');

router.post('/', createHighlight);
router.delete('/:id', deleteHighlight);

module.exports = router;
