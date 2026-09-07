"use strict";

const path = require("path");
const express = require("express");

const settingsPanel = require("../settings/panel");
const connection = require("../src/connection");

const app = express();

const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || "0.0.0.0";

/* =========================
   DIRECTORIES
========================= */

const publicDir = path.resolve(__dirname, "public");
const assetsDir = path.resolve(__dirname, "..", "assets");
const backgroundFile = path.resolve(__dirname, "background.png");

/* =========================
   MIDDLEWARE
========================= */

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   STATIC FILES
========================= */

app.use(express.static(publicDir));

/* =========================
   BOT LOGO
========================= */

app.use("/assets", express.static(assetsDir));

app.get("/assets/logo.png", (req, res) => {
  res.sendFile(path.join(assetsDir, "logo.png"));
});

/* =========================
   PANEL BACKGROUND
========================= */

app.get("/background.png", (req, res) => {
  res.sendFile(backgroundFile);
});

/* =========================
   BOT STATUS
========================= */

app.get("/api/status", (req, res) => {
  try {
    const connected = connection.isConnected();

    res.json({
      success: true,
      connected,
      number: connection.getPhoneNumber?.() || ""
    });

  } catch (error) {
    console.error("❌ Status error:", error);

    res.status(500).json({
      success: false,
      connected: false,
      number: ""
    });
  }
});

/* =========================
   CURRENT SESSION
   Used after WhatsApp connects
========================= */

app.get("/api/current-session", (req, res) => {
  try {
    if (!connection.isConnected()) {
      return res.status(404).json({
        success: false,
        error: "BOT_NOT_CONNECTED",
        message: "Bot is not connected yet."
      });
    }

    const socket = connection.getSocket?.();

    if (!socket) {
      return res.status(404).json({
        success: false,
        error: "SOCKET_NOT_FOUND"
      });
    }

    /*
     * createSession() returns the existing
     * session for this socket/number if it
     * already exists, otherwise it creates one.
     */
    const session = settingsPanel.createSession(socket);

    if (!session || !session.sessionId) {
      return res.status(404).json({
        success: false,
        error: "SESSION_NOT_FOUND"
      });
    }

    res.json({
      success: true,
      connected: true,
      sessionId: session.sessionId,
      number: session.number || "",
      settingsLink: session.link || ""
    });

  } catch (error) {
    console.error(
      "❌ Current session error:",
      error
    );

    res.status(500).json({
      success: false,
      error: "CURRENT_SESSION_FAILED"
    });
  }
});

/* =========================
   WHATSAPP PAIRING CODE
========================= */

app.post("/api/pairing", async (req, res) => {
  try {
    const { number } = req.body || {};

    const cleanNumber = String(number || "")
      .replace(/\D/g, "");

    if (!cleanNumber) {
      return res.status(400).json({
        success: false,
        error: "NUMBER_REQUIRED",
        message: "WhatsApp number is required."
      });
    }

    if (cleanNumber.length < 8) {
      return res.status(400).json({
        success: false,
        error: "INVALID_NUMBER",
        message: "Invalid WhatsApp number."
      });
    }

    if (connection.isConnected()) {
      return res.status(409).json({
        success: false,
        error: "ALREADY_CONNECTED",
        message: "Bot is already connected."
      });
    }

    console.log(
      `📱 Pairing Code requested for: ${cleanNumber}`
    );

    const code =
      await connection.requestPairingCode(
        cleanNumber
      );

    if (!code) {
      return res.status(500).json({
        success: false,
        error: "PAIRING_CODE_EMPTY",
        message:
          "Pairing Code could not be generated."
      });
    }

    console.log(
      `🔐 Pairing Code generated for ${cleanNumber}`
    );

    res.json({
      success: true,
      number: cleanNumber,
      code
    });

  } catch (error) {
    console.error(
      "❌ Pairing Code error:",
      error
    );

    res.status(500).json({
      success: false,
      error: "PAIRING_FAILED",
      message:
        error?.message ||
        "Unable to generate Pairing Code."
    });
  }
});

/* =========================
   SESSION INFORMATION
========================= */

app.get(
  "/api/session/:sessionId",
  (req, res) => {
    try {
      const session =
        settingsPanel.getSession(
          req.params.sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "SESSION_NOT_FOUND"
        });
      }

      /*
       * Security:
       * Never expose the Settings Code
       * through this endpoint.
       */
      const panelUrl =
        process.env.SETTINGS_PANEL_URL ||
        process.env.PANEL_URL ||
        "https://topferos-md-v1-0-0.onrender.com";

      res.json({
        success: true,
        exists: true,
        authenticated:
          !!session.authenticated,
        number:
          session.number || "",
        settingsLink:
          `${panelUrl}/?session=${session.sessionId}`
      });

    } catch (error) {
      console.error(
        "❌ Session error:",
        error
      );

      res.status(500).json({
        success: false,
        error: "SESSION_ERROR"
      });
    }
  }
);

/* =========================
   VERIFY SETTINGS CODE
========================= */

app.post("/api/verify", (req, res) => {
  try {
    const {
      sessionId,
      code
    } = req.body || {};

    if (!sessionId || !code) {
      return res.status(400).json({
        success: false,
        error: "SESSION_AND_CODE_REQUIRED"
      });
    }

    const result =
      settingsPanel.verifySession(
        sessionId,
        code
      );

    if (!result || !result.success) {
      return res.status(401).json(
        result || {
          success: false,
          error: "INVALID_SETTINGS_CODE"
        }
      );
    }

    res.json({
      success: true,
      message:
        "Settings Code verified",
      settings:
        result.session.settings,
      botInformation:
        result.session.botInformation
    });

  } catch (error) {
    console.error(
      "❌ Verification error:",
      error
    );

    res.status(500).json({
      success: false,
      error: "VERIFICATION_FAILED"
    });
  }
});

/* =========================
   GET SETTINGS
========================= */

app.get("/api/settings", (req, res) => {
  try {
    const sessionId =
      req.query.sessionId;

    if (
      !sessionId ||
      !settingsPanel.isAuthenticated(
        sessionId
      )
    ) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED"
      });
    }

    const data =
      settingsPanel.loadSettings(
        sessionId
      );

    if (!data) {
      return res.status(404).json({
        success: false,
        error: "SETTINGS_NOT_FOUND"
      });
    }

    res.json({
      success: true,
      ...data
    });

  } catch (error) {
    console.error(
      "❌ Load settings error:",
      error
    );

    res.status(500).json({
      success: false,
      error: "LOAD_SETTINGS_FAILED"
    });
  }
});

/* =========================
   SAVE SETTINGS
========================= */

app.post("/api/settings", (req, res) => {
  try {
    const {
      sessionId,
      settings,
      botInformation
    } = req.body || {};

    if (
      !sessionId ||
      !settingsPanel.isAuthenticated(
        sessionId
      )
    ) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED"
      });
    }

    const savedSettings =
      settingsPanel.applySettings(
        sessionId,
        settings || {}
      );

    const savedBotInformation =
      settingsPanel.updateBotInformation(
        sessionId,
        botInformation || {}
      );

    if (
      !savedSettings ||
      !savedBotInformation
    ) {
      return res.status(400).json({
        success: false,
        error: "SAVE_FAILED"
      });
    }

    res.json({
      success: true,
      message:
        "Settings saved successfully",
      settings:
        savedSettings,
      botInformation:
        savedBotInformation
    });

  } catch (error) {
    console.error(
      "❌ Save settings error:",
      error
    );

    res.status(500).json({
      success: false,
      error: "SAVE_SETTINGS_FAILED"
    });
  }
});

/* =========================
   LANGUAGE
========================= */

app.post("/api/language", (req, res) => {
  try {
    const { language } =
      req.body || {};

    const allowed = [
      "en",
      "fr",
      "es"
    ];

    if (!allowed.includes(language)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_LANGUAGE"
      });
    }

    res.json({
      success: true,
      language
    });

  } catch (error) {
    console.error(
      "❌ Language error:",
      error
    );

    res.status(500).json({
      success: false,
      error: "LANGUAGE_FAILED"
    });
  }
});

/* =========================
   LOGOUT PANEL
========================= */

app.post("/api/logout", (req, res) => {
  try {
    const {
      sessionId
    } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "SESSION_REQUIRED"
      });
    }

    const session =
      settingsPanel.getSession(
        sessionId
      );

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "SESSION_NOT_FOUND"
      });
    }

    session.authenticated = false;

    res.json({
      success: true,
      message: "Panel logged out successfully."
    });

  } catch (error) {
    console.error(
      "❌ Logout error:",
      error
    );

    res.status(500).json({
      success: false,
      error: "LOGOUT_FAILED"
    });
  }
});

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
  res.sendFile(
    path.join(
      publicDir,
      "index.html"
    )
  );
});

/* =========================
   404 API HANDLER
========================= */

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: "API_ROUTE_NOT_FOUND"
  });
});

/* =========================
   START SERVER
========================= */

const server = app.listen(
  PORT,
  HOST,
  () => {
    console.log(
      `🌐 TOPFEROS MD PANEL running on ${HOST}:${PORT}`
    );
  }
);

/* =========================
   START WHATSAPP
========================= */

async function startWhatsApp() {
  try {
    await connection.start();

    console.log(
      "🤖 TOPFEROS MD WhatsApp started"
    );

  } catch (error) {
    console.error(
      "❌ WhatsApp start error:",
      error
    );

    setTimeout(
      startWhatsApp,
      5000
    );
  }
}

startWhatsApp();

/* =========================
   SHUTDOWN
========================= */

async function shutdown(signal) {
  console.log(
    `\n🛑 ${signal} received`
  );

  try {
    await connection.stop();

  } catch (error) {
    console.error(
      "❌ Shutdown error:",
      error
    );
  }

  server.close(() => {
    process.exit(0);
  });
}

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);

/* =========================
   EXPORTS
========================= */

module.exports = {
  app,
  server
};