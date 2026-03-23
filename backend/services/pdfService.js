const axios = require('axios');
const pdf = require('pdf-parse');

/**
 * Fetches and extracts text from a PDF URL.
 */
async function extractPdf(url) {
  try {
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 10000 
    });
    const data = await pdf(response.data);
    
    // Use filename or first line as title
    const title = url.split('/').pop() || "PDF Document";
    const content = data.text.substring(0, 5000); // Limit context for storage/AI

    return { title, content };
  } catch (err) {
    console.warn(`PDF extraction failed for ${url}: ${err.message}`);
    return { title: "PDF Document", content: "Could not extract text from this PDF." };
  }
}

module.exports = { extractPdf };
