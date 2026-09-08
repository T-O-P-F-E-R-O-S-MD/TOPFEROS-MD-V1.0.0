"use strict";

const path = require("path");
const express = require("express");

const settingsPanel = require("../settings/panel");
const connection = require("../src/connection");
const sessionManager = require("../src/sessionManager");

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
   HELPERS
========================= */

function cleanNumber(number) {
  return String(number || "").replace(/\D/g, "");
}

function getSessionId(req) {
  return (
    req.query?.sessionId ||
    req.body?.sessionId ||
    req.params?.sessionId ||
    null
  );
}

function getConnectionSession(sessionId) {
  if (!sessionId) return null;

  try {
    return sessionManager.getSession(sessionId);
  } catch {
    return null;
  }
}

function getSocketForSession(sessionId) {
  if (!sessionId) return null;

  try {
    return connection.getSocket(sessionId);
  } catch {
    return null;
  }
}

/* =========================
   BOT STATUS
   MULTI-SESSION
========================= */

app.get("/api/status", (req, res) => {
  try {
    const sessionId =
      req.query?.sessionId || null;

    /*
     * No sessionId:
     * return general server status.
     */
    if (!sessionId) {
      const sessions =
        sessionManager.listPublicSessions();

      const connectedSessions =
        sessions.filter(
          session => session.connected
        );

      return res.json({
        success: true,
        connected:
          connectedSessions.length > 0,
        sessions:
          sessions.length,
        connectedSessions:
          connectedSessions.length
      });
    }

    const session =
      getConnectionSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        connected: false,
        error: "SESSION_NOT_FOUND"
      });
    }

    const connected =
      connection.isConnected(sessionId);

    res.json({
      success: true,
      connected,
      sessionId,
      number:
        session.number ||
        connection.getPhoneNumber(sessionId) ||
        "",
      status:
        session.status || "disconnected"
    });

  } catch (error) {
    console.error(
      "❌ Status error:",
      error
    );

    res.status(500).json({
      success: false,
      connected: false,
      error: "STATUS_FAILED"
    });
  }
});

/* =========================
   ALL SESSIONS
   ADMIN / SERVER STATUS
========================= */

app.get("/api/sessions", (req, res) => {
  try {
    const sessions =
      sessionManager.listPublicSessions();

    res.json({
      success: true,
      count: sessions.length,
      sessions
    });

  } catch (error) {
    console.error(
      "❌ Sessions error:",
      error
    );

    res.status(500).json({
      success: false,
      error: "SESSIONS_FAILED"
    });
  }
});

/* =========================
   CURRENT SESSION
========================= */

app.get("/api/current-session", (req, res) => {
  try {
    const requestedSessionId =
      req.query?.sessionId || null;

    /*
     * If the frontend already knows
     * the sessionId, use that session.
     */
    if (requestedSessionId) {
      const session =
        getConnectionSession(
          requestedSessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "SESSION_NOT_FOUND"
        });
      }

      const socket =
        getSocketForSession(
          requestedSessionId
        );

      const connected =
        connection.isConnected(
          requestedSessionId
        );

      return res.json({
        success: true,
        connected,
        sessionId:
          requestedSessionId,
        number:
          session.number ||
          connection.getPhoneNumber(
            requestedSessionId
          ) ||
          "",
        settingsLink:
          `${process.env.SETTINGS_PANEL_URL ||
            process.env.PANEL_URL ||
            "https://topferos-md-v1-0-0.onrender.com"}/?session=${requestedSessionId}`,
        socket:
          !!socket
      });
    }

    /*
     * Backward-compatible fallback:
     * find a connected session.
     */
    const sessions =
      sessionManager.listSessions();

    const connectedSession =
      sessions.find(
        session => session.connected
      );

    if (!connectedSession) {
      return res.status(404).json({
        success: false,
        error: "BOT_NOT_CONNECTED",
        message:
          "No WhatsApp session is connected."
      });
    }

    const socket =
      getSocketForSession(
        connectedSession.sessionId
      );

    if (!socket) {
      return res.status(404).json({
        success: false,
        error: "SOCKET_NOT_FOUND"
      });
    }

    const session =
      settingsPanel.createSession(
        socket
      );

    if (!session?.sessionId) {
      return res.status(404).json({
        success: false,
        error: "SESSION_NOT_FOUND"
      });
    }

    res.json({
      success: true,
      connected: true,
      sessionId:
        session.sessionId,
      number:
        session.number ||
        connectedSession.number ||
        "",
      settingsLink:
        session.link || ""
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
   MULTI-SESSION
========================= */

app.post("/api/pairing", async (req, res) => {
  try {
    const cleanNumber =
      cleanNumberValue(req.body?.number);

    if (!cleanNumber) {
      return res.status(400).json({
        success: false,
        error: "NUMBER_REQUIRED",
        message:
          "WhatsApp number is required."
      });
    }

    if (cleanNumber.length < 8) {
      return res.status(400).json({
        success: false,
        error: "INVALID_NUMBER",
        message:
          "Invalid WhatsApp number."
      });
    }

    /*
     * Only reject this number if THIS number
     * already has a connected session.
     *
     * Other users can connect normally.
     */
    const existing =
      sessionManager.getSessionByNumber(
        cleanNumber
      );

    if (
      existing &&
      existing.connected
    ) {
      return res.status(409).json({
        success: false,
        error: "NUMBER_ALREADY_CONNECTED",
        message:
          "This WhatsApp number already has a connected session.",
        sessionId:
          existing.sessionId
      });
    }

    /*
     * Prevent simultaneous pairing
     * for the same number.
     */
    if (
      existing &&
      existing.pairing?.inProgress
    ) {
      return res.status(409).json({
        success: false,
        error: "PAIRING_IN_PROGRESS",
        message:
          "Pairing is already in progress for this number.",
        sessionId:
          existing.sessionId
      });
    }

    console.log(
      `📱 Pairing Code requested for: ${cleanNumber}`
    );

    const result =
      await connection.requestPairingCode(
        cleanNumber
      );

    /*
     * New multi-session connection.js
     * returns an object:
     * {
     *   sessionId,
     *   number,
     *   code
     * }
     */
    if (
      !result ||
      !result.code ||
      !result.sessionId
    ) {
      return res.status(500).json({
        success: false,
        error: "PAIRING_CODE_EMPTY",
        message:
          "Pairing Code could not be generated."
      });
    }

    console.log(
      `🔐 Pairing Code generated for ${cleanNumber} [${result.sessionId}]`
    );

    res.json({
      success: true,
      sessionId:
        result.sessionId,
      number:
        result.number ||
        cleanNumber,
      code:
        result.code
    });

  } catch (error) {
    console.error(
      "❌ Pairing Code error:",
      error
    );

    const message =
      error?.message ||
      "Unable to generate Pairing Code.";

    res.status(500).json({
      success: false,
      error: "PAIRING_FAILED",
      message
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
      const {
        sessionId
      } = req.params;

      const session =
        sessionManager.getSession(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "SESSION_NOT_FOUND"
        });
      }

      const panelSession =
        settingsPanel.getSession?.(
          sessionId
        );

      const panelUrl =
        process.env.SETTINGS_PANEL_URL ||
        process.env.PANEL_URL ||
        "https://topferos-md-v1-0-0.onrender.com";

      res.json({
        success: true,
        exists: true,
        sessionId,
        connected:
          !!session.connected,
        status:
          session.status ||
          "disconnected",
        authenticated:
          !!panelSession?.authenticated,
        number:
          session.number || "",
        settingsLink:
          `${panelUrl}/?session=${sessionId}`
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
        error:
          "SESSION_AND_CODE_REQUIRED"
      });
    }

    /*
     * Verify that the WhatsApp session
     * actually exists.
     */
    const waSession =
      sessionManager.getSession(
        sessionId
      );

    if (!waSession) {
      return res.status(404).json({
        success: false,
        error: "SESSION_NOT_FOUND"
      });
    }

    const result =
      settingsPanel.verifySession(
        sessionId,
        code
      );

    if (
      !result ||
      !result.success
    ) {
      return res.status(401).json(
        result || {
          success: false,
          error:
            "INVALID_SETTINGS_CODE"
        }
      );
    }

    res.json({
      success: true,
      message:
        "Settings Code verified",
      sessionId,
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
      error:
        "VERIFICATION_FAILED"
    });
  }
});

/* =========================
   GET SETTINGS
========================= */

app.get("/api/settings", (req, res) => {
  try {
    const sessionId =
      req.query?.sessionId;

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: "SESSION_REQUIRED"
      });
    }

    if (
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
        error:
          "SETTINGS_NOT_FOUND"
      });
    }

    res.json({
      success: true,
      sessionId,
      ...data
    });

  } catch (error) {
    console.error(
      "❌ Load settings error:",
      error
    );

    res.status(500).json({
      success: false,
      error:
        "LOAD_SETTINGS_FAILED"
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

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: "SESSION_REQUIRED"
      });
    }

    if (
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
      sessionId,
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
      error:
        "SAVE_SETTINGS_FAILED"
    });
  }
});

/* =========================
   LANGUAGE
========================= */

app.post("/api/language", (req, res) => {
  try {
    const {
      language
    } = req.body || {};

    const allowed = [
      "en",
      "fr",
      "es"
    ];

    if (
      !allowed.includes(language)
    ) {
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

    /*
     * This logs the USER out of the
     * settings panel only.
     *
     * It does NOT disconnect WhatsApp.
     */
    session.authenticated = false;

    res.json({
      success: true,
      sessionId,
      message:
        "Panel logged out successfully."
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
   DISCONNECT WHATSAPP SESSION
========================= */

app.post(
  "/api/session/:sessionId/disconnect",
  async (req, res) => {
    try {
      const {
        sessionId
      } = req.params;

      const session =
        sessionManager.getSession(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "SESSION_NOT_FOUND"
        });
      }

      await connection.stopSession(
        sessionId
      );

      res.json({
        success: true,
        sessionId,
        message:
          "WhatsApp session disconnected."
      });

    } catch (error) {
      console.error(
        "❌ Disconnect error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "DISCONNECT_FAILED"
      });
    }
  }
);

/* =========================
   DELETE WHATSAPP SESSION
========================= */

app.delete(
  "/api/session/:sessionId",
  async (req, res) => {
    try {
      const {
        sessionId
      } = req.params;

      const session =
        sessionManager.getSession(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "SESSION_NOT_FOUND"
        });
      }

      await connection.removeSession(
        sessionId
      );

      res.json({
        success: true,
        sessionId,
        message:
          "WhatsApp session removed."
      });

    } catch (error) {
      console.error(
        "❌ Remove session error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "REMOVE_SESSION_FAILED"
      });
    }
  }
);

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
   API 404
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
   START / RESTORE WHATSAPP
========================= */

async function startWhatsApp() {
  try {
    /*
     * IMPORTANT:
     *
     * Do NOT create an empty WhatsApp
     * session when the server starts.
     *
     * Restore sessions that already exist.
     * New users create sessions through
     * /api/pairing.
     */
    if (
      typeof connection.restoreStoredSessions ===
      "function"
    ) {
      await connection.restoreStoredSessions();
    }

    console.log(
      "🤖 TOPFEROS MD Multi-Session WhatsApp service started"
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

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;

  shuttingDown = true;

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

/* =========================
   NUMBER HELPER
========================= */

function cleanNumberValue(number) {
  return String(number || "")
    .replace(/\D/g, "");
}