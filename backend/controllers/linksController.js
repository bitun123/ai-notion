const { extractContent } = require('../services/contentService');
const { runRagPipeline } = require('../services/ragService');
const { handleTagging } = require('../services/tagService');
const { saveLink } = require('../repositories/linkRepository');
const { getAllLinks } = require('../repositories/linkRepository');
const { deleteChunksFromPinecone } = require('../services/similarityService');
const Link = require('../db/Link');




const saveLinkController = async (req, res) => {
  try {
    const { url } = req.body;

    const result = await extractContent(url);

    const saved = await saveLink({
      title: result.title,
      url,
      content: result.content,
      type: result.type,
      createdAt: new Date()
    });

    // async background jobs
    handleTagging(saved._id, result.title, result.content);
    runRagPipeline(saved);

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getLinksController = async (req, res) => {
  const links = await getAllLinks();
  res.json(links);
};




const deleteLinkController = async (req, res) => {
  const { id } = req.params;

  const link = await Link.findById(id);

  await deleteChunksFromPinecone(id, link.chunkCount || 20);
  await Link.findByIdAndDelete(id);

  res.json({ success: true });
};


module.exports = { saveLinkController, getLinksController, deleteLinkController };
