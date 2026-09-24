// Local/Node entry point (npm start, Render, VPS, local dev).
// The Cloudflare Worker uses worker/index.js instead.
const { app, initDatabase } = require('./app');

const PORT = process.env.PORT || 5000;

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`✨ KATHRAZ Fragrances backend server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
