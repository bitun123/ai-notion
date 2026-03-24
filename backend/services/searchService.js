const { MistralAIEmbeddings } = require("@langchain/mistralai");
const { Pinecone } = require("@pinecone-database/pinecone");
const Link = require("../db/Link");
const { cosineSimilarity } = require("./similarityService");

/**
 * Performs semantic search using Pinecone with a MongoDB fallback.
 */
async function performSearch(queryText) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("MISTRAL_API_KEY missing");

  try {
    const embeddings = new MistralAIEmbeddings({
      apiKey: apiKey,
      modelName: "mistral-embed"
    });

    const queryVector = await embeddings.embedQuery(queryText);

    // 1. Try Pinecone Search
    if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX) {
      try {
        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const index = pc.index(process.env.PINECONE_INDEX);
        
        const queryResponse = await index.query({
          vector: queryVector,
          topK: 5,
          includeMetadata: false
        });

        const ids = queryResponse.matches.map(m => m.id);
        const results = await Link.find({ _id: { $in: ids } });
        
        return results
          .map(link => ({
            ...link.toObject(),
            score: queryResponse.matches.find(m => m.id === String(link._id))?.score || 0
          }))
          .sort((a, b) => b.score - a.score);

      } catch (err) {
        console.error("Pinecone search failed, falling back to MongoDB:", err.message);
      }
    }

    // 2. Fallback: Manual search in MongoDB
    const allLinks = await Link.find({ embedding: { $exists: true, $ne: [] } });
    const scoredResults = allLinks
      .map(link => ({
        ...link.toObject(),
        score: link.embedding ? cosineSimilarity(queryVector, link.embedding) : 0
      }))
      .filter(item => item.score > 0.6)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return scoredResults;

  } catch (err) {
    console.error("Search Service Error:", err.message);
    return [];
  }
}

module.exports = { performSearch };
