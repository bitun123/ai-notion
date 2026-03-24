const express = require('express');
const cors = require('cors');

const linksRouter = require('./routes/links');
const collectionsRouter = require('./routes/collections');
const highlightsRouter = require('./routes/highlights');
const resurfaceRouter = require('./routes/resurface');
const searchRouter = require('./routes/search');
const graphRouter = require('./routes/graph');
const askRouter = require('./routes/ask');
const clustersRouter = require('./routes/clusters');

const app = express();

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/links', linksRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/highlights', highlightsRouter);
app.use('/api/resurface', resurfaceRouter);
app.use('/api/search', searchRouter);
app.use('/api/graph', graphRouter);
app.use('/api/ask', askRouter);
app.use('/api/clusters', clustersRouter);

module.exports = app;
