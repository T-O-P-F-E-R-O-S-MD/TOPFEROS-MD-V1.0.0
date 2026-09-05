"use strict";

// Minimal settings API stub — exports registerSettingsRoutes
// Replace with the real implementation when available.

const settingsApi = {
  registerSettingsRoutes(app) {
    app.get('/api/settings', (req, res) => {
      return res.json({ success: true, settings: {} });
    });

    app.post('/api/settings', (req, res) => {
      return res.json({ success: true, message: 'Settings saved (stub)' });
    });
  }
};

module.exports = settingsApi;
