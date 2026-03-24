require('dotenv').config();
const cron = require('node-cron');
const app = require('./app');
const { connectDB } = require('./db/connection');
const { updateResurfacedItems } = require('./utils/resurfaceUtils');
const { PORT } = require('./config');

// ─── Database ─────────────────────────────────────────────────────────────────
connectDB();

// ─── Cron Job (daily resurface at midnight) ───────────────────────────────────
cron.schedule('0 0 * * *', updateResurfacedItems);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  updateResurfacedItems();
});
