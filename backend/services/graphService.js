const Link = require("../models/Link");
const { cosineSimilarity } = require("./similarityService");

/**
 * Generates graph data (nodes and similarity edges).
 * @param {object[]} [inputLinks] Optional in-memory links for fallback.
 * @returns {Promise<{nodes: object[], edges: object[]}>}
 */
async function getGraphData(inputLinks = null) {
  try {
    const links = inputLinks || await Link.find({ embedding: { $exists: true, $ne: [] } });
    
    const nodes = links.map(link => ({
      id: String(link._id),
      title: link.title,
      url: link.url,
      tags: link.tags || [],
      type: link.type || 'article'
    }));

    const edges = [];
    const threshold = 0.82;

    for (let i = 0; i < links.length; i++) {
      for (let j = i + 1; j < links.length; j++) {
        const score = cosineSimilarity(links[i].embedding, links[j].embedding);
        if (score > threshold) {
          edges.push({
            source: String(links[i]._id),
            target: String(links[j]._id),
            score: parseFloat(score.toFixed(3))
          });
        }
      }
    }

    return { nodes, edges };
  } catch (err) {
    console.error("Graph Service Error:", err.message);
    throw err;
  }
}

module.exports = { getGraphData };
