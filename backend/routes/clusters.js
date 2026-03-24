const express = require('express');
const router = express.Router();
const { rebuild } = require('../controllers/clusterController');

router.post('/rebuild', rebuild);

module.exports = router;
