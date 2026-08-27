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
// 🖼️ BOT LOGO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const logoPath =
  path.join(
    __dirname,
    "..",
    "assets",
    "logo.png"
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
// 🖼️ SERVE BOT LOGO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/logo.png",
  (req, res) => {

    res.sendFile(
      logoPath,
      (error) => {

        if (error) {

          console.error(
            "❌ LOGO ERROR:",
            error?.message || error
          );

          if (!res.headersSent) {

            return res.status(404).json({
              success: false,
              message:
                "Logo assets/logo.png pa jwenn."
            });

          }

        }

      }
    );

  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 CHECK BOT CONNECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/status",
  (req, res) => {

    return res.json({
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
        error?.message || error
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
// ⚙️ GET SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/settings",
  (req, res) => {

    try {

      const sessionId =
        req.query.session;

      if (!sessionId) {

        return res.status(400).json({
          success: false,
          message:
            "Session ID manke."
        });

      }

      if (
        !settingsPanel.isAuthenticated(
          sessionId
        )
      ) {

        return res.status(401).json({
          success: false,
          message:
            "Session lan pa valid."
        });

      }

      if (
        !settingsPanel.isBotConnected()
      ) {

        return res.status(401).json({
          success: false,
          message:
            "Bot la dekonekte."
        });

      }

      return res.json({

        success: true,

        bot:
          settingsPanel.getBotInformation(),

        settings:
          settingsPanel.getSettings()

      });

    } catch (error) {

      console.error(
        "❌ GET SETTINGS ERROR:",
        error?.message || error
      );

      return res.status(500).json({

        success: false,

        message:
          "Erè pandan chajman settings yo."

      });

    }

  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 SAVE SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.post(
  "/api/settings",
  async (req, res) => {

    try {

      const {
        sessionId,
        bot,
        settings
      } = req.body || {};

      if (!sessionId) {

        return res.status(400).json({
          success: false,
          message:
            "Session ID manke."
        });

      }

      if (
        !settingsPanel.isAuthenticated(
          sessionId
        )
      ) {

        return res.status(401).json({
          success: false,
          message:
            "Session lan pa valid."
        });

      }

      if (
        !settingsPanel.isBotConnected()
      ) {

        return res.status(401).json({
          success: false,
          message:
            "Bot la dekonekte."
        });

      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ⚙️ APPLY RUNTIME SETTINGS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      const settingsSaved =
        await settingsPanel.applySettings({
          settings:
            settings || {}
        });

      if (!settingsSaved) {

        return res.status(500).json({
          success: false,
          message:
            "Settings yo pa t kapab aplike."
        });

      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🤖 UPDATE BOT INFORMATION
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      if (bot) {

        const botUpdated =
          await settingsPanel.updateBotInformation(
            bot
          );

        if (!botUpdated) {

          return res.status(500).json({
            success: false,
            message:
              "Bot information yo pa t kapab mete ajou."
          });

        }

      }

      return res.json({

        success: true,

        message:
          "Settings yo sove avèk siksè.",

        bot:
          settingsPanel.getBotInformation(),

        settings:
          settingsPanel.getSettings()

      });

    } catch (error) {

      console.error(
        "❌ SAVE SETTINGS ERROR:",
        error?.message || error
      );

      return res.status(500).json({

        success: false,

        message:
          "Erè pandan sauvegarde settings yo."

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

    try {

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

    } catch (error) {

      console.error(
        "❌ AUTH ERROR:",
        error?.message || error
      );

      return res.status(500).json({

        success: false,

        message:
          "Erè pandan verifikasyon session lan."

      });

    }

  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏠 PANEL HOME
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/",
  (req, res) => {

    return res.sendFile(
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

    return res.status(404).json({

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
      error?.message || error
    );

    if (res.headersSent) {

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
          "🖼️ Logo: assets/logo.png"
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