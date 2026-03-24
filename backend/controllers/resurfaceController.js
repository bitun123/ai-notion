const { getDailyResurfaced } = require('../utils/resurfaceUtils');

const getResurfaced = (req, res) => {
  res.json(getDailyResurfaced());
};

module.exports = { getResurfaced };
