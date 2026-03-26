const { detectContentType } = require('./contentDetectionService');
const { extractArticle } = require('./articleService');
const { extractPdf } = require('./pdfService');
const { extractImage } = require('./imageService');
const { extractVideo } = require('./videoService');

const extractContent = async (url) => {
  const type = await detectContentType(url);

  if (type === 'pdf') return { ...(await extractPdf(url)), type };
  if (type === 'image') return { ...(await extractImage(url)), type };
  if (type === 'video') return { ...(await extractVideo(url)), type };

  return { ...(await extractArticle(url)), type };
};

module.exports = { extractContent };