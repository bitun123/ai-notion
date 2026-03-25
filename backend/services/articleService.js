const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Extracts title and FULL main content from an article URL.
 * Removes the 5-paragraph limit so the chunking service can process the full text.
 */
async function extractArticle(url) {
  try {
    const { data: html } = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(html);

    // Remove noise elements
    $('script, style, nav, header, footer, aside, .sidebar, .ad, .advertisement').remove();

    const title = $('title').text().trim() ||
                  $('h1').first().text().trim() ||
                  $('meta[property="og:title"]').attr('content') ||
                  url;

    // Try to find the main content area
    const contentSelectors = ['article', 'main', '.post-content', '.article-body', '.entry-content', '.content', 'body'];
    let contentEl = null;
    for (const sel of contentSelectors) {
      if ($(sel).length) { contentEl = $(sel); break; }
    }

    let content = '';
    if (contentEl) {
      content = contentEl
        .find('p, h2, h3, h4, blockquote, li')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(t => t.length > 20)
        .join('\n\n');
    }

    // Final fallback: grab all paragraphs from body
    if (!content) {
      content = $('body p')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(t => t.length > 20)
        .join('\n\n');
    }

    return { title: title.substring(0, 300), content };
  } catch (err) {
    console.warn(`Article extraction failed for ${url}: ${err.message}`);
    return { title: url, content: '' };
  }
}

module.exports = { extractArticle };
