const Link = require('../db/Link');
const { isConnected } = require('../db/connection');

let links = []; // fallback

const getAllLinks = async () => {
  if (isConnected()) return await Link.find().sort({ createdAt: -1 });
  return links;
};

const saveLink = async (data) => {
  if (isConnected()) {
    const link = new Link(data);
    return await link.save();
  }

  const memLink = { ...data, _id: Date.now().toString() };
  links.unshift(memLink);
  return memLink;
};

module.exports = { getAllLinks, saveLink };