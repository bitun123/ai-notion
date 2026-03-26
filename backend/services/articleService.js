const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Extracts title and FULL main content from an article URL.
 * Removes the 5-paragraph limit so the chunking service can process the full text.
 */
async function extractArticle(url) {
  console.log(`🔍 Extraction: Fetching "${url}"...`);
  try {
    const { data: html, status } = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
      },
      validateStatus: (status) => status < 500
    });

    if (!html) {
      console.warn(`⚠️ Extraction: Received empty HTML for ${url}`);
      throw new Error('Empty response from server');
    }
    
    console.log(`📄 Extraction: Received ${html.length} bytes. Status: ${status}`);

    const $ = cheerio.load(html);

    // Remove noise elements
    $('script, style, nav, header, footer, aside, .sidebar, .ad, .advertisement, noscript, iframe, svg').remove();

    let title = $('meta[property="og:title"]').attr('content') ||
                $('meta[name="twitter:title"]').attr('content') ||
                $('title').text().trim() ||
                $('h1').first().text().trim();
    
    // Domain fallback for title
    if (!title || title.length < 5) {
      try {
        const hostname = new URL(url).hostname;
        title = `Article from ${hostname}`;
      } catch {
        title = url;
      }
    }

    // Comprehensive content selectors
    const contentSelectors = [
      'article', 'main', '#content', '.post-content', '.article-body', 
      '.entry-content', '.content', '.main-content', '.post-text', 
      '.article-text', 'body'
    ];
    
    let contentEl = null;
    for (const sel of contentSelectors) {
      const candidates = $(sel);
      if (candidates.length) {
        // Find candidate with most text content
        let maxLen = -1;
        candidates.each((_, el) => {
          const len = $(el).text().trim().length;
          if (len > maxLen) { maxLen = len; contentEl = $(el); }
        });
        if (maxLen > 100) break; // Found a good enough content block
      }
    }

    let content = '';
    if (contentEl) {
      content = contentEl
        .find('p, h2, h3, h4, blockquote, li')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(t => t.length > 30) // Filter out noise text
        .join('\n\n');
    }

    // Final fallback: paragraph elements anywhere
    if (!content || content.length < 100) {
      content = $('p')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(t => t.length > 30)
        .join('\n\n');
    }

    console.log(`📝 Extraction: Final content size: ${content.length} characters.`);

    // If still no content, mark as protected
    if (!content || content.length < 50) {
      if (status === 403) throw { response: { status: 403 } }; // trigger catch block logic
      content = "[PROTECTED CONTENT] Content exists but could not be parsed. The site may be using dynamic rendering or bot protection.";
    }

    return { title: title.substring(0, 300), content };
  } catch (err) {
    if (err.response?.status === 403) {
      console.warn(`⚠️ Extraction: 403 Forbidden for ${url}. Site is protected.`);
      return {
        title: `Protected: ${new URL(url).hostname}`,
        content: "[PROTECTED CONTENT] Access to this content was denied (403 Forbidden). The site is likely protected by Cloudflare or similar measures."
      };
    }
    console.error(`❌ Extraction: Failed for ${url}:`, err.message);
    return { title: `Error: ${url}`, content: `[EXTRACTION ERROR] Failed to extract content: ${err.message}` };
  }
}

module.exports = { extractArticle };
