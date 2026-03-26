/**
 * searchService.js
 * Semantic search via Pinecone chunk vectors (Mistral embeddings).
 * Fallback: cosine similarity on Link.embedding stored in MongoDB.
 *
 * Chunks live only in Pinecone — no MongoDB chunk collection queried here.
 */

const { embedText } = require('./embeddingService');
const { searchChunksInPinecone, cosineSimilarity } = require('./similarityService');
const Link = require('../db/Link');

/**
 * Performs semantic search over Pinecone chunk vectors.
 * Falls back to Link-level cosine similarity when Pinecone is unavailable.
 *
 * @param {string} queryText - The user's search query.
 * @param {number} topLinks  - Max unique links to return (default 5).
 * @returns {Promise<Array>} - Link objects enriched with score + matchedChunkText.
 */
async function performSearch(queryText, topLinks = 5) {
  if (!queryText || queryText.trim().length === 0) return [];

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('MISTRAL_API_KEY missing');

  // ── 1. Embed the query with Mistral (WITH TIMEOUT) ──────────────────────
  const embedPromise = embedText(queryText);
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Embedding request timed out API hang')), 8000)
  );
  const queryVector = await Promise.race([embedPromise, timeoutPromise]);

  // ── 2. Search Pinecone chunk vectors ────────────────────────────────────
  const pineconeHits = await searchChunksInPinecone(queryVector, topLinks * 3);

  if (pineconeHits && pineconeHits.length > 0) {
    // Group chunk hits by parent linkId — keep best scoring chunk per link
    const linkMap = new Map();
    for (const hit of pineconeHits) {
      if (!hit.linkId) continue;
      const current = linkMap.get(hit.linkId);
      if (!current || hit.score > current.score) {
        linkMap.set(hit.linkId, hit);
      }
    }

    const ranked = Array.from(linkMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topLinks);

    if (ranked.length === 0) return [];

    // Fetch full Link documents from MongoDB
    const linkIds = ranked.map(r => r.linkId);
    const links = await Link.find({ _id: { $in: linkIds } });

    return links
      .map(link => {
        const meta = linkMap.get(String(link._id));
        return {
          ...link.toObject(),
          score: meta?.score || 0,
          matchedChunkText: meta?.chunkText || ''
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  // ── 3. Fallback: cosine similarity on Link.embedding (single vector per link) ──
  console.warn('Pinecone unavailable — falling back to Link embedding cosine search.');
  try {
    const allLinks = await Link.find({ embedding: { $exists: true, $ne: [] } });
    return allLinks
      .map(link => ({
        ...link.toObject(),
        score: cosineSimilarity(queryVector, link.embedding),
        matchedChunkText: link.content ? link.content.substring(0, 400) : ''
      }))
      .filter(l => l.score > 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, topLinks);
  } catch (err) {
    console.error('Link-level fallback search error:', err.message);
    return [];
  }
}

module.exports = { performSearch };
