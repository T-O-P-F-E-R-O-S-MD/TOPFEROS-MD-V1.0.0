"use strict";

const path = require("path");
const express = require("express");

const settingsPanel = require("../settings/panel");
const connection = require("../src/connection");

const app = express();

const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || "0.0.0.0";

const publicDir = path.resolve(__dirname, "public");
const assetsDir = path.resolve(__dirname, "..", "assets");
const backgroundFile = path.resolve(__dirname, "background.png");

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   STATIC FILES
========================= */

app.use(express.static(publicDir));

/* Bot logo
   TOPFEROS-MD/assets/logo.png
*/
app.use("/assets", express.static(assetsDir));

app.get("/assets/logo.png", (req, res) => {
  res.sendFile(path.join(assetsDir, "logo.png"));
});

/* Background
   TOPFEROS-MD/panel/background.png
*/
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
      connected: false
    });
  }
});

/* =========================
   SESSION INFORMATION
========================= */

app.get("/api/session/:sessionId", (req, res) => {
  try {
    const session = settingsPanel.getSession(
      req.params.sessionId
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "SESSION_NOT_FOUND"
      });
    }

    res.json({
      success: true,
      exists: true,
      authenticated: !!session.authenticated,
      number: session.number
    });
  } catch (error) {
    console.error("❌ Session error:", error);

    res.status(500).json({
      success: false,
      error: "SESSION_ERROR"
    });
  }
});

/* =========================
   VERIFY SETTINGS CODE
========================= */

app.post("/api/verify", (req, res) => {
  try {
    const { sessionId, code } = req.body || {};

    if (!sessionId || !code) {
      return res.status(400).json({
        success: false,
        error: "SESSION_AND_CODE_REQUIRED"
      });
    }

    const result = settingsPanel.verifySession(
      sessionId,
      code
    );

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json({
      success: true,
      message: "Settings Code verified",
      settings: result.session.settings,
      botInformation: result.session.botInformation
    });
  } catch (error) {
    console.error("❌ Verification error:", error);

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
    const sessionId = req.query.sessionId;

    if (!settingsPanel.isAuthenticated(sessionId)) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED"
      });
    }

    const data = settingsPanel.loadSettings(sessionId);

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error("❌ Load settings error:", error);

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

    if (!settingsPanel.isAuthenticated(sessionId)) {
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

    if (!savedSettings || !savedBotInformation) {
      return res.status(400).json({
        success: false,
        error: "SAVE_FAILED"
      });
    }

    res.json({
      success: true,
      message: "Settings saved successfully",
      settings: savedSettings,
      botInformation: savedBotInformation
    });
  } catch (error) {
    console.error("❌ Save settings error:", error);

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
    const { sessionId, language } = req.body || {};

    const allowed = ["en", "fr", "es"];

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
    console.error("❌ Language error:", error);

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
    const { sessionId } = req.body || {};

    const session = settingsPanel.getSession(sessionId);

    if (session) {
      session.authenticated = false;
    }

    res.json({
      success: true
    });
  } catch (error) {
    console.error("❌ Logout error:", error);

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
    path.join(publicDir, "index.html")
  );
});

/* =========================
   START SERVER
========================= */

const server = app.listen(PORT, HOST, () => {
  console.log(
    `🌐 TOPFEROS SETTINGS PANEL running on ${HOST}:${PORT}`
  );
});

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

    setTimeout(startWhatsApp, 5000);
  }
}

startWhatsApp();

/* =========================
   SHUTDOWN
========================= */

async function shutdown(signal) {
  console.log(`\n🛑 ${signal} received`);

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

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

/* =========================
   EXPORTS
========================= */

module.exports = {
  app,
  server
};