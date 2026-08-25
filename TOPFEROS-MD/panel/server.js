"use strict";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ TOPFEROS MD — SETTINGS PANEL SERVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const express = require("express");
const path = require("path");

const settingsPanel =
  require("../settings/panel");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 EXPRESS APP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const app = express();

const PORT =
  process.env.PANEL_PORT ||
  process.env.PORT ||
  3000;

const HOST =
  process.env.PANEL_HOST ||
  "0.0.0.0";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 PANEL DIRECTORY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const publicDir =
  path.join(
    __dirname,
    "public"
  );

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 MIDDLEWARE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb"
  })
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 STATIC PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(
  express.static(publicDir)
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 CHECK BOT CONNECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/status",
  (req, res) => {
    res.json({
      success: true,
      connected:
        settingsPanel.isBotConnected()
    });
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 VERIFY NUMBER + CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.post(
  "/api/login",
  (req, res) => {
    try {
      const {
        sessionId,
        number,
        code
      } = req.body || {};

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message:
            "Session ID manke."
        });
      }

      const result =
        settingsPanel.verifySession(
          sessionId,
          number,
          code
        );

      if (!result.success) {
        return res.status(401).json(
          result
        );
      }

      return res.json({
        success: true,
        message:
          "Login reyisi.",
        sessionId
      });

    } catch (error) {
      console.error(
        "❌ PANEL LOGIN ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Erè pandan verifikasyon an."
      });
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔒 VERIFY AUTHENTICATED SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/auth",
  (req, res) => {
    const sessionId =
      req.query.session;

    const authenticated =
      settingsPanel.isAuthenticated(
        sessionId
      );

    if (!authenticated) {
      return res.status(401).json({
        success: false,
        message:
          "Session lan pa valid."
      });
    }

    return res.json({
      success: true,
      connected:
        settingsPanel.isBotConnected()
    });
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏠 PANEL HOME
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/",
  (req, res) => {
    res.sendFile(
      path.join(
        publicDir,
        "index.html"
      )
    );
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚫 404 API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(
  "/api",
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "API route pa jwenn."
    });
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ❌ ERROR HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(
  (error, req, res, next) => {
    console.error(
      "❌ PANEL SERVER ERROR:",
      error
    );

    if (res.headersSent) {
      return next(error);
    }

    res.status(500).json({
      success: false,
      message:
        "Erè entèn nan panel la."
    });
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 START SERVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let server = null;

function startPanel() {
  if (server) {
    return server;
  }

  server =
    app.listen(
      PORT,
      HOST,
      () => {
        console.log(
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        );

        console.log(
          "⚙️ TOPFEROS SETTINGS PANEL"
        );

        console.log(
          `🌐 Port: ${PORT}`
        );

        console.log(
          `🏠 Host: ${HOST}`
        );

        console.log(
          "🟢 Panel server is running."
        );

        console.log(
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        );
      }
    );

  return server;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛑 STOP SERVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function stopPanel() {
  if (!server) {
    return false;
  }

  server.close();

  server = null;

  console.log(
    "🔴 SETTINGS PANEL SERVER STOPPED."
  );

  return true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  app,
  startPanel,
  stopPanel
};