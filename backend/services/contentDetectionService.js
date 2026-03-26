const axios = require('axios');

/**
 * Detects the content type of a URL based on extensions or HTTP headers.
 * Supports: 'article', 'pdf', 'image', 'video'
 * @param {string} url
 * @returns {Promise<string>}
 */
async function detectContentType(url) {
  const lowerUrl = url.toLowerCase().split('?')[0]; // strip query params for extension check

  // ── Extension-based detection (fastest) ─────────────────────────────────
  if (lowerUrl.endsWith('.pdf')) return 'pdf';
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|avif)$/.test(lowerUrl)) return 'image';
  const extension = url.split(/[?#]/)[0].split('.').pop().toLowerCase();
  
  // Extension-based detection
  if (['pdf'].includes(extension)) return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(extension)) return 'image';
  if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension)) return 'video';

  // Content-type based detection via HEAD request
  try {
    const response = await axios.head(url, { 
      timeout: 3000, 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      validateStatus: (status) => status < 400
    });
    
    const contentType = response.headers['content-type'] || '';
    console.log(`📡 Type Detection: ${url} -> ${contentType}`);

    if (contentType.includes('application/pdf')) return 'pdf';
    if (contentType.includes('image/')) return 'image';
    if (contentType.includes('video/')) return 'video';
  } catch (err) {
    // If HEAD fails, we default to article for generic web URLs
    // console.log(`Type detection failed for ${url}, defaulting to article.`);
  }

  return 'article';
}

module.exports = { detectContentType };
