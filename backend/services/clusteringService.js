const Link = require('../models/Link');
const { ChatMistralAI } = require("@langchain/mistralai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");

const { cosineSimilarity } = require('./similarityService');

/**
 * Uses Mistral to generate a friendly topic name for a cluster of links.
 */
async function generateTopicName(links) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey || links.length === 0) return "General Topic";

  try {
    const model = new ChatMistralAI({ apiKey, modelName: "mistral-tiny", temperature: 0.3 });
    const titles = links.map(l => l.title).join(', ');
    
    const prompt = PromptTemplate.fromTemplate(`
      Based on the following titles of saved articles/links, suggest a single concise and representative "Topic Name" (max 3 words).
      Titles: {titles}
      Topic Name:
    `);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const result = await chain.invoke({ titles });
    return result.trim().replace(/^"|"$/g, '');
  } catch (err) {
    console.error("Topic Labeling Error:", err);
    return "General Topic";
  }
}

/**
 * Groups links into clusters based on embedding similarity.
 */
async function rebuildClusters() {
  const allLinks = await Link.find({ embedding: { $exists: true, $not: { $size: 0 } } });
  if (allLinks.length === 0) return;

  const clusters = [];
  const similarityThreshold = 0.8; // Adjust based on experimentation

  for (const link of allLinks) {
    let placed = false;
    for (const cluster of clusters) {
      // Compare with the first item in cluster as a pivot (simple approach)
      const similarity = cosineSimilarity(link.embedding, cluster[0].embedding);
      if (similarity > similarityThreshold) {
        cluster.push(link);
        placed = true;
        break;
      }
    }
    if (!placed) {
      clusters.push([link]);
    }
  }

  // Label clusters and update DB
  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i];
    const clusterId = `cluster_${Date.now()}_${i}`;
    const clusterName = await generateTopicName(cluster);

    for (const link of cluster) {
      await Link.findByIdAndUpdate(link._id, { clusterId, clusterName });
    }
  }

  console.log(`Rebuilt ${clusters.length} clusters.`);
}

module.exports = { rebuildClusters };
