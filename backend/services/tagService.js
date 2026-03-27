const { generateTags } = require('./aiTagging');
const Link = require('../db/Link');

const handleTagging = async (id, title, content) => {
  const tags = await generateTags(title, content);
console.log(`Generated tags for link ${id}:`, tags);

  if (tags?.length) {
    await Link.findByIdAndUpdate(id, { tags });
  }
};

module.exports = { handleTagging };