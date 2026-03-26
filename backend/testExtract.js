require('dotenv').config({ path: './.env' });
const { extractVideo } = require('./services/videoService');
const { extractImage } = require('./services/imageService');

async function testExtraction() {
  console.log('Testing Video Extraction (YouTube)...');
  const video = await extractVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  console.log('\n--- Video Result ---');
  console.log('Title:', video.title);
  console.log('Content snippet:', video.content.substring(0, 300) + '...\n');

  console.log('Testing Image Extraction (Mistral Pixtral)...');
  const image = await extractImage('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png');
  console.log('\n--- Image Result ---');
  console.log('Title:', image.title);
  console.log('Content snippet:', image.content.substring(0, 300) + '...\n');
}

testExtraction().catch(console.error);
