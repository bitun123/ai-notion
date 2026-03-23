const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Link = require('./models/Link');
const Collection = require('./models/Collection');
const Highlight = require('./models/Highlight');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory fallback
let links = [
  { _id: '1', title: 'How to Build a Second Brain', url: 'https://fortelabs.com/blog/how-to-build-a-second-brain/', content: 'A methodology for saving and systematically reminding us of the information we have consumed.', tags: ['productivity', 'knowledge management', 'learning'], createdAt: new Date('2024-01-01'), embedding: new Array(1024).fill(0.1), type: 'article', clusterName: 'Uncategorized' },
  { _id: '2', title: 'React Documentation', url: 'https://react.dev', content: 'The library for web and native user interfaces. Build user interfaces out of individual pieces called components.', tags: ['frontend', 'react', 'javascript'], createdAt: new Date('2024-01-15'), embedding: new Array(1024).fill(0.1).map((v, i) => i < 100 ? 0.2 : 0.1), type: 'article', clusterName: 'Uncategorized' }
];

let memCollections = [
  { _id: 'c1', name: 'Reading List', itemIds: ['1'], createdAt: new Date() },
  { _id: 'c2', name: 'Work', itemIds: [], createdAt: new Date() }
];

let memHighlights = [];
let dbConnected = false;
let dailyResurfaced = [];

// ─── Services (loaded after dotenv) ───────────────────────────────────────────
const { generateTags } = require('./services/aiTagging');
const { upsertToPinecone, getRelatedIds } = require('./services/similarityService');
const { cosineSimilarity } = require('./services/similarityService');
const { performSearch } = require('./services/searchService');
const { getGraphData } = require('./services/graphService');
const { rebuildClusters } = require('./services/clusteringService');
const { detectContentType } = require('./services/contentDetectionService');
const { extractArticle } = require('./services/articleService');
const { extractPdf } = require('./services/pdfService');
const { extractImage } = require('./services/imageService');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  return 'recently';
};

const updateResurfacedItems = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let candidates = [];
    if (dbConnected) {
      candidates = await Link.find({ createdAt: { $lt: sevenDaysAgo } });
    } else {
      candidates = links.filter(l => l.createdAt < sevenDaysAgo);
    }

    if (candidates.length === 0) {
      // If no old items, surface newest
      dailyResurfaced = dbConnected ? await Link.find().sort({ createdAt: -1 }).limit(3) : links.slice(0, 3);
      return;
    }

    const scoredCandidates = candidates.map(c => {
      const ageInDays = (new Date() - new Date(c.createdAt)) / (1000 * 60 * 60 * 24);
      const ageScore = Math.min(ageInDays / 90, 1);
      const tagScore = Math.min((c.tags?.length || 0) / 5, 1);
      const importanceScore = (ageScore * 0.5) + (tagScore * 0.5);
      return {
        ...(c.toObject ? c.toObject() : c),
        baseScore: importanceScore,
        resurfaceReason: `You saved this ${getTimeAgo(new Date(c.createdAt))}`
      };
    });

    scoredCandidates.sort((a, b) => (b.baseScore + Math.random() * 0.2) - (a.baseScore + Math.random() * 0.2));

    const selected = [];
    const similarityThreshold = 0.7;

    for (const item of scoredCandidates) {
      if (selected.length >= 3) break;
      let isTooSimilar = false;
      if (item.embedding && item.embedding.length > 0) {
        for (const picked of selected) {
          if (picked.embedding && picked.embedding.length > 0) {
            const sim = cosineSimilarity(item.embedding, picked.embedding);
            if (sim > similarityThreshold) { isTooSimilar = true; break; }
          }
        }
      }
      if (!isTooSimilar) selected.push(item);
    }

    dailyResurfaced = selected;
    console.log(`Resurfaced ${dailyResurfaced.length} items.`);
  } catch (err) {
    console.error('Resurfacing error:', err);
  }
};

// ─── Cron Job ─────────────────────────────────────────────────────────────────
cron.schedule('0 0 * * *', updateResurfacedItems);

// ─── MongoDB ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/secondbrain')
  .then(() => { console.log('MongoDB Connected'); dbConnected = true; })
  .catch(() => { console.warn('MongoDB unavailable. Using in-memory fallback.'); });

// ═════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// ─── Links ────────────────────────────────────────────────────────────────────
app.get('/api/links', async (req, res) => {
  try {
    if (dbConnected) return res.json(await Link.find().sort({ createdAt: -1 }));
    res.json(links);
  } catch (err) { res.json(links); }
});

// IMPORTANT: specific routes must come before parameterized routes
app.get('/api/links/clustered', async (req, res) => {
  try {
    const allLinks = dbConnected ? await Link.find().sort({ createdAt: -1 }) : links;
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
});

app.post('/api/links', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: 'URL is required' });

  try {
    const type = await detectContentType(url);

    let result;
    if (type === 'pdf') result = await extractPdf(url);
    else if (type === 'image') result = await extractImage(url);
    else result = await extractArticle(url);

    const newLinkData = { title: result.title, url, content: result.content, type, createdAt: new Date() };

    if (dbConnected) {
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
});

app.get('/api/links/:id/related', async (req, res) => {
  try {
    if (!dbConnected) return res.json([]);
    const relatedIds = await getRelatedIds(req.params.id);
    if (!relatedIds?.length) return res.json([]);
    const relatedLinks = await Link.find({ _id: { $in: relatedIds } });
    res.json(relatedLinks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/links/:id/highlights', async (req, res) => {
  try {
    if (dbConnected) return res.json(await Highlight.find({ itemId: req.params.id }).sort({ createdAt: -1 }));
    res.json(memHighlights.filter(h => h.itemId === req.params.id));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Resurface ────────────────────────────────────────────────────────────────
app.get('/api/resurface', (req, res) => res.json(dailyResurfaced));

// ─── Search ───────────────────────────────────────────────────────────────────
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: 'Query is required' });
    const results = await performSearch(query);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Graph ────────────────────────────────────────────────────────────────────
app.get('/api/graph', async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    const data = isConnected ? await getGraphData() : await getGraphData(links);
    res.json(data);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── RAG (Ask your knowledge) ─────────────────────────────────────────────────
app.post('/api/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ message: 'Question is required' });

  try {
    const { ChatMistralAI } = require('@langchain/mistralai');
    const { PromptTemplate } = require('@langchain/core/prompts');
    const { StringOutputParser } = require('@langchain/core/output_parsers');

    // 1. Semantic search for relevant context
    let contextLinks = [];
    try {
      contextLinks = await performSearch(question);
    } catch (e) {
      // fallback: grab recent items
      contextLinks = dbConnected ? await Link.find().sort({ createdAt: -1 }).limit(5) : links.slice(0, 5);
    }

    if (contextLinks.length === 0) {
      return res.json({ answer: "I couldn't find any relevant information in your knowledge base. Try saving some articles first!", sources: [] });
    }

    const context = contextLinks
      .map((l, i) => `[${i + 1}] ${l.title}\n${l.content || ''}`)
      .join('\n\n---\n\n')
      .substring(0, 4000);

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return res.json({ answer: "AI answering requires a MISTRAL_API_KEY. Please configure it in your .env file.", sources: contextLinks });
    }

    const model = new ChatMistralAI({ apiKey, modelName: 'mistral-small-latest', temperature: 0.3 });
    const prompt = PromptTemplate.fromTemplate(`
You are a helpful AI assistant for a "Second Brain" application. 
Answer the user's question ONLY based on the provided knowledge base context.
If the answer isn't in the context, say "I don't have information about that in your knowledge base."
Keep the answer concise, helpful, and insightful.

Context from knowledge base:
{context}

Question: {question}

Answer:`);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const answer = await chain.invoke({ context, question });

    res.json({
      answer: answer.trim(),
      sources: contextLinks.map(l => ({ _id: l._id, title: l.title, url: l.url }))
    });
  } catch (err) {
    console.error('RAG Error:', err);
    res.status(500).json({ message: 'Failed to answer question: ' + err.message });
  }
});

// ─── Collections ──────────────────────────────────────────────────────────────
app.get('/api/collections', async (req, res) => {
  try {
    if (dbConnected) return res.json(await Collection.find().sort({ createdAt: -1 }));
    res.json(memCollections);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/collections', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (dbConnected) {
      const saved = await new Collection({ name }).save();
      return res.status(201).json(saved);
    }
    const newColl = { _id: Date.now().toString(), name, itemIds: [], createdAt: new Date() };
    memCollections.unshift(newColl);
    res.status(201).json(newColl);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.post('/api/collections/:id/add', async (req, res) => {
  try {
    const { linkId } = req.body;
    if (!linkId) return res.status(400).json({ message: 'linkId is required' });
    if (dbConnected) {
      const coll = await Collection.findByIdAndUpdate(req.params.id, { $addToSet: { itemIds: linkId } }, { new: true });
      return res.json(coll);
    }
    const coll = memCollections.find(c => c._id === req.params.id);
    if (!coll) return res.status(404).json({ message: 'Not found' });
    if (!coll.itemIds.includes(linkId)) coll.itemIds.push(linkId);
    res.json(coll);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.get('/api/collections/:id/links', async (req, res) => {
  try {
    if (dbConnected) {
      const coll = await Collection.findById(req.params.id).populate('itemIds');
      if (!coll) return res.status(404).json({ message: 'Not found' });
      return res.json(coll.itemIds);
    }
    const coll = memCollections.find(c => c._id === req.params.id);
    if (!coll) return res.status(404).json({ message: 'Not found' });
    res.json(links.filter(l => coll.itemIds.includes(l._id)));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Highlights ───────────────────────────────────────────────────────────────
app.post('/api/highlights', async (req, res) => {
  try {
    const { itemId, highlightedText, note } = req.body;
    if (!itemId || !highlightedText) return res.status(400).json({ message: 'itemId and highlightedText required' });
    if (dbConnected) {
      const saved = await new Highlight({ itemId, highlightedText, note }).save();
      return res.status(201).json(saved);
    }
    const newH = { _id: Date.now().toString(), itemId, highlightedText, note, createdAt: new Date() };
    memHighlights.unshift(newH);
    res.status(201).json(newH);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/highlights/:id', async (req, res) => {
  try {
    if (dbConnected) {
      if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'Invalid highlight ID format' });
      }
      await Highlight.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Deleted' });
    }
    memHighlights = memHighlights.filter(h => h._id !== req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ─── Clusters ─────────────────────────────────────────────────────────────────
app.post('/api/clusters/rebuild', async (req, res) => {
  try {
    await rebuildClusters();
    res.json({ message: 'Clusters rebuilt successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Server ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  updateResurfacedItems();
});
