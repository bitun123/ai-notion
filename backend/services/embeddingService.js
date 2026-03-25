/**
 * embeddingService.js
 * Centralized Mistral embedding generation.
 * Uses the `mistral-embed` model for all vector embeddings in the RAG pipeline.
 */

const { MistralAIEmbeddings } = require('@langchain/mistralai');

// Mistral embedding dimension is 1024 for mistral-embed
const EMBEDDING_MODEL = 'mistral-embed';

// Batch size — Mistral API may have rate limits; 16 chunks per batch is safe
const BATCH_SIZE = 16;

/**
 * Returns a configured MistralAIEmbeddings instance.
 */
function getEmbeddingModel() {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error('MISTRAL_API_KEY is not configured');
  return new MistralAIEmbeddings({ apiKey, modelName: EMBEDDING_MODEL });
}

/**
 * Generates an embedding vector for a single text string.
 * @param {string} text
 * @returns {Promise<number[]>} - 1024-dimensional embedding vector
 */
async function embedText(text) {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot embed empty text');
  }
  const model = getEmbeddingModel();
  return await model.embedQuery(text.trim());
}

/**
 * Generates embeddings for an array of chunk objects.
 * Processes in batches to avoid rate limits.
 * @param {Array<{ text: string, chunkIndex: number }>} chunks
 * @returns {Promise<Array<{ text: string, chunkIndex: number, embedding: number[] }>>}
 */
async function embedChunks(chunks) {
  if (!chunks || chunks.length === 0) return [];

  const model = getEmbeddingModel();
  const results = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map(c => c.text.trim());

    try {
      const embeddings = await model.embedDocuments(texts);
      batch.forEach((chunk, idx) => {
        results.push({ ...chunk, embedding: embeddings[idx] });
      });
    } catch (err) {
      console.error(`Embedding batch ${i / BATCH_SIZE + 1} failed:`, err.message);
      // Fallback: try embedding one by one to isolate failures
      for (const chunk of batch) {
        try {
          const embedding = await model.embedQuery(chunk.text.trim());
          results.push({ ...chunk, embedding });
        } catch (singleErr) {
          console.error(`Single embed failed for chunkIndex ${chunk.chunkIndex}:`, singleErr.message);
          results.push({ ...chunk, embedding: [] });
        }
      }
    }
  }

  return results;
}

module.exports = { embedText, embedChunks };
