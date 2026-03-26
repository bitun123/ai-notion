const multer = require('multer');
const Link = require('../db/Link');
const Highlight = require('../db/Highlight');
const { isConnected } = require('../db/connection');
const { generateTags } = require('../services/aiTagging');
const { upsertChunksToPinecone, getRelatedIds, deleteChunksFromPinecone } = require('../services/similarityService');
const { detectContentType } = require('../services/contentDetectionService');
const { extractArticle } = require('../services/articleService');
const { extractPdf, extractPdfFromBuffer } = require('../services/pdfService');
const { extractImage } = require('../services/imageService');
const { extractVideo } = require('../services/videoService');
const { chunkByType } = require('../services/chunkingService');
const { embedChunks } = require('../services/embeddingService');

// Multer — memory storage for PDF uploads (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  }
});

// In-memory fallback data
let links = [
  { _id: '1', title: 'How to Build a Second Brain', url: 'https://fortelabs.com/blog/how-to-build-a-second-brain/', content: 'A methodology for saving and systematically reminding us of the information we have consumed.', tags: ['productivity', 'knowledge management', 'learning'], createdAt: new Date('2024-01-01'), embedding: [], type: 'article', clusterName: 'Uncategorized' },
  { _id: '2', title: 'React Documentation', url: 'https://react.dev', content: 'The library for web and native user interfaces. Build user interfaces out of individual pieces called components.', tags: ['frontend', 'react', 'javascript'], createdAt: new Date('2024-01-15'), embedding: [], type: 'article', clusterName: 'Uncategorized' }
];

const getMemLinks = () => links;

const getLinks = async (req, res) => {
  try {
    if (isConnected()) return res.json(await Link.find().sort({ createdAt: -1 }));
    res.json(links);
  } catch { res.json(links); }
};

const getClusteredLinks = async (req, res) => {
  try {
    const allLinks = isConnected() ? await Link.find().sort({ createdAt: -1 }) : links;
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
};

/**
 * RAG Ingestion Pipeline (async, non-blocking):
 *   Chunk → Mistral Embed → Pinecone (chunks only in Pinecone, not MongoDB)
 *   Stores only the first chunk embedding on the Link as local fallback.
 */
async function runRagPipeline(savedLink) {
  const { _id, title, url, content, type } = savedLink;
  console.log(`🚀 Starting RAG pipeline for: "${title}" (${_id})`);

  try {
    // 1. Validation
    if (!content || content.trim().length < 10) {
      console.warn(`⚠️ RAG Skip: Content too short or empty for link ${_id}`);
      return;
    }

    if (content.includes('[PROTECTED CONTENT]') || content.includes('[EXTRACTION ERROR]')) {
      console.warn(`⚠️ RAG Skip: Protected or invalid content found for link ${_id}`);
      return;
    }

    // 2. Chunking
    console.log(`📦 Chunking content for link ${_id}...`);
    const rawChunks = chunkByType(content || '', type || 'article', { title, url });
    if (!rawChunks || rawChunks.length === 0) {
      console.warn(`⚠️ RAG Skip: No chunks generated for link ${_id}`);
      return;
    }
    console.log(`✅ Generated ${rawChunks.length} chunks.`);

    // 3. Embedding
    console.log(`🧬 Generating embeddings for ${rawChunks.length} chunks via Mistral...`);
    const embeddedChunks = await embedChunks(rawChunks);
    if (!embeddedChunks || embeddedChunks.length === 0) {
      console.warn(`⚠️ RAG Skip: No valid embeddings generated for link ${_id}`);
      return;
    }
    console.log(`✅ Successfully embedded ${embeddedChunks.length} chunks.`);

    // 4. Pinecone Upsert
    console.log(`📤 Upserting to Pinecone for link ${_id}...`);
    const upsertedCount = await upsertChunksToPinecone(savedLink, embeddedChunks);

    if (upsertedCount === false || upsertedCount === 0) {
      console.warn(`❌ RAG Pipeline Halted: Pinecone upsert failed or returned 0 for link ${_id}`);
      return;
    }

    // 5. Database Update (Sync metadata)
    const firstEmbedding = embeddedChunks[0]?.embedding || [];
    await Link.findByIdAndUpdate(_id, {
      chunkCount: upsertedCount,
      embedding: firstEmbedding
    });

    console.log(`✨ RAG Pipeline Complete for "${title}" — ${upsertedCount} chunk(s) stored.`);
  } catch (err) {
    console.error(`❌ RAG Pipeline Failed for ${_id}:`, err.message);
    // Pipeline is non-blocking, so we just log and continue
  }
}

const saveLink = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: 'URL is required' });

  try {
    const type = await detectContentType(url);

    let result;
    if (type === 'pdf') result = await extractPdf(url);
    else if (type === 'image') result = await extractImage(url);
    else if (type === 'video') result = await extractVideo(url);
    else result = await extractArticle(url);

    const newLinkData = { title: result.title, url, content: result.content, type, createdAt: new Date() };

    if (isConnected()) {
      const link = new Link(newLinkData);
      const savedLink = await link.save();

      generateTags(result.title, result.content).then(async (tags) => {
        if (tags?.length > 0) await Link.findByIdAndUpdate(savedLink._id, { tags });
      }).catch(err => console.error('Tagging Error:', err));

      runRagPipeline(savedLink.toObject()).catch(err => console.error('RAG Error:', err));

      return res.status(201).json(savedLink);
    }

    const memLink = { ...newLinkData, _id: Date.now().toString(), tags: [], clusterName: 'Uncategorized', chunkCount: 0 };
    links.unshift(memLink);
    res.status(201).json(memLink);
  } catch (err) {
    console.error('Save Link Error:', err);
    res.status(400).json({ message: err.message });
  }
};

/**
 * POST /api/links/upload-pdf
 * Accepts a PDF file upload via multipart/form-data.
 * Extracts text, runs the full RAG pipeline, and saves the link.
 */
const uploadPdf = [
  upload.single('pdf'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No PDF file uploaded' });

    try {
      const result = await extractPdfFromBuffer(req.file.buffer, req.file.originalname);
      // Create a pseudo-URL for the uploaded file using its original name
      const pseudoUrl = `upload://pdf/${encodeURIComponent(req.file.originalname)}_${Date.now()}`;
      const newLinkData = {
        title: result.title,
        url: pseudoUrl,
        content: result.content,
        type: 'pdf',
        createdAt: new Date()
      };

      if (isConnected()) {
        const link = new Link(newLinkData);
        const savedLink = await link.save();

        generateTags(result.title, result.content).then(async (tags) => {
          if (tags?.length > 0) await Link.findByIdAndUpdate(savedLink._id, { tags });
        }).catch(err => console.error('Tagging Error:', err));

        runRagPipeline(savedLink.toObject()).catch(err => console.error('RAG Error:', err));

        return res.status(201).json(savedLink);
      }

      const memLink = { ...newLinkData, _id: Date.now().toString(), tags: [], clusterName: 'Uncategorized', chunkCount: 0 };
      links.unshift(memLink);
      res.status(201).json(memLink);
    } catch (err) {
      console.error('PDF Upload Error:', err);
      res.status(400).json({ message: err.message });
    }
  }
];

/**
 * DELETE /api/links/:id
 * Removes a link from MongoDB and deletes its chunk vectors from Pinecone.
 */
const deleteLink = async (req, res) => {
  const { id } = req.params;
  try {
    if (isConnected()) {
      const link = await Link.findById(id);
      if (!link) return res.status(404).json({ message: 'Link not found' });

      // Delete from Pinecone asynchronously
      deleteChunksFromPinecone(String(link._id), link.chunkCount || 20)
        .catch(err => console.error('Pinecone delete error:', err.message));

      await Link.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Link deleted' });
    }

    // In-memory fallback
    const idx = links.findIndex(l => l._id === id);
    if (idx === -1) return res.status(404).json({ message: 'Link not found' });
    links.splice(idx, 1);
    res.json({ success: true, message: 'Link deleted' });
  } catch (err) {
    console.error('Delete Link Error:', err);
    res.status(500).json({ message: err.message });
  }
};

const getRelatedItems = async (req, res) => {
  try {
    if (!isConnected()) return res.json([]);
    const relatedIds = await getRelatedIds(req.params.id);
    if (!relatedIds?.length) return res.json([]);
    const relatedLinks = await Link.find({ _id: { $in: relatedIds } });
    res.json(relatedLinks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getHighlightsByLink = async (req, res) => {
  try {
    if (isConnected()) return res.json(await Highlight.find({ itemId: req.params.id }).sort({ createdAt: -1 }));
    const { getMemHighlights } = require('./highlightsController');
    res.json(getMemHighlights().filter(h => h.itemId === req.params.id));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  getLinks, getClusteredLinks, saveLink, uploadPdf, deleteLink,
  getRelatedItems, getHighlightsByLink, getMemLinks
};
