const express = require('express');
const router = express.Router();
const { getResurfaced } = require('../controllers/resurfaceController');

router.get('/', getResurfaced);

module.exports = router;
