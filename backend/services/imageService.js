const { OpenAI } = require('openai');

/**
 * Uses OpenAI Vision (if key available) to describe an image.
 */
async function extractImage(url) {
  const apiKey = process.env.OPENAI_API_KEY;
  const title = url.split('/').pop() || "Image";

  if (!apiKey) {
    return { title, content: "No OpenAI API key found for image analysis." };
  }

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What is in this image? Provide a detailed description and extract any readable text." },
            { type: "image_url", image_url: { url: url } },
          ],
        },
      ],
      max_tokens: 300,
    });

    const description = response.choices[0].message.content;
    return { title, content: description };
  } catch (err) {
    console.warn(`Image analysis failed for ${url}: ${err.message}`);
    return { title, content: "Could not analyze this image." };
  }
}

module.exports = { extractImage };
