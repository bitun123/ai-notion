const Collection = require('../db/Collection');
const { isConnected } = require('../db/connection');
const { getMemLinks } = require('./linksController');

let memCollections = [
  { _id: 'c1', name: 'Reading List', itemIds: ['1'], createdAt: new Date() },
  { _id: 'c2', name: 'Work', itemIds: [], createdAt: new Date() }
];

const getCollections = async (req, res) => {
  try {
    if (isConnected()) return res.json(await Collection.find().sort({ createdAt: -1 }));
    res.json(memCollections);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createCollection = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (isConnected()) {
      const saved = await new Collection({ name }).save();
      return res.status(201).json(saved);
    }
    const newColl = { _id: Date.now().toString(), name, itemIds: [], createdAt: new Date() };
    memCollections.unshift(newColl);
    res.status(201).json(newColl);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

const addToCollection = async (req, res) => {
  try {
    const { linkId } = req.body;
    if (!linkId) return res.status(400).json({ message: 'linkId is required' });
    if (isConnected()) {
      const coll = await Collection.findByIdAndUpdate(req.params.id, { $addToSet: { itemIds: linkId } }, { new: true });
      return res.json(coll);
    }
    const coll = memCollections.find(c => c._id === req.params.id);
    if (!coll) return res.status(404).json({ message: 'Not found' });
    if (!coll.itemIds.includes(linkId)) coll.itemIds.push(linkId);
    res.json(coll);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

const getCollectionLinks = async (req, res) => {
  try {
    if (isConnected()) {
      const coll = await Collection.findById(req.params.id).populate('itemIds');
      if (!coll) return res.status(404).json({ message: 'Not found' });
      return res.json(coll.itemIds);
    }
    const coll = memCollections.find(c => c._id === req.params.id);
    if (!coll) return res.status(404).json({ message: 'Not found' });
    const links = getMemLinks();
    res.json(links.filter(l => coll.itemIds.includes(l._id)));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getCollections, createCollection, addToCollection, getCollectionLinks };
