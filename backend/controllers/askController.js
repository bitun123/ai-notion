const { performSearch } = require('../services/searchService');
const Link = require('../db/Link');
const { isConnected } = require('../db/connection');
const { getMemLinks } = require('./linksController');
const { MISTRAL_API_KEY } = require('../config');

const ask = async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ message: 'Question is required' });

  try {
    const { ChatMistralAI } = require('@langchain/mistralai');
    const { PromptTemplate } = require('@langchain/core/prompts');
    const { StringOutputParser } = require('@langchain/core/output_parsers');

    // ── 1. Retrieve relevant chunks via semantic search ────────────────────
    let contextLinks = [];
    try {
      contextLinks = await performSearch(question, 5);
    } catch (searchErr) {
      console.warn('Search failed, loading recent links as fallback:', searchErr.message);
      contextLinks = isConnected()
        ? await Link.find().sort({ createdAt: -1 }).limit(5)
        : getMemLinks().slice(0, 5);
    }

    if (contextLinks.length === 0) {
      return res.json({
        answer: "I couldn't find any relevant information in your knowledge base. Try saving some articles, PDFs, or images first!",
        sources: []
      });
    }

    // ── 2. Build RAG context from matched chunk text ───────────────────────
    // Prefer matchedChunkText (chunk-level precision) over raw content
    const context = contextLinks
      .map((l, i) => {
        const chunkSnippet = l.matchedChunkText
          ? l.matchedChunkText
          : (l.content || '').substring(0, 600);
        return `[${i + 1}] Source: ${l.title} (${l.type || 'article'})\nURL: ${l.url}\n\n${chunkSnippet}`;
      })
      .join('\n\n---\n\n')
      .substring(0, 6000); // Mistral context window budget

    if (!MISTRAL_API_KEY) {
      return res.json({
        answer: "AI answering requires a MISTRAL_API_KEY. Please configure it in your .env file.",
        sources: contextLinks
      });
    }

    // ── 3. Generate answer using Mistral with RAG context ─────────────────
    const model = new ChatMistralAI({
      apiKey: MISTRAL_API_KEY,
      modelName: 'mistral-small-latest',
      temperature: 0.3
    });

    const prompt = PromptTemplate.fromTemplate(`
You are a helpful AI assistant for a "Second Brain" application.
Your task is to answer the user's question using ONLY the provided knowledge base context below.
The context may include articles, PDF excerpts, and image descriptions.

Rules:
- Answer only from the provided context. Do not use external knowledge.
- If the answer isn't in the context, say exactly: "I don't have information about that in your knowledge base."
- Be concise, clear, and insightful.
- Cite the source number (e.g. [1], [2]) when referencing specific information.
- If multiple sources support the answer, mention all relevant ones.

Knowledge Base Context:
{context}

User Question: {question}

Answer:`);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const answer = await chain.invoke({ context, question });

    // ── 4. Deduplicate sources by URL ─────────────────────────────────────
    const seen = new Set();
    const sources = contextLinks
      .filter(l => {
        if (seen.has(l.url)) return false;
        seen.add(l.url);
        return true;
      })
      .map(l => ({
        _id: l._id,
        title: l.title,
        url: l.url,
        type: l.type || 'article'
      }));

    res.json({
      answer: answer.trim(),
      sources
    });
  } catch (err) {
    console.error('RAG Error:', err);
    res.status(500).json({ message: 'Failed to answer question: ' + err.message });
  }
};

module.exports = { ask };
