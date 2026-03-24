const { performSearch } = require('../services/searchService');

const search = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: 'Query is required' });
    const results = await performSearch(query);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { search };
