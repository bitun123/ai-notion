const axios = require('axios');
const pdf = require('pdf-parse');

/**
 * Fetches and extracts the FULL text from a PDF URL.
 */
async function extractPdf(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    return parsePdfBuffer(response.data, url.split('/').pop().split('?')[0] || 'PDF Document');
  } catch (err) {
    console.warn(`PDF URL extraction failed for ${url}: ${err.message}`);
    return {
      title: url.split('/').pop() || 'PDF Document',
      content: 'Could not extract text from this PDF.',
      pageCount: 0
    };
  }
}

/**
 * Extracts text from a PDF buffer (used for direct file uploads).
 * @param {Buffer} buffer - Raw PDF file buffer
 * @param {string} filename - Original filename for title generation
 */
async function extractPdfFromBuffer(buffer, filename = 'PDF Document') {
  try {
    return parsePdfBuffer(buffer, filename);
  } catch (err) {
    console.warn(`PDF buffer extraction failed: ${err.message}`);
    return {
      title: filename.replace(/\.[^.]+$/, '') || 'PDF Document',
      content: 'Could not extract text from this PDF file.',
      pageCount: 0
    };
  }
}

/**
 * Core PDF parsing — shared between URL and buffer extraction.
 * @param {Buffer|ArrayBuffer} data
 * @param {string} filenameHint
 */
async function parsePdfBuffer(data, filenameHint) {
  const parsed = await pdf(Buffer.isBuffer(data) ? data : Buffer.from(data));

  const nameWithoutExt = filenameHint.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  const firstLine = parsed.text.trim().split('\n').find(l => l.trim().length > 5) || '';
  const title = (firstLine.length > 5 && firstLine.length < 200)
    ? firstLine.trim()
    : (nameWithoutExt || 'PDF Document');

  return {
    title: title.substring(0, 300),
    content: parsed.text.trim(),
    pageCount: parsed.numpages
  };
}

module.exports = { extractPdf, extractPdfFromBuffer };
