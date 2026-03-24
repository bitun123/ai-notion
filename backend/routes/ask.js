const express = require('express');
const router = express.Router();
const { ask } = require('../controllers/askController');

router.post('/', ask);

module.exports = router;
