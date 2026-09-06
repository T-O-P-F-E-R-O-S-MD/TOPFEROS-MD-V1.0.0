// Minimal portal server stub
// This file provides a simple static server for the panel and a couple of stub API endpoints
// so the Render deployment keeps running and the frontend can call /api/language and /api/settings.

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Serve assets and panel public
const publicDir = path.join(__dirname, '..', 'panel', 'public');
const assetsDir = path.join(__dirname, '..', 'assets');

// Static routes
app.use('/assets', express.static(assetsDir));
app.use(express.static(publicDir));

// Health
app.get('/_health', (req, res) => res.json({ ok: true }));

// POST /api/language - store language in-memory (per-process) and respond
let lastLanguage = 'fr';
app.post('/api/language', (req, res) => {
  try {
    const { language } = req.body || {};
    if (language) lastLanguage = language;
    return res.json({ success: true, language: lastLanguage, showNumberInput: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'server_error' });
  }
});

// POST /api/settings - stub to generate a parrain code for a number
function randomCode(len = 8) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

app.post('/api/settings', (req, res) => {
  try {
    const { number } = req.body || {};
    // Basic validation
    if (!number || String(number).trim() === '') {
      // return success false but still keep server running
      return res.status(400).json({ success: false, error: 'number_missing' });
    }

    // Generate stub code
    const code = `TP-${randomCode(6)}`;

    return res.json({ success: true, code });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'server_error' });
  }
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`⚡ Panel stub server listening on port ${PORT} (serving ${publicDir})`);
});
