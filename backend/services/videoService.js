/**
 * videoService.js
 * Extracts title and description from video URLs.
 * - YouTube & Vimeo: uses oEmbed API (no key required)
 * - Direct video files (.mp4, .webm, etc.): returns URL-derived metadata
 */

const axios = require('axios');

/**
 * Extracts metadata from a YouTube or Vimeo URL using the oEmbed endpoint.
 * @param {string} url
 * @returns {Promise<{ title: string, content: string }>}
 */
async function extractVideo(url) {
  const lowerUrl = url.toLowerCase();
  const filename = url.split('/').pop().split('?')[0] || 'Video';

  // ── YouTube ────────────────────────────────────────────────────────────────
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const { data } = await axios.get(oembedUrl, { timeout: 6000 });
      const title = data.title || filename;
      const content = [
        `YouTube Video by ${data.author_name || 'Unknown'}`,
        data.title ? `Title: ${data.title}` : '',
        `Channel: ${data.author_name || 'Unknown'}`,
        `URL: ${url}`,
        `This is a YouTube video. The content describes: ${data.title || url}`
      ].filter(Boolean).join('\n');
      return { title, content };
    } catch (err) {
      console.warn(`YouTube oEmbed failed for ${url}: ${err.message}`);
    }
  }

  // ── Vimeo ──────────────────────────────────────────────────────────────────
  if (lowerUrl.includes('vimeo.com')) {
    try {
      const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(oembedUrl, { timeout: 6000 });
      const title = data.title || filename;
      const content = [
        `Vimeo Video: ${data.title || url}`,
        data.description ? `Description: ${data.description}` : '',
        `Author: ${data.author_name || 'Unknown'}`
      ].filter(Boolean).join('\n');
      return { title, content };
    } catch (err) {
      console.warn(`Vimeo oEmbed failed for ${url}: ${err.message}`);
    }
  }

  // ── Direct video file (.mp4, .webm, .mov, etc.) ───────────────────────────
  const titleFromFilename = decodeURIComponent(filename)
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ') || 'Video';

  return {
    title: titleFromFilename.substring(0, 300),
    content: `Video file: ${url}\nTitle: ${titleFromFilename}\nThis is a video resource saved to your second brain.`
  };
}

module.exports = { extractVideo };
