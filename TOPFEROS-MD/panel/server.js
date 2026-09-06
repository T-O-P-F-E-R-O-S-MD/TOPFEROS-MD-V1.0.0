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

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(publicDir));
app.use("/assets", express.static(assetsDir));

app.get("/assets/logo.png", (req, res) => {
  res.sendFile(path.join(assetsDir, "logo.png"));
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
});

/* =========================
   VERIFY SETTINGS CODE
========================= */

app.post("/api/verify", (req, res) => {
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
});

/* =========================
   GET SETTINGS
========================= */

app.get("/api/settings", (req, res) => {
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
});

/* =========================
   SAVE SETTINGS
========================= */

app.post("/api/settings", (req, res) => {
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
});

/* =========================
   LANGUAGE
========================= */

app.post("/api/language", (req, res) => {
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
});

/* =========================
   LOGOUT PANEL
========================= */

app.post("/api/logout", (req, res) => {
  const { sessionId } = req.body || {};

  const session = settingsPanel.getSession(sessionId);

  if (session) {
    session.authenticated = false;
  }

  res.json({
    success: true
  });
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
    console.log("🤖 TOPFEROS MD WhatsApp started");
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
    console.error(error);
  }

  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

module.exports = {
  app,
  server
};