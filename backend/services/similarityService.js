/**
 * similarityService.js
 * Handles all Pinecone vector store operations at the CHUNK level.
 * Each chunk from a saved resource gets its own embedding and Pinecone record.
 * Metadata includes linkId so we can reconstruct parent links from search results.
 */

const { Pinecone } = require('@pinecone-database/pinecone');
const { embedText } = require('./embeddingService');
const Chunk = require('../db/Chunk');
const Link = require('../db/Link');

/**
 * Returns an initialized Pinecone index or null if credentials are missing.
 */
async function getPineconeIndex() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX;

  if (!apiKey || !indexName) return null;

  try {
    const pc = new Pinecone({ apiKey });
    // Note: .index() is a reference. Validating existence can be slow,
    // so we handle 404s during actual operations instead.
    return pc.index(indexName);
  } catch (err) {
    console.error('Pinecone initialization failed:', err.message);
    return null;
  }
}

/**
 * Upserts all chunks of a link into Pinecone.
 * Each chunk becomes one vector with metadata for later retrieval.
 *
 * @param {object} link - The saved Link document (Mongoose doc or plain object).
 * @param {Array<{ text: string, chunkIndex: number, embedding: number[] }>} embeddedChunks
 */
async function upsertChunksToPinecone(link, embeddedChunks) {
  const linkId = String(link?._id || 'unknown');
  if (!embeddedChunks || embeddedChunks.length === 0) {
    console.log(`ℹ️ No embedded chunks to upsert for link: ${linkId}`);
    return false;
  }

  const index = await getPineconeIndex();
  if (!index) {
    console.warn(`⚠️ Pinecone index not available — skipping vector upsert for ${link?._id}`);
    return false;
  }

  const vectors = embeddedChunks
    .filter(c => Array.isArray(c.embedding) && c.embedding.length === 1024)
    .map(c => ({
      // Unique ID per chunk: {linkId}_{chunkIndex}
      id: `${String(link._id)}_${c.chunkIndex}`,
      values: c.embedding,
      metadata: {
        linkId: String(link._id),
        title: link.title || '',
        url: link.url || '',
        type: link.type || 'article',
        chunkIndex: c.chunkIndex,
        chunkText: (c.text || '').substring(0, 500) // Pinecone metadata limit
      }
    }));

  if (vectors.length === 0) {
    console.warn(`⚠️ RAG Skip: No valid vectors (1024 dims) found in embeddedChunks for link: ${linkId}`);
    return false;
  }

  console.log(`\n==================================================`);
  console.log(`📡 PINECONE: Preparing to upsert ${vectors.length} vectors for link ${linkId}`);
  console.log(`==================================================`);

  try {
    // Final sanity check on records
    const validVectors = vectors.filter(v => 
      v.id && 
      Array.isArray(v.values) && 
      v.values.length === 1024 &&
      !v.values.some(isNaN)
    );

    if (validVectors.length === 0) {
      console.error(`❌ PINECONE: All ${vectors.length} vectors failed final validation! Skipping upsert.`);
      return false;
    }

    if (validVectors.length !== vectors.length) {
      console.warn(`⚠️ PINECONE: ${vectors.length - validVectors.length} vectors were invalid and removed.`);
    }

    // Pinecone upsert in batches of 100
    let upsertedCount = 0;
    for (let i = 0; i < validVectors.length; i += 100) {
      const batch = validVectors.slice(i, i + 100);
      
      console.log(`   🔸 PINECONE: Sending batch of ${batch.length} vectors...`);
      
      // ABSOLUTE GUARD: Never call upsert with empty array
      if (batch.length > 0) {
        await index.upsert(batch);
        upsertedCount += batch.length;
      } else {
        console.warn(`   ⚠️ PINECONE: Batch at index ${i} is empty. Skipping.`);
      }
    }
    console.log(`✅ PINECONE: Successfully stored ${upsertedCount} chunk(s) for ${linkId}.`);
    console.log(`==================================================\n`);
    return upsertedCount;
  } catch (err) {
    if (err.message.includes('404')) {
      console.error(`❌ Pinecone Error: Index "${process.env.PINECONE_INDEX}" not found (404). Please check your configuration.`);
    } else {
      console.error('Pinecone upsert error:', err.message);
    }
    return false;
  }
}

/**
 * Queries Pinecone for chunks similar to a given text query.
 * Returns structured results grouped by parent link.
 *
 * @param {number[]} queryVector - The embedding of the user's query.
 * @param {number} topK - Number of chunk matches to retrieve.
 * @returns {Promise<Array<{ linkId: string, chunkText: string, score: number, title: string, url: string, type: string }>>}
 */
async function searchChunksInPinecone(queryVector, topK = 10) {
  const index = await getPineconeIndex();
  if (!index) return null;

  try {
    const response = await index.query({
      vector: queryVector,
      topK,
      includeMetadata: true
    });

    return response.matches.map(m => ({
      linkId: m.metadata?.linkId,
      chunkText: m.metadata?.chunkText || '',
      score: m.score || 0,
      title: m.metadata?.title || '',
      url: m.metadata?.url || '',
      type: m.metadata?.type || 'article',
      chunkIndex: m.metadata?.chunkIndex
    }));
  } catch (err) {
    console.error('Pinecone search error:', err.message);
    return null;
  }
}

/**
 * Finds related link IDs for a given link using Pinecone.
 * Fetches the first chunk's vector, then queries for similar chunks.
 *
 * @param {string} linkId - MongoDB Link ID string.
 * @returns {Promise<string[]>} - Array of related link IDs (excluding input linkId).
 */
async function getRelatedIds(linkId) {
  const index = await getPineconeIndex();
  if (!index) return [];

  try {
    // Fetch the first chunk vector for this link
    const zeroChunkId = `${linkId}_0`;
    const fetchResponse = await index.fetch([zeroChunkId]);
    const vector = fetchResponse.records?.[zeroChunkId]?.values;

    if (!vector) {
      console.warn(`No Pinecone vector found for linkId: ${linkId}`);
      return [];
    }

    const response = await index.query({
      vector,
      topK: 20,
      includeMetadata: true
    });

    // Deduplicate and exclude the source linkId
    const seen = new Set([linkId]);
    const relatedIds = [];
    for (const match of response.matches) {
      const mid = match.metadata?.linkId;
      if (mid && !seen.has(mid)) {
        seen.add(mid);
        relatedIds.push(mid);
        if (relatedIds.length >= 3) break;
      }
    }

    return relatedIds;
  } catch (err) {
    console.error('Pinecone related IDs error:', err.message);
    return [];
  }
}

/**
 * Calculates cosine similarity between two vectors.
 * Used as MongoDB fallback when Pinecone is unavailable.
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Deletes all chunk vectors for a given linkId from Pinecone.
 * Uses the naming convention: {linkId}_{chunkIndex}
 * @param {string} linkId - The MongoDB Link ID string.
 * @param {number} chunkCount - How many chunks were stored (from Link.chunkCount).
 */
async function deleteChunksFromPinecone(linkId, chunkCount = 20) {
  const index = await getPineconeIndex();
  if (!index) return;

  try {
    // Build all possible chunk IDs for this link
    const ids = [];
    for (let i = 0; i < Math.max(chunkCount, 1); i++) {
      ids.push(`${linkId}_${i}`);
    }

    // Pinecone delete in batches of 100
    for (let i = 0; i < ids.length; i += 100) {
      await index.deleteMany(ids.slice(i, i + 100));
    }
    console.log(`🗑️ Deleted ${ids.length} Pinecone chunk vector(s) for link: ${linkId}`);
  } catch (err) {
    console.error('Pinecone delete error:', err.message);
  }
}

module.exports = {
  upsertChunksToPinecone,
  searchChunksInPinecone,
  getRelatedIds,
  cosineSimilarity,
  deleteChunksFromPinecone
};
