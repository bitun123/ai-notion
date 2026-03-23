const { ChatMistralAI } = require("@langchain/mistralai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");

/**
 * Generates 5 high-quality semantic tags for a given content/title.
 * @param {string} title - The title of the link.
 * @param {string} content - The extracted content of the link.
 * @returns {Promise<string[]>} - A list of 5 tags.
 */
async function generateTags(title, content) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    console.warn("MISTRAL_API_KEY not found. Skipping AI tagging.");
    return [];
  }

  try {
    const model = new ChatMistralAI({
      apiKey: apiKey,
      modelName: "mistral-small-latest",
      temperature: 0
    });

    const prompt = PromptTemplate.fromTemplate(`
      You are an expert content curator for a "Second Brain" application.
      Your task is to generate exactly 5 high-quality semantic tags for the following link:
      
      Title: {title}
      Content: {content}
      
      Rules:
      1. Each tag must be 1-3 words.
      2. Focus on the core meaning, topic, and intent.
      3. Avoid generic tags like "article", "content", "website", or the URL itself.
      4. Normalize tags to lowercase.
      5. Output ONLY a comma-separated list of 5 tags. No numbers, no explanation.
      
      Example Output: react development, web architecture, frontend performance, state management, javascript tips
    `);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const result = await chain.invoke({
      title: title || "Untitled",
      content: content ? content.substring(0, 1000) : "No content available"
    });

    // Parse result: split by comma, trim, lowercase, unique
    const tags = result
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter((tag, index, self) => tag.length > 0 && self.indexOf(tag) === index)
      .slice(0, 5);

    return tags;
  } catch (err) {
    console.error("AI Tagging Error:", err.message);
    return [];
  }
}

module.exports = { generateTags };
