const Link = require('../db/Link');
const { isConnected } = require('../db/connection');
const { cosineSimilarity } = require('../services/similarityService');
const { getTimeAgo } = require('./timeUtils');

// In-memory store for resurfaced items (shared state)
let dailyResurfaced = [];

const updateResurfacedItems = async (memLinks = []) => {
  try {
    const dbConnected = isConnected();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let candidates = [];
    if (dbConnected) {
      candidates = await Link.find({ createdAt: { $lt: sevenDaysAgo } });
    } else {
      candidates = memLinks.filter(l => l.createdAt < sevenDaysAgo);
    }

    if (candidates.length === 0) {
      dailyResurfaced = dbConnected
        ? await Link.find().sort({ createdAt: -1 }).limit(3)
        : memLinks.slice(0, 3);
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
        resurfaceReason: `You saved this ${getTimeAgo(new Date(c.createdAt))}`,
      };
    });

    scoredCandidates.sort(
      (a, b) => (b.baseScore + Math.random() * 0.2) - (a.baseScore + Math.random() * 0.2)
    );

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

const getDailyResurfaced = () => dailyResurfaced;

module.exports = { updateResurfacedItems, getDailyResurfaced };
