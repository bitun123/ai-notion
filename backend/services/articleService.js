const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Extracts title and main content from an article URL.
 */
async function extractArticle(url) {
  try {
    const { data: html } = await axios.get(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const $ = cheerio.load(html);
    
    const title = $('title').text() || $('h1').first().text() || url;
    const contentNodes = $('article p, main p, body p');
    const content = contentNodes
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(t => t.length > 20)
      .slice(0, 5)
      .join('\n\n');

    return { title, content };
  } catch (err) {
    console.warn(`Article extraction failed for ${url}: ${err.message}`);
    return { title: url, content: "" };
  }
}

module.exports = { extractArticle };
