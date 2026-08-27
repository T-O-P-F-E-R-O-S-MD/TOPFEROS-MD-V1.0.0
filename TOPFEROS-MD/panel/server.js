"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║          ⚙️ MULTI-SESSION SETTINGS PANEL          ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝

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
// 🖼️ LOGO PATH
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
// 🖼️ SERVE LOGO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/logo.png",
  (req, res) => {

    res.sendFile(
      logoPath,
      error => {

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
// 🟢 GLOBAL STATUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/status",
  (req, res) => {

    try {

      const sessions =
        settingsPanel.getConnectedSessions();

      return res.json({

        success: true,

        connected:
          sessions.length > 0,

        sessionCount:
          sessions.length,

        sessions

      });

    } catch (error) {

      console.error(
        "❌ STATUS ERROR:",
        error?.message || error
      );

      return res.status(500).json({

        success: false,

        message:
          "Pa kapab verifye status bot yo."

      });

    }

  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 LOGIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/login
//
// body:
// {
//   sessionId,
//   number,
//   code
// }
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

      if (!number) {

        return res.status(400).json({

          success: false,

          message:
            "Number manke."

        });

      }

      if (!code) {

        return res.status(400).json({

          success: false,

          message:
            "Code manke."

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

        sessionId,

        number:
          result.session.number

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
// 🔒 AUTH SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/auth?session=SESSION_ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/auth",
  (req, res) => {

    try {

      const sessionId =
        String(
          req.query.session || ""
        ).trim();

      if (!sessionId) {

        return res.status(401).json({

          success: false,

          connected: false,

          message:
            "Session ID manke."

        });

      }

      const authenticated =
        settingsPanel.isAuthenticated(
          sessionId
        );

      if (!authenticated) {

        return res.status(401).json({

          success: false,

          connected: false,

          message:
            "Session lan pa valid oswa bot la dekonekte."

        });

      }

      const sessionInfo =
        settingsPanel.getSessionInfo(
          sessionId
        );

      return res.json({

        success: true,

        connected: true,

        sessionId,

        number:
          sessionInfo?.number || null

      });

    } catch (error) {

      console.error(
        "❌ AUTH ERROR:",
        error?.message || error
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
// ⚙️ GET SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/settings?session=SESSION_ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/settings",
  (req, res) => {

    try {

      const sessionId =
        String(
          req.query.session || ""
        ).trim();

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
            "Session lan pa otantifye oswa bot la dekonekte."

        });

      }

      const bot =
        settingsPanel.getBotInformation(
          sessionId
        );

      const settings =
        settingsPanel.getSettings(
          sessionId
        );

      const sessionInfo =
        settingsPanel.getSessionInfo(
          sessionId
        );

      return res.json({

        success: true,

        sessionId,

        bot,

        settings,

        connected:
          sessionInfo?.connected === true

      });

    } catch (error) {

      console.error(
        "❌ GET SETTINGS ERROR:",
        error?.message || error
      );

      return res.status(500).json({

        success: false,

        message:
          "Pa kapab chaje settings yo."

      });

    }

  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 SAVE SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/settings
//
// body:
// {
//   sessionId,
//   bot,
//   settings
// }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.post(
  "/api/settings",
  async (req, res) => {

    try {

      const {
        sessionId,
        bot = {},
        settings = {}
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
            "Session lan pa valid oswa bot la dekonekte."

        });

      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🤖 UPDATE BOT INFORMATION
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      const botUpdated =
        await settingsPanel.updateBotInformation(
          sessionId,
          bot
        );

      if (!botUpdated) {

        return res.status(409).json({

          success: false,

          message:
            "Bot session sa a pa konekte ankò."

        });

      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ⚙️ APPLY SETTINGS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      const settingsUpdated =
        await settingsPanel.applySettings(
          sessionId,
          {
            settings
          }
        );

      if (!settingsUpdated) {

        return res.status(409).json({

          success: false,

          message:
            "Settings yo pa kapab aplike pou session sa a."

        });

      }

      return res.json({

        success: true,

        message:
          "Settings yo sove avèk siksè.",

        sessionId,

        bot:
          settingsPanel.getBotInformation(
            sessionId
          ),

        settings:
          settingsPanel.getSettings(
            sessionId
          )

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
// 🔘 UPDATE ONE SETTING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/settings/toggle
//
// body:
// {
//   sessionId,
//   name,
//   value
// }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.post(
  "/api/settings/toggle",
  async (req, res) => {

    try {

      const {
        sessionId,
        name,
        value
      } = req.body || {};

      if (!sessionId) {

        return res.status(400).json({

          success: false,

          message:
            "Session ID manke."

        });

      }

      if (!name) {

        return res.status(400).json({

          success: false,

          message:
            "Setting name manke."

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

      const updated =
        await settingsPanel.setSetting(
          sessionId,
          name,
          value === true
        );

      if (!updated) {

        return res.status(400).json({

          success: false,

          message:
            "Setting sa a pa disponib."

        });

      }

      return res.json({

        success: true,

        message:
          "Setting la mete ajou.",

        sessionId,

        name,

        value:
          settingsPanel.getSetting(
            sessionId,
            name
          )

      });

    } catch (error) {

      console.error(
        "❌ TOGGLE SETTING ERROR:",
        error?.message || error
      );

      return res.status(500).json({

        success: false,

        message:
          "Erè pandan modification setting la."

      });

    }

  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 SESSION INFORMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/session?session=SESSION_ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/session",
  (req, res) => {

    try {

      const sessionId =
        String(
          req.query.session || ""
        ).trim();

      if (!sessionId) {

        return res.status(400).json({

          success: false,

          message:
            "Session ID manke."

        });

      }

      const info =
        settingsPanel.getSessionInfo(
          sessionId
        );

      if (!info) {

        return res.status(404).json({

          success: false,

          message:
            "Session lan pa jwenn."

        });

      }

      return res.json({

        success: true,

        session: info

      });

    } catch (error) {

      console.error(
        "❌ SESSION INFO ERROR:",
        error?.message || error
      );

      return res.status(500).json({

        success: false,

        message:
          "Pa kapab jwenn enfòmasyon session lan."

      });

    }

  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚪 LOGOUT / DELETE PANEL SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/logout
//
// body:
// {
//   sessionId
// }
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.post(
  "/api/logout",
  (req, res) => {

    try {

      const {
        sessionId
      } = req.body || {};

      if (!sessionId) {

        return res.status(400).json({

          success: false,

          message:
            "Session ID manke."

        });

      }

      const deleted =
        settingsPanel.deleteSession(
          sessionId
        );

      if (!deleted) {

        return res.status(404).json({

          success: false,

          message:
            "Session lan pa jwenn."

        });

      }

      return res.json({

        success: true,

        message:
          "Session panel la fèmen."

      });

    } catch (error) {

      console.error(
        "❌ LOGOUT ERROR:",
        error?.message || error
      );

      return res.status(500).json({

        success: false,

        message:
          "Erè pandan logout."

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

    res.sendFile(
      path.join(
        publicDir,
        "index.html"
      ),
      error => {

        if (error) {

          console.error(
            "❌ PANEL HOME ERROR:",
            error?.message || error
          );

          if (!res.headersSent) {

            res.status(500).send(
              "TOPFEROS MD Panel pa kapab chaje."
            );

          }

        }

      }
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

    console.log(
      "⚠️ Panel server deja ap kouri."
    );

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
          "⚙️ TOPFEROS MD MULTI-SESSION PANEL"
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
          "👥 Multi-session: ENABLED"
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

  server.close(
    () => {

      console.log(
        "🔴 SETTINGS PANEL SERVER STOPPED."
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

// ╔════════════════════════════════════════════════════╗
// ║                 By TOPFEROS TECH                  ║
// ╚════════════════════════════════════════════════════╝