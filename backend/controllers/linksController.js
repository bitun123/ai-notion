const Link = require('../db/Link');
const Highlight = require('../db/Highlight');
const { isConnected } = require('../db/connection');
const { generateTags } = require('../services/aiTagging');
const { upsertToPinecone, getRelatedIds } = require('../services/similarityService');
const { detectContentType } = require('../services/contentDetectionService');
const { extractArticle } = require('../services/articleService');
const { extractPdf } = require('../services/pdfService');
const { extractImage } = require('../services/imageService');

// In-memory fallback data
let links = [
  { _id: '1', title: 'How to Build a Second Brain', url: 'https://fortelabs.com/blog/how-to-build-a-second-brain/', content: 'A methodology for saving and systematically reminding us of the information we have consumed.', tags: ['productivity', 'knowledge management', 'learning'], createdAt: new Date('2024-01-01'), embedding: new Array(1024).fill(0.1), type: 'article', clusterName: 'Uncategorized' },
  { _id: '2', title: 'React Documentation', url: 'https://react.dev', content: 'The library for web and native user interfaces. Build user interfaces out of individual pieces called components.', tags: ['frontend', 'react', 'javascript'], createdAt: new Date('2024-01-15'), embedding: new Array(1024).fill(0.1).map((v, i) => i < 100 ? 0.2 : 0.1), type: 'article', clusterName: 'Uncategorized' }
];

const getMemLinks = () => links;

const getLinks = async (req, res) => {
  try {
    if (isConnected()) return res.json(await Link.find().sort({ createdAt: -1 }));
    res.json(links);
  } catch { res.json(links); }
};

const getClusteredLinks = async (req, res) => {
  try {
    const allLinks = isConnected() ? await Link.find().sort({ createdAt: -1 }) : links;
    const clusters = {};
    allLinks.forEach(link => {
      const topic = link.clusterName || 'Uncategorized';
      if (!clusters[topic]) clusters[topic] = [];
      clusters[topic].push(link.toObject ? link.toObject() : link);
    });
    res.json(clusters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const saveLink = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: 'URL is required' });

  try {
    const type = await detectContentType(url);

    let result;
    if (type === 'pdf') result = await extractPdf(url);
    else if (type === 'image') result = await extractImage(url);
    else result = await extractArticle(url);

    const newLinkData = { title: result.title, url, content: result.content, type, createdAt: new Date() };

    if (isConnected()) {
      const link = new Link(newLinkData);
      const savedLink = await link.save();
      generateTags(result.title, result.content).then(async (tags) => {
        if (tags?.length > 0) await Link.findByIdAndUpdate(savedLink._id, { tags });
      }).catch(err => console.error('Tagging Error:', err));
      upsertToPinecone(savedLink).catch(err => console.error('Pinecone Error:', err));
      return res.status(201).json(savedLink);
    }

    const memLink = { ...newLinkData, _id: Date.now().toString(), tags: [], clusterName: 'Uncategorized' };
    links.unshift(memLink);
    res.status(201).json(memLink);
  } catch (err) {
    console.error('Save Link Error:', err);
    res.status(400).json({ message: err.message });
  }
};

const getRelatedItems = async (req, res) => {
  try {
    if (!isConnected()) return res.json([]);
    const relatedIds = await getRelatedIds(req.params.id);
    if (!relatedIds?.length) return res.json([]);
    const relatedLinks = await Link.find({ _id: { $in: relatedIds } });
    res.json(relatedLinks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getHighlightsByLink = async (req, res) => {
  try {
    if (isConnected()) return res.json(await Highlight.find({ itemId: req.params.id }).sort({ createdAt: -1 }));
    const { getMemHighlights } = require('./highlightsController');
    res.json(getMemHighlights().filter(h => h.itemId === req.params.id));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getLinks, getClusteredLinks, saveLink, getRelatedItems, getHighlightsByLink, getMemLinks };
