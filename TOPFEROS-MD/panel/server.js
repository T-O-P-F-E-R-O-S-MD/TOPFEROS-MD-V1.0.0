"use strict";

require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const pino = require("pino");

const config = require("../src/config");
const settingPanel = require("../src/settingPanel");
const sessionManager = require("../src/sessionManager");
const connection = require("../src/connection");
const language = require("../src/language");

const app = express();

const logger = pino({
  level: process.env.LOG_LEVEL || "info"
});

const PORT =
  Number(process.env.PANEL_PORT) ||
  Number(process.env.PORT) ||
  3000;

const PANEL_PUBLIC_DIR = path.resolve(
  __dirname,
  "public"
);

const ASSETS_DIR = path.resolve(
  __dirname,
  "..",
  "assets"
);

const BACKGROUND_FILE = path.resolve(
  __dirname,
  "background.png"
);

const LOGO_FILE = path.resolve(
  ASSETS_DIR,
  "logo.png"
);

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(express.json({
  limit: "2mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "2mb"
}));

// ============================================================
// STATIC FILES
// ============================================================

if (fs.existsSync(PANEL_PUBLIC_DIR)) {
  app.use(
    express.static(
      PANEL_PUBLIC_DIR
    )
  );
}

if (fs.existsSync(ASSETS_DIR)) {
  app.use(
    "/assets",
    express.static(
      ASSETS_DIR
    )
  );
}

// ============================================================
// HELPERS
// ============================================================

function cleanNumber(value) {
  return String(value || "")
    .replace(/\D/g, "");
}

function cleanSessionId(value) {
  return String(value || "")
    .replace(/\D/g, "");
}

function sendError(
  res,
  status,
  message
) {
  return res.status(status).json({
    success: false,
    message
  });
}

function getSessionId(req) {
  return cleanSessionId(
    req.body?.sessionId ||
    req.query?.sessionId ||
    req.query?.session ||
    req.params?.sessionId
  );
}

function getSessionOrFail(
  res,
  sessionId
) {
  if (!sessionId) {
    sendError(
      res,
      400,
      "Session ID is required."
    );

    return null;
  }

  const session =
    sessionManager.getSession(
      sessionId
    );

  if (!session) {
    sendError(
      res,
      404,
      "Session not found."
    );

    return null;
  }

  return session;
}

// ============================================================
// HOME
// ============================================================

app.get(
  "/",
  (req, res) => {
    const indexPath =
      path.join(
        PANEL_PUBLIC_DIR,
        "index.html"
      );

    if (
      fs.existsSync(indexPath)
    ) {
      return res.sendFile(
        indexPath
      );
    }

    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          >
          <title>TOPFEROS MD V2.0.0</title>
        </head>

        <body>
          <h1>🦁 TOPFEROS MD V2.0.0 🐑</h1>
          <p>🟢 ONLINE &amp; READY</p>
          <p>🦁 TECH BY TOPFEROS MD 🐑</p>
        </body>
      </html>
    `);
  }
);

// ============================================================
// SETTINGS PAGE
// ============================================================

app.get(
  "/setting",
  (req, res) => {
    const settingPath =
      path.join(
        PANEL_PUBLIC_DIR,
        "setting.html"
      );

    if (
      !fs.existsSync(settingPath)
    ) {
      return sendError(
        res,
        404,
        "Settings page not found."
      );
    }

    return res.sendFile(
      settingPath
    );
  }
);

// ============================================================
// HEALTH
// ============================================================

app.get(
  "/health",
  (req, res) => {
    return res.status(200).json({
      success: true,
      status: "ok",
      bot: "TOPFEROS MD",
      version: "2.0.0",
      uptime: process.uptime(),
      sessions:
        sessionManager.getActiveSessionCount()
    });
  }
);

// ============================================================
// PANEL INFORMATION
// ============================================================

app.get(
  "/api/panel",
  (req, res) => {
    return res.json({
      success: true,

      panel: {
        name:
          settingPanel.PANEL_NAME,

        version:
          settingPanel.BOT_VERSION
      },

      bot: {
        name:
          config.bot.name,

        version:
          config.bot.version,

        prefix:
          config.bot.prefix,

        mode:
          config.bot.mode,

        location:
          config.bot.location,

        language:
          config.bot.language,

        footer:
          config.bot.footer
      },

      assets: {
        logo:
          "/assets/logo.png",

        background:
          "/panel/background.png"
      },

      languages:
        language.getAvailableLanguages()
    });
  }
);

// ============================================================
// LANGUAGE LIST
// ============================================================

app.get(
  "/api/languages",
  (req, res) => {
    return res.json({
      success: true,
      languages:
        language.getAvailableLanguages(),

      default:
        language.getDefaultLanguage()
    });
  }
);

// ============================================================
// LANGUAGE
// ============================================================

app.post(
  "/api/language",
  (req, res) => {
    try {
      const sessionId =
        cleanSessionId(
          req.body?.sessionId
        );

      const selected =
        language.resolveLanguage(
          req.body?.language
        );

      if (
        sessionId
      ) {
        const session =
          sessionManager.getSession(
            sessionId
          );

        if (
          !session
        ) {
          return sendError(
            res,
            404,
            "Session not found."
          );
        }

        settingPanel.setPanelLanguage(
          sessionId,
          selected
        );
      }

      return res.json({
        success: true,
        language: selected
      });

    } catch (error) {
      logger.error(
        error,
        "❌ LANGUAGE ERROR"
      );

      return sendError(
        res,
        500,
        error.message ||
          "Unable to set language."
      );
    }
  }
);

// ============================================================
// TRANSLATION
// ============================================================

app.post(
  "/api/translate",
  (req, res) => {
    try {
      const selected =
        language.resolveLanguage(
          req.body?.language
        );

      const texts =
        Array.isArray(
          req.body?.texts
        )
          ? req.body.texts
          : [];

      if (
        !texts.length
      ) {
        return res.json({
          success: true,
          translations: []
        });
      }

      const translations =
        texts.map(text =>
          language.getText(
            selected,
            String(text || "")
          )
        );

      return res.json({
        success: true,
        language: selected,
        translations
      });

    } catch (error) {
      logger.error(
        error,
        "❌ TRANSLATION ERROR"
      );

      return sendError(
        res,
        500,
        "Translation failed."
      );
    }
  }
);

// ============================================================
// VERIFY SETTINGS SESSION
// ============================================================

app.post(
  "/api/verify",
  (req, res) => {
    try {
      const number =
        cleanNumber(
          req.body?.number
        );

      const code =
        String(
          req.body?.code || ""
        )
          .trim()
          .toUpperCase();

      let sessionId =
        cleanSessionId(
          req.body?.sessionId
        );

      if (!number) {
        return sendError(
          res,
          400,
          "Phone number is required."
        );
      }

      if (!code) {
        return sendError(
          res,
          400,
          "Settings code is required."
        );
      }

      let session = null;

      if (
        sessionId
      ) {
        session =
          sessionManager.getSession(
            sessionId
          );
      }

      if (
        !session
      ) {
        if (
          typeof sessionManager.getSessionByNumber ===
          "function"
        ) {
          session =
            sessionManager.getSessionByNumber(
              number
            );
        }
      }

      if (
        !session
      ) {
        return sendError(
          res,
          404,
          "No session found for this number."
        );
      }

      sessionId =
        session.sessionId ||
        session.id;

      // ------------------------------------------------------
      // V2 AUTHENTICATION
      // ------------------------------------------------------

      if (
        typeof sessionManager.verifySession !==
        "function"
      ) {
        return sendError(
          res,
          500,
          "Session verification is not available."
        );
      }

      const result =
        sessionManager.verifySession(
          sessionId,
          number,
          code
        );

      if (
        !result ||
        result.success !== true
      ) {
        return res.status(401).json({
          success: false,
          message:
            result?.message ||
            "Verification failed."
        });
      }

      const panelData =
        settingPanel.getPanelData(
          sessionId
        );

      return res.json({
        success: true,

        sessionId,

        settings:
          panelData.settings,

        bot:
          panelData.settings?.bot ||
          {},

        botInformation:
          panelData.settings?.bot ||
          {},

        connection:
          panelData.connection
      });

    } catch (error) {
      logger.error(
        error,
        "❌ VERIFY ERROR"
      );

      return sendError(
        res,
        500,
        error.message ||
          "Verification failed."
      );
    }
  }
);

// ============================================================
// SESSION STATUS
// ============================================================

app.get(
  "/api/session/:sessionId",
  (req, res) => {
    const sessionId =
      cleanSessionId(
        req.params.sessionId
      );

    if (!sessionId) {
      return sendError(
        res,
        400,
        "Invalid session ID."
      );
    }

    const session =
      sessionManager.getSession(
        sessionId
      );

    if (!session) {
      return res.json({
        success: true,
        exists: false,
        session: null
      });
    }

    return res.json({
      success: true,

      exists: true,

      session: {
        sessionId,

        connected:
          sessionManager.isConnected(
            sessionId
          ),

        manuallyStopped:
          sessionManager.isManuallyStopped
            ? sessionManager.isManuallyStopped(
                sessionId
              )
            : false
      }
    });
  }
);

// ============================================================
// GET SETTINGS
// ============================================================

app.get(
  "/api/settings",
  (req, res) => {
    try {
      const sessionId =
        getSessionId(req);

      if (!sessionId) {
        return sendError(
          res,
          400,
          "Session ID is required."
        );
      }

      if (
        !getSessionOrFail(
          res,
          sessionId
        )
      ) {
        return;
      }

      const data =
        settingPanel.getPanelData(
          sessionId
        );

      return res.json(
        data
      );

    } catch (error) {
      logger.error(
        error,
        "❌ GET SETTINGS ERROR"
      );

      return sendError(
        res,
        500,
        error.message ||
          "Unable to load settings."
      );
    }
  }
);

// ============================================================
// SAVE SETTINGS
// ============================================================

app.post(
  "/api/settings",
  (req, res) => {
    try {
      const sessionId =
        cleanSessionId(
          req.body?.sessionId
        );

      if (!sessionId) {
        return sendError(
          res,
          400,
          "Session ID is required."
        );
      }

      const session =
        getSessionOrFail(
          res,
          sessionId
        );

      if (!session) {
        return;
      }

      const result =
        settingPanel.saveSettings(
          sessionId,
          {
            bot:
              req.body?.bot || {},

            settings:
              req.body?.settings || {}
          }
        );

      return res.json(
        result
      );

    } catch (error) {
      logger.error(
        error,
        "❌ SAVE SETTINGS ERROR"
      );

      return sendError(
        res,
        400,
        error.message ||
          "Unable to save settings."
      );
    }
  }
);

// ============================================================
// DISCONNECT
// ============================================================

app.post(
  "/api/session/:sessionId/disconnect",
  async (req, res) => {
    try {
      const sessionId =
        cleanSessionId(
          req.params.sessionId
        );

      if (!sessionId) {
        return sendError(
          res,
          400,
          "Invalid session ID."
        );
      }

      const session =
        getSessionOrFail(
          res,
          sessionId
        );

      if (!session) {
        return;
      }

      if (
        typeof connection.disconnectSession !==
        "function"
      ) {
        return sendError(
          res,
          500,
          "Disconnect is not available."
        );
      }

      await connection.disconnectSession(
        sessionId
      );

      settingPanel.setDisconnected(
        sessionId
      );

      return res.json({
        success: true,

        connected: false,

        credentialsKept: true,

        message:
          "Session disconnected. Credentials were kept."
      });

    } catch (error) {
      logger.error(
        error,
        "❌ DISCONNECT ERROR"
      );

      return sendError(
        res,
        500,
        error.message ||
          "Unable to disconnect session."
      );
    }
  }
);

// ============================================================
// RECONNECT
// ============================================================

app.post(
  "/api/session/:sessionId/reconnect",
  async (req, res) => {
    try {
      const sessionId =
        cleanSessionId(
          req.params.sessionId
        );

      if (!sessionId) {
        return sendError(
          res,
          400,
          "Invalid session ID."
        );
      }

      const session =
        getSessionOrFail(
          res,
          sessionId
        );

      if (!session) {
        return;
      }

      if (
        typeof connection.reconnectSession ===
        "function"
      ) {
        await connection.reconnectSession(
          sessionId
        );
      } else if (
        typeof connection.startSession ===
        "function"
      ) {
        await connection.startSession(
          sessionId
        );
      } else {
        return sendError(
          res,
          500,
          "Reconnect is not available."
        );
      }

      settingPanel.setConnected(
        sessionId
      );

      return res.json({
        success: true,
        connected: true,
        message:
          "Session reconnect started."
      });

    } catch (error) {
      logger.error(
        error,
        "❌ RECONNECT ERROR"
      );

      return sendError(
        res,
        500,
        error.message ||
          "Unable to reconnect session."
      );
    }
  }
);

// ============================================================
// LOGO
// ============================================================

app.get(
  "/api/assets/logo",
  (req, res) => {
    if (
      !fs.existsSync(LOGO_FILE)
    ) {
      return sendError(
        res,
        404,
        "Logo not found."
      );
    }

    return res.sendFile(
      LOGO_FILE
    );
  }
);

// ============================================================
// BACKGROUND
// ============================================================

app.get(
  "/panel/background.png",
  (req, res) => {
    if (
      !fs.existsSync(
        BACKGROUND_FILE
      )
    ) {
      return sendError(
        res,
        404,
        "Panel background not found."
      );
    }

    return res.sendFile(
      BACKGROUND_FILE
    );
  }
);

// ============================================================
// 404
// ============================================================

app.use(
  (req, res) => {
    return res.status(404).json({
      success: false,
      message: "Route not found."
    });
  }
);

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
  (error, req, res, next) => {
    logger.error(
      error,
      "❌ PANEL SERVER ERROR"
    );

    if (
      res.headersSent
    ) {
      return next(error);
    }

    return res.status(500).json({
      success: false,
      message:
        "Internal panel server error."
    });
  }
);

// ============================================================
// START SERVER
// ============================================================

const server =
  app.listen(
    PORT,
    () => {
      logger.info(
        `🦁 TOPFEROS MD V2.0.0 PANEL running on port ${PORT}`
      );
    }
  );

// ============================================================
// SHUTDOWN
// ============================================================

function shutdown(
  signal
) {
  logger.info(
    `🛑 ${signal} received. Closing panel server...`
  );

  server.close(
    () => {
      logger.info(
        "🟢 Panel server closed."
      );

      process.exit(0);
    }
  );
}

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);

process.on(
  "uncaughtException",
  error => {
    logger.error(
      error,
      "❌ UNCAUGHT EXCEPTION"
    );
  }
);

process.on(
  "unhandledRejection",
  reason => {
    logger.error(
      reason,
      "❌ UNHANDLED REJECTION"
    );
  }
);

module.exports = {
  app,
  server
};