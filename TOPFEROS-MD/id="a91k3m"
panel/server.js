"use strict";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ TOPFEROS MD — SETTINGS PANEL SERVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const express = require("express");
const path = require("path");

const settingsPanel =
  require("../settings/panel");

const settingsApi =
  require("./settings-api");

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
// 📁 PUBLIC DIRECTORY
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
// 🌐 STATIC FILES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(
  express.static(publicDir)
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 BOT STATUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/status",
  (req, res) => {

    try {

      const connected =
        settingsPanel.isBotConnected();

      return res.json({
        success: true,
        connected:
          connected === true
      });

    } catch (error) {

      console.error(
        "❌ BOT STATUS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        connected: false,
        message:
          "Pa kapab verifye koneksyon bot la."
      });
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 LOGIN
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


      if (
        !settingsPanel.isBotConnected()
      ) {

        return res.status(401).json({
          success: false,
          message:
            "Bot la dekonekte. Code la pa ka sèvi."
        });
      }


      const result =
        settingsPanel.verifySession(
          sessionId,
          number,
          code
        );


      if (
        !result ||
        result.success !== true
      ) {

        return res.status(401).json(
          result || {
            success: false,
            message:
              "Number oswa Code pa valid."
          }
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
// 🔒 AUTH CHECK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/auth",
  (req, res) => {

    try {

      const sessionId =
        req.query.session;


      if (!sessionId) {

        return res.status(401).json({
          success: false,
          connected: false,
          message:
            "Session manke."
        });
      }


      const connected =
        settingsPanel.isBotConnected();


      const authenticated =
        connected === true &&
        settingsPanel.isAuthenticated(
          sessionId
        );


      if (!authenticated) {

        return res.status(401).json({
          success: false,
          connected:
            connected === true,
          message:
            "Session la pa valid oswa bot la dekonekte."
        });
      }


      return res.json({
        success: true,
        connected: true
      });

    } catch (error) {

      console.error(
        "❌ AUTH CHECK ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        connected: false,
        message:
          "Erè pandan verifikasyon session lan."
      });
    }
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ SETTINGS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// GET  /api/settings
// POST /api/settings
//
// Se settings-api.js ki jere yo.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

settingsApi.registerSettingsRoutes(
  app
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏠 HOME
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
// ⚙️ SETTINGS PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/settings",
  (req, res) => {

    res.sendFile(
      path.join(
        publicDir,
        "settings.html"
      )
    );
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚫 API 404
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(
  "/api",
  (req, res) => {

    return res.status(404).json({
      success: false,
      message:
        "API route pa jwenn."
    });
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ❌ GLOBAL ERROR HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(
  (
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "❌ PANEL SERVER ERROR:",
      error
    );


    if (
      res.headersSent
    ) {
      return next(error);
    }


    return res.status(500).json({
      success: false,
      message:
        "Erè entèn nan panel la."
    });
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 SERVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let server = null;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▶️ START
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
          "⚙️ TOPFEROS MD SETTINGS PANEL"
        );

        console.log(
          `🌐 HOST: ${HOST}`
        );

        console.log(
          `🔌 PORT: ${PORT}`
        );

        console.log(
          "🟢 PANEL SERVER RUNNING"
        );

        console.log(
          "⚙️ SETTINGS API ACTIVE"
        );

        console.log(
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        );
      }
    );


  return server;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⛔ STOP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function stopPanel() {

  if (!server) {
    return false;
  }


  server.close(
    () => {

      console.log(
        "🔴 SETTINGS PANEL STOPPED."
      );

    }
  );


  server = null;

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