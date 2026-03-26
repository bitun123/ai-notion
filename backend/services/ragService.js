const { chunkByType } = require('./chunkingService');
const { embedChunks } = require('./embeddingService');
const { upsertChunksToPinecone } = require('./similarityService');
const Link = require('../db/Link');

const runRagPipeline = async (savedLink) => {
  const chunks = chunkByType(savedLink.content, savedLink.type);

  const embedded = await embedChunks(chunks);

  const count = await upsertChunksToPinecone(savedLink, embedded);

  await Link.findByIdAndUpdate(savedLink._id, {
    chunkCount: count,
    embedding: embedded[0]?.embedding || []
  });
};

module.exports = { runRagPipeline };