const Highlight = require('../db/Highlight');
const { isConnected } = require('../db/connection');

let memHighlights = [];

const getMemHighlights = () => memHighlights;

const createHighlight = async (req, res) => {
  try {
    const { itemId, highlightedText, note } = req.body;
    if (!itemId || !highlightedText) return res.status(400).json({ message: 'itemId and highlightedText required' });
    if (isConnected()) {
      const saved = await new Highlight({ itemId, highlightedText, note }).save();
      return res.status(201).json(saved);
    }
    const newH = { _id: Date.now().toString(), itemId, highlightedText, note, createdAt: new Date() };
    memHighlights.unshift(newH);
    res.status(201).json(newH);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

const deleteHighlight = async (req, res) => {
  try {
    if (isConnected()) {
      if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'Invalid highlight ID format' });
      }
      await Highlight.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Deleted' });
    }
    memHighlights = memHighlights.filter(h => h._id !== req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: err.message }); }
};

module.exports = { createHighlight, deleteHighlight, getMemHighlights };
