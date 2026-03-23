const { MistralAIEmbeddings } = require("@langchain/mistralai");
const { Pinecone } = require("@pinecone-database/pinecone");
const Link = require("../models/Link");

/**
 * Initializes Pinecone client and gets the index.
 */
async function getPineconeIndex() {
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
  });
  return pc.index(process.env.PINECONE_INDEX);
}

/**
 * Generates an embedding for the given text using Mistral.
 */
async function generateEmbedding(text) {
  const embeddings = new MistralAIEmbeddings({
    apiKey: process.env.MISTRAL_API_KEY,
    modelName: "mistral-embed"
  });
  return await embeddings.embedQuery(text.substring(0, 2000));
}

/**
 * Upserts a link embedding to Pinecone.
 * @param {object} link - The link document from MongoDB.
 */
async function upsertToPinecone(link) {
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
    console.warn("Pinecone credentials missing. Skipping upsert.");
    return;
  }

  try {
    const vector = await generateEmbedding(`${link.title} ${link.content || ""}`);
    
    // Update local DB for fallback
    await Link.findByIdAndUpdate(link._id, { embedding: vector });

    const index = await getPineconeIndex();

    await index.upsert([{
      id: String(link._id),
      values: vector,
      metadata: {
        title: link.title,
        url: link.url
      }
    }]);

    console.log(`Upserted vector for link: ${link._id} to Pinecone`);
  } catch (err) {
    console.error("Pinecone Upsert Error:", err.message);
  }
}

/**
 * Queries Pinecone for top 3 similar items.
 * @param {string} linkId - The ID of the item to find siblings for.
 * @returns {Promise<string[]>} - Array of related link IDs.
 */
async function getRelatedIds(linkId) {
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
    return [];
  }

  try {
    const index = await getPineconeIndex();
    
    // We fetch the vector for the current link from Pinecone first
    const fetchResponse = await index.fetch([String(linkId)]);
    const vector = fetchResponse.records[String(linkId)]?.values;

    if (!vector) {
      console.warn(`No vector found in Pinecone for linkId: ${linkId}`);
      return [];
    }

    const queryResponse = await index.query({
      vector: vector,
      topK: 4, // 4 because it will likely include itself
      includeMetadata: false
    });

    // Filter out the current link itself
    const relatedIds = queryResponse.matches
      .filter(match => match.id !== String(linkId))
      .slice(0, 3)
      .map(match => match.id);

    return relatedIds;
  } catch (err) {
    console.error("Pinecone Query Error:", err.message);
    return [];
  }
}

/**
 * Calculates cosine similarity between two vectors.
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = { upsertToPinecone, getRelatedIds, generateEmbedding, cosineSimilarity };
