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

    // 1. Semantic search for relevant context
    let contextLinks = [];
    try {
      contextLinks = await performSearch(question);
    } catch {
      contextLinks = isConnected()
        ? await Link.find().sort({ createdAt: -1 }).limit(5)
        : getMemLinks().slice(0, 5);
    }

    if (contextLinks.length === 0) {
      return res.json({
        answer: "I couldn't find any relevant information in your knowledge base. Try saving some articles first!",
        sources: []
      });
    }

    const context = contextLinks
      .map((l, i) => `[${i + 1}] ${l.title}\n${l.content || ''}`)
      .join('\n\n---\n\n')
      .substring(0, 4000);

    if (!MISTRAL_API_KEY) {
      return res.json({
        answer: "AI answering requires a MISTRAL_API_KEY. Please configure it in your .env file.",
        sources: contextLinks
      });
    }

    const model = new ChatMistralAI({ apiKey: MISTRAL_API_KEY, modelName: 'mistral-small-latest', temperature: 0.3 });
    const prompt = PromptTemplate.fromTemplate(`
You are a helpful AI assistant for a "Second Brain" application. 
Answer the user's question ONLY based on the provided knowledge base context.
If the answer isn't in the context, say "I don't have information about that in your knowledge base."
Keep the answer concise, helpful, and insightful.

Context from knowledge base:
{context}

Question: {question}

Answer:`);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const answer = await chain.invoke({ context, question });

    res.json({
      answer: answer.trim(),
      sources: contextLinks.map(l => ({ _id: l._id, title: l.title, url: l.url }))
    });
  } catch (err) {
    console.error('RAG Error:', err);
    res.status(500).json({ message: 'Failed to answer question: ' + err.message });
  }
};

module.exports = { ask };
