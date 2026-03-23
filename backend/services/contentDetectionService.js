const axios = require('axios');

/**
 * Detects the content type of a URL based on extensions or HTTP headers.
 * @param {string} url 
 * @returns {Promise<string>} - 'article', 'pdf', or 'image'
 */
async function detectContentType(url) {
  // 1. Check extension first (fastest)
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.endsWith('.pdf')) return 'pdf';
  if (/\.(jpg|jpeg|png|gif|webp|bmp)$/.test(lowerUrl)) return 'image';

  // 2. Head request for Content-Type
  try {
    const response = await axios.head(url, { timeout: 3000 });
    const contentType = response.headers['content-type'] || '';
    
    if (contentType.includes('application/pdf')) return 'pdf';
    if (contentType.includes('image/')) return 'image';
  } catch (err) {
    console.warn(`Type detection HEAD request failed for ${url}: ${err.message}`);
  }

  return 'article';
}

module.exports = { detectContentType };
