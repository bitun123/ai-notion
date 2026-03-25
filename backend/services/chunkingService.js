/**
 * chunkingService.js
 * Responsible for splitting resource content into overlapping text chunks
 * that are suitable for embedding and vector search (RAG pipeline).
 */

const DEFAULT_CHUNK_SIZE = 500;  // words per chunk
const DEFAULT_OVERLAP = 50;      // overlapping words between consecutive chunks

/**
 * Splits a plain text string into overlapping word-based chunks.
 * @param {string} text - The raw text to split.
 * @param {number} chunkSize - Number of words per chunk.
 * @param {number} overlap - Number of words to overlap between chunks.
 * @returns {string[]} - Array of chunk strings.
 */
function chunkText(text, chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_OVERLAP) {
  if (!text || text.trim().length === 0) return [];

  const words = text.trim().split(/\s+/);
  if (words.length === 0) return [];

  // If the entire text is smaller than one chunk, return it as-is
  if (words.length <= chunkSize) return [words.join(' ')];

  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    chunks.push(words.slice(start, end).join(' '));
    // Move forward by (chunkSize - overlap) to create overlap
    start += chunkSize - overlap;
    if (start >= words.length) break;
  }

  return chunks;
}

/**
 * Splits text respecting paragraph boundaries first, then word-limits.
 * Better for articles and HTML-extracted content.
 * @param {string} text
 * @returns {string[]}
 */
function chunkByParagraph(text) {
  if (!text || text.trim().length === 0) return [];

  // Split into paragraphs (double newline or single newline blocks)
  const paragraphs = text
    .split(/\n{2,}|\r\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 30); // filter out tiny/empty paragraphs

  const chunks = [];
  let currentChunk = [];
  let currentWordCount = 0;

  for (const para of paragraphs) {
    const wordCount = para.split(/\s+/).length;

    if (currentWordCount + wordCount > DEFAULT_CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
      // Carry the last paragraph over for overlap context
      currentChunk = [currentChunk[currentChunk.length - 1]];
      currentWordCount = currentChunk[0].split(/\s+/).length;
    }

    currentChunk.push(para);
    currentWordCount += wordCount;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }

  // If no paragraphs were separated (single block of text), fall back to word chunking
  if (chunks.length === 0) {
    return chunkText(text);
  }

  return chunks;
}

/**
 * Route content through the appropriate chunking strategy based on resource type.
 * @param {string} content - The extracted text content.
 * @param {string} type - Resource type: 'article' | 'pdf' | 'image' | 'link'.
 * @param {{ title: string, url: string }} metadata - Link metadata prepended to first chunk.
 * @returns {Array<{ text: string, chunkIndex: number }>} - Array of chunk objects.
 */
function chunkByType(content, type, metadata = {}) {
  const prefix = metadata.title ? `Title: ${metadata.title}\nURL: ${metadata.url || ''}\n\n` : '';

  let rawChunks = [];

  switch (type) {
    case 'pdf':
      // PDF content tends to be dense; use plain word chunking
      rawChunks = chunkText(content, 400, 60);
      break;

    case 'image':
      // Images produce a description — treat it as one or two chunks
      rawChunks = chunkText(content, 300, 30);
      break;

    case 'article':
    default:
      // Articles have natural paragraph structure
      rawChunks = chunkByParagraph(content);
      // Ensure minimum quality — fall back to word chunking if paragraph splitting produced nothing
      if (rawChunks.length === 0) rawChunks = chunkText(content);
      break;
  }

  // If no content could be chunked, create one minimal chunk from the title
  if (rawChunks.length === 0) {
    rawChunks = [metadata.title || 'No content available'];
  }

  // Prepend context to the first chunk, tag all chunks with index
  return rawChunks.map((text, index) => ({
    text: index === 0 ? prefix + text : text,
    chunkIndex: index
  }));
}

module.exports = { chunkText, chunkByParagraph, chunkByType };
