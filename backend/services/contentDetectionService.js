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
  if (/\.(mp4|webm|mov|avi|mkv|m4v|ogv|flv|wmv)$/.test(lowerUrl)) return 'video';

  // ── Domain-based detection ───────────────────────────────────────────────
  if (
    lowerUrl.includes('youtube.com') ||
    lowerUrl.includes('youtu.be') ||
    lowerUrl.includes('vimeo.com') ||
    lowerUrl.includes('dailymotion.com') ||
    lowerUrl.includes('twitch.tv')
  ) return 'video';

  // ── HTTP HEAD request for Content-Type ──────────────────────────────────
  try {
    const response = await axios.head(url, {
      timeout: 4000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('application/pdf')) return 'pdf';
    if (contentType.startsWith('image/')) return 'image';
    if (contentType.startsWith('video/')) return 'video';
  } catch (err) {
    console.warn(`Type detection HEAD failed for ${url}: ${err.message}`);
  }

  return 'article';
}

module.exports = { detectContentType };
