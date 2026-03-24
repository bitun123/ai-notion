const { rebuildClusters } = require('../services/clusteringService');

const rebuild = async (req, res) => {
  try {
    await rebuildClusters();
    res.json({ message: 'Clusters rebuilt successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { rebuild };
