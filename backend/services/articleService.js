const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

function normalizeText(text = '') {
  return text.replace(/\s+/g, ' ').trim();
}

function isChatGptConversationUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('chatgpt.com') && parsed.pathname.startsWith('/c/');
  } catch (_error) {
    return false;
  }
}

function parseHtmlToText(html, url) {
  if (!html || typeof html !== 'string') {
    return { title: '', content: '' };
  }

  const $ = cheerio.load(html);
  $('script, style, nav, header, footer, aside, noscript, iframe, svg').remove();

  let title =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('title').text() ||
    $('h1').first().text() ||
    '';

  title = normalizeText(title);

  const selectors = [
    'article',
    'main',
    '#content',
    '.post-content',
    '.article-body',
    '.entry-content',
    '.content',
    '.main-content',
    '.post-text',
    '.article-text',
    'body'
  ];

  let bestContent = '';
  for (const selector of selectors) {
    const candidates = $(selector);
    candidates.each((_, el) => {
      const sectionText = normalizeText(
        $(el)
          .find('p, h2, h3, h4, blockquote, li')
          .map((__, child) => $(child).text())
          .get()
          .join(' ')
      );

      if (sectionText.length > bestContent.length) {
        bestContent = sectionText;
      }
    });

    if (bestContent.length > 800) {
      break;
    }
  }

  if (!bestContent || bestContent.length < 120) {
    bestContent = normalizeText(
      $('p')
        .map((_, el) => $(el).text())
        .get()
        .join(' ')
    );
  }

  if (!bestContent || bestContent.length < 120) {
    bestContent = normalizeText($('body').text());
  }

  if (!title || title.length < 3) {
    try {
      title = `Article from ${new URL(url).hostname}`;
    } catch (_error) {
      title = url;
    }
  }

  return {
    title: title.slice(0, 300),
    content: bestContent
  };
}

async function extractStaticHtml(url) {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      validateStatus: () => true
    });

    return {
      html: typeof response.data === 'string' ? response.data : '',
      status: response.status
    };
  } catch (_error) {
    return { html: '', status: 0 };
  }
}

async function extractDynamicHtml(url) {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    );

    await page.setViewport({ width: 1440, height: 2400 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

    try {
      await page.waitForNetworkIdle({ idleTime: 1000, timeout: 12000 });
    } catch (_error) {
      // Ignore timeout for pages with persistent network requests.
    }

    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const step = 500;
        const maxScroll = 8000;
        const timer = setInterval(() => {
          const body = document.body;
          const scrollHeight = body ? body.scrollHeight : 0;

          window.scrollBy(0, step);
          totalHeight += step;

          if (totalHeight >= scrollHeight || totalHeight >= maxScroll) {
            clearInterval(timer);
            resolve();
          }
        }, 150);
      });
    });

    const extracted = await page.evaluate(() => {
      const title = (document.title || '').trim();
      const roleMessages = Array.from(document.querySelectorAll('[data-message-author-role]'))
        .map((el) => (el.innerText || '').trim())
        .filter(Boolean)
        .join('\n\n');

      const mainText = (document.querySelector('main')?.innerText || '').trim();
      const articleText = Array.from(document.querySelectorAll('article'))
        .map((el) => (el.innerText || '').trim())
        .filter(Boolean)
        .join('\n\n');
      const bodyText = (document.body?.innerText || '').trim();

      const candidates = [roleMessages, articleText, mainText, bodyText].filter(Boolean);
      candidates.sort((a, b) => b.length - a.length);

      return {
        title,
        renderedText: candidates[0] || ''
      };
    });

    const html = await page.content();
    return {
      html,
      renderedText: normalizeText(extracted.renderedText),
      renderedTitle: normalizeText(extracted.title),
      finalUrl: page.url(),
      ok: true
    };
  } catch (_error) {
    return { html: '', renderedText: '', renderedTitle: '', finalUrl: url, ok: false };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function mergeContent(staticText, dynamicText) {
  const a = normalizeText(staticText);
  const b = normalizeText(dynamicText);

  if (!a) return b;
  if (!b) return a;
  if (a.includes(b)) return a;
  if (b.includes(a)) return b;

  return `${a}\n\n${b}`;
}

async function extractArticle(url) {
  const staticResult = await extractStaticHtml(url);
  const parsedStatic = parseHtmlToText(staticResult.html, url);
  const isChatGptPrivateUrl = isChatGptConversationUrl(url);

  const shouldUseDynamic =
    isChatGptPrivateUrl ||
    staticResult.status === 403 ||
    staticResult.status === 429 ||
    !parsedStatic.content ||
    parsedStatic.content.length < 150;

  let parsedDynamic = { title: '', content: '' };
  let renderedDynamicContent = '';
  if (shouldUseDynamic) {
    const dynamicResult = await extractDynamicHtml(url);
    parsedDynamic = parseHtmlToText(dynamicResult.html, url);
    renderedDynamicContent = dynamicResult.renderedText || '';

    if (!parsedDynamic.title && dynamicResult.renderedTitle) {
      parsedDynamic.title = dynamicResult.renderedTitle;
    }
  }

  const finalTitle = parsedDynamic.title || parsedStatic.title || `Article from ${url}`;
  const finalContent = mergeContent(
    mergeContent(parsedStatic.content, parsedDynamic.content),
    renderedDynamicContent
  );

  if (!finalContent || finalContent.length < 50) {
    if (isChatGptPrivateUrl) {
      return {
        title: 'Protected: chatgpt.com conversation',
        content:
          '[PROTECTED CONTENT] This ChatGPT /c/ URL is account-protected and usually requires an authenticated browser session. Use a public share link (chatgpt.com/share/...) or provide session cookies for Puppeteer.'
      };
    }

    try {
      const hostname = new URL(url).hostname;
      return {
        title: `Protected: ${hostname}`,
        content:
          '[PROTECTED CONTENT] Could not extract readable text from static or dynamic rendering. The site may be protected by anti-bot measures.'
      };
    } catch (_error) {
      return {
        title: 'Protected content',
        content:
          '[PROTECTED CONTENT] Could not extract readable text from static or dynamic rendering. The site may be protected by anti-bot measures.'
      };
    }
  }

  return {
    title: finalTitle,
    content: finalContent
  };
}

module.exports = { extractArticle };
