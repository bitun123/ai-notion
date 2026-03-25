const { ChatMistralAI } = require('@langchain/mistralai');

/**
 * imageService.js
 * Generates a text description of an image using Mistral's vision capability.
 * Uses mistral-small-latest which supports image URLs in messages.
 * No OpenAI key required — only MISTRAL_API_KEY.
 */
async function extractImage(url) {
  const title = url.split('/').pop().split('?')[0] || 'Image';
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    return {
      title,
      content: `Image saved: ${url}. No Mistral API key found for image analysis.`
    };
  }

  try {
    const model = new ChatMistralAI({
      apiKey,
      modelName: 'mistral-small-latest',
      temperature: 0
    });

    const response = await model.invoke([
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Describe this image in detail. Extract any visible text. Provide topics, context, and what the image represents. Be thorough so this description can be used for semantic search.'
          },
          {
            type: 'image_url',
            image_url: { url }
          }
        ]
      }
    ]);

    const description = response.content || '';
    return {
      title: title.substring(0, 300),
      content: description
    };
  } catch (err) {
    console.warn(`Image analysis failed for ${url}: ${err.message}`);
    // Graceful fallback: store URL-derived metadata so it can still be searched
    return {
      title: title.substring(0, 300),
      content: `Image from: ${url}. Analysis unavailable: ${err.message}`
    };
  }
}

module.exports = { extractImage };
