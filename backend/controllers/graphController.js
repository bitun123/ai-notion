const mongoose = require('mongoose');
const { getGraphData } = require('../services/graphService');
const { getMemLinks } = require('./linksController');

const getGraph = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const data = isDbConnected ? await getGraphData() : await getGraphData(getMemLinks());
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getGraph };
