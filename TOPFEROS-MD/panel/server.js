"use strict";

const express = require("express");
const path = require("path");

const connection = require("../src/connection");
const sessionManager = require("../src/sessionManager");
const settingsPanel = require("../settings/panel");

const app = express();

const PORT = Number(
  process.env.PORT || 3000
);

const HOST =
  process.env.HOST || "0.0.0.0";

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);

// ============================================================
// STATIC
// ============================================================

const publicDir = path.join(
  __dirname,
  "public"
);

app.use(
  express.static(publicDir)
);

// ============================================================
// ASSETS
// ============================================================

const assetsDir = path.join(
  __dirname,
  "..",
  "assets"
);

app.use(
  "/assets",
  express.static(assetsDir)
);

// ============================================================
// BACKGROUND
// ============================================================

app.get(
  "/background.png",
  (req, res) => {
    const backgroundPath = path.join(
      __dirname,
      "background.png"
    );

    res.sendFile(
      backgroundPath,
      error => {
        if (error && !res.headersSent) {
          res.status(404).json({
            success: false,
            error: "BACKGROUND_NOT_FOUND"
          });
        }
      }
    );
  }
);

// ============================================================
// HOME
// ============================================================

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

// ============================================================
// HELPERS
// ============================================================

function cleanNumberValue(number) {
  return String(
    number || ""
  ).replace(
    /\D/g,
    ""
  );
}

function getConnectionSession(
  sessionId
) {
  return sessionManager.getSession(
    sessionId
  );
}

function getPublicSessions() {
  if (
    typeof sessionManager.getPublicSessions ===
    "function"
  ) {
    return sessionManager.getPublicSessions();
  }

  if (
    typeof sessionManager.listPublicSessions ===
    "function"
  ) {
    return sessionManager.listPublicSessions();
  }

  return [];
}

// ============================================================
// STATUS
// ============================================================

app.get(
  "/api/status",
  (req, res) => {
    try {
      const sessionId =
        String(
          req.query.sessionId || ""
        ).trim();

      if (sessionId) {
        const session =
          getConnectionSession(
            sessionId
          );

        if (!session) {
          return res.status(404).json({
            success: false,
            connected: false,
            error: "SESSION_NOT_FOUND"
          });
        }

        return res.json({
          success: true,

          connected:
            sessionManager.isConnected(
              sessionId
            ),

          sessionId,

          number:
            session.number,

          status:
            session.status
        });
      }

      return res.json({
        success: true,
        sessions:
          getPublicSessions()
      });

    } catch (error) {
      console.error(
        "❌ STATUS API ERROR:",
        error?.message || error
      );

      return res.status(500).json({
        success: false,
        error:
          error?.message ||
          "STATUS_ERROR"
      });
    }
  }
);

// ============================================================
// SESSIONS
// ============================================================

app.get(
  "/api/sessions",
  (req, res) => {
    try {
      return res.json({
        success: true,
        sessions:
          getPublicSessions()
      });

    } catch (error) {
      console.error(
        "❌ SESSIONS API ERROR:",
        error?.message || error
      );

      return res.status(500).json({
        success: false,
        error:
          error?.message ||
          "SESSIONS_ERROR"
      });
    }
  }
);

// ============================================================
// PAIRING
// ============================================================

app.post(
  "/api/pairing",
  async (req, res) => {
    try {
      const number =
        cleanNumberValue(
          req.body?.number
        );

      if (
        !/^\d{8,15}$/.test(
          number
        )
      ) {
        return res.status(400).json({
          success: false,

          error:
            "INVALID_PHONE_NUMBER",

          message:
            "Mete yon nimewo WhatsApp valab ak kòd peyi a."
        });
      }

      const existing =
        sessionManager.getSessionByNumber(
          number
        );

      if (
        existing?.pairing &&
        existing?.pairingCode
      ) {
        return res.json({
          success: true,

          sessionId:
            existing.sessionId,

          number,

          code:
            existing.pairingCode,

          status:
            existing.status
        });
      }

      if (
        existing?.pairing &&
        !existing?.pairingCode
      ) {
        return res.status(409).json({
          success: false,

          error:
            "PAIRING_IN_PROGRESS",

          message:
            "Pairing code request already in progress.",

          sessionId:
            existing.sessionId
        });
      }

      const result =
        await connection.requestPairingCode(
          number
        );

      if (
        !result ||
        !result.sessionId
      ) {
        return res.status(500).json({
          success: false,

          error:
            "PAIRING_SESSION_NOT_CREATED",

          message:
            "Pa kapab kreye WhatsApp session lan."
        });
      }

      if (
        result.status === "connected"
      ) {
        return res.json({
          success: true,

          sessionId:
            result.sessionId,

          number:
            result.number ||
            number,

          code:
            null,

          status:
            "connected",

          message:
            "WhatsApp session lan deja konekte."
        });
      }

      if (!result.code) {
        return res.status(500).json({
          success: false,

          error:
            "PAIRING_CODE_NOT_GENERATED",

          message:
            "Pa kapab jenere kòd koneksyon an."
        });
      }

      return res.json({
        success: true,

        sessionId:
          result.sessionId,

        number:
          result.number ||
          number,

        code:
          result.code,

        status:
          result.status ||
          "pairing"
      });

    } catch (error) {
      console.error(
        "❌ PAIRING API ERROR:",
        error?.message || error
      );

      const message =
        error?.message ||
        "Unable to generate pairing code.";

      return res.status(500).json({
        success: false,

        error:
          error?.code ||
          "PAIRING_ERROR",

        message
      });
    }
  }
);

// ============================================================
// CURRENT SESSION
// ============================================================

app.get(
  "/api/current-session",
  (req, res) => {
    try {
      const sessionId =
        String(
          req.query.sessionId || ""
        ).trim();

      if (!sessionId) {
        return res.json({
          success: true,
          session: null
        });
      }

      const session =
        sessionManager.getSession(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          session: null,
          error:
            "SESSION_NOT_FOUND"
        });
      }

      const connected =
        sessionManager.isConnected(
          sessionId
        );

      const panelUrl =
        settingsPanel.PANEL_URL ||
        process.env.PANEL_URL ||
        "";

      return res.json({
        success: true,

        session: {
          sessionId,

          number:
            session.number,

          connected,

          status:
            session.status,

          socket:
            Boolean(
              session.socket
            ),

          settingsLink:
            connected && panelUrl
              ? `${panelUrl}/settings`
              : null
        }
      });

    } catch (error) {
      return res.status(500).json({
        success: false,

        error:
          error?.message ||
          "CURRENT_SESSION_ERROR"
      });
    }
  }
);

// ============================================================
// SESSION INFO
// ============================================================

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
          error:
            "SESSION_NOT_FOUND"
        });
      }

      return res.json({
        success: true,

        session: {
          sessionId,

          number:
            session.number,

          status:
            session.status,

          connected:
            sessionManager.isConnected(
              sessionId
            ),

          pairing:
            Boolean(
              session.pairing
            )
        }
      });

    } catch (error) {
      return res.status(500).json({
        success: false,

        error:
          error?.message ||
          "SESSION_INFO_ERROR"
      });
    }
  }
);

// ============================================================
// VERIFY SETTINGS CODE
// ============================================================

app.post(
  "/api/verify",
  (req, res) => {
    try {
      const sessionId =
        String(
          req.body?.sessionId ||
          ""
        ).trim();

      const code =
        String(
          req.body?.code ||
          ""
        ).trim();

      if (
        !sessionId ||
        !code
      ) {
        return res.status(400).json({
          success: false,

          error:
            "SESSION_AND_CODE_REQUIRED"
        });
      }

      if (
        !sessionManager.isConnected(
          sessionId
        )
      ) {
        return res.status(409).json({
          success: false,

          error:
            "WHATSAPP_NOT_CONNECTED",

          message:
            "WhatsApp session lan pa konekte."
        });
      }

      if (
        !settingsPanel ||
        typeof settingsPanel.verifySession !==
          "function"
      ) {
        return res.status(500).json({
          success: false,

          error:
            "SETTINGS_PANEL_UNAVAILABLE"
        });
      }

      const result =
        settingsPanel.verifySession(
          sessionId,
          code
        );

      if (
        !result ||
        result.success !== true
      ) {
        return res.status(401).json({
          success: false,

          error:
            "INVALID_SETTINGS_CODE"
        });
      }

      return res.json({
        success: true,

        session:
          result.session,

        settings:
          typeof settingsPanel.getSettings ===
          "function"
            ? settingsPanel.getSettings(
                sessionId
              )
            : {},

        botInformation:
          typeof settingsPanel.getBotInformation ===
          "function"
            ? settingsPanel.getBotInformation(
                sessionId
              )
            : {}
      });

    } catch (error) {
      return res.status(500).json({
        success: false,

        error:
          error?.message ||
          "VERIFY_ERROR"
      });
    }
  }
);

// ============================================================
// SETTINGS GET
// ============================================================

app.get(
  "/api/settings",
  (req, res) => {
    try {
      const sessionId =
        String(
          req.query.sessionId ||
          ""
        ).trim();

      if (!sessionId) {
        return res.status(400).json({
          success: false,

          error:
            "SESSION_ID_REQUIRED"
        });
      }

      if (
        typeof settingsPanel.isAuthenticated !==
        "function" ||
        !settingsPanel.isAuthenticated(
          sessionId
        )
      ) {
        return res.status(401).json({
          success: false,

          error:
            "NOT_AUTHENTICATED"
        });
      }

      return res.json({
        success: true,

        settings:
          typeof settingsPanel.getSettings ===
          "function"
            ? settingsPanel.getSettings(
                sessionId
              )
            : {},

        botInformation:
          typeof settingsPanel.getBotInformation ===
          "function"
            ? settingsPanel.getBotInformation(
                sessionId
              )
            : {}
      });

    } catch (error) {
      return res.status(500).json({
        success: false,

        error:
          error?.message ||
          "SETTINGS_ERROR"
      });
    }
  }
);

// ============================================================
// SETTINGS POST
// ============================================================

app.post(
  "/api/settings",
  (req, res) => {
    try {
      const sessionId =
        String(
          req.body?.sessionId ||
          ""
        ).trim();

      if (!sessionId) {
        return res.status(400).json({
          success: false,

          error:
            "SESSION_ID_REQUIRED"
        });
      }

      if (
        typeof settingsPanel.isAuthenticated !==
        "function" ||
        !settingsPanel.isAuthenticated(
          sessionId
        )
      ) {
        return res.status(401).json({
          success: false,

          error:
            "NOT_AUTHENTICATED"
        });
      }

      const updates =
        req.body?.settings || {};

      if (
        !settingsPanel ||
        typeof settingsPanel.updateSettings !==
          "function"
      ) {
        return res.status(500).json({
          success: false,

          error:
            "SETTINGS_UPDATE_UNAVAILABLE"
        });
      }

      const result =
        settingsPanel.updateSettings(
          sessionId,
          updates
        );

      return res.json({
        success: true,

        settings:
          result ||
          (
            typeof settingsPanel.getSettings ===
            "function"
              ? settingsPanel.getSettings(
                  sessionId
                )
              : {}
          )
      });

    } catch (error) {
      return res.status(500).json({
        success: false,

        error:
          error?.message ||
          "SETTINGS_UPDATE_ERROR"
      });
    }
  }
);

// ============================================================
// LANGUAGE
// ============================================================

app.post(
  "/api/language",
  (req, res) => {
    try {
      const language =
        String(
          req.body?.language ||
          ""
        ).toLowerCase();

      const allowed = [
        "en",
        "fr",
        "es",
        "ht"
      ];

      if (
        !allowed.includes(
          language
        )
      ) {
        return res.status(400).json({
          success: false,

          error:
            "INVALID_LANGUAGE"
        });
      }

      return res.json({
        success: true,

        language
      });

    } catch (error) {
      return res.status(500).json({
        success: false,

        error:
          "LANGUAGE_ERROR"
      });
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

          error:
            "SESSION_NOT_FOUND"
        });
      }

      const result =
        await connection.stopSession(
          sessionId
        );

      return res.json({
        success:
          Boolean(result),

        sessionId
      });

    } catch (error) {
      return res.status(500).json({
        success: false,

        error:
          error?.message ||
          "DISCONNECT_ERROR"
      });
    }
  }
);

// ============================================================
// DELETE SESSION
// ============================================================

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

          error:
            "SESSION_NOT_FOUND"
        });
      }

      const result =
        await connection.removeSession(
          sessionId
        );

      return res.json({
        success:
          Boolean(result),

        sessionId
      });

    } catch (error) {
      return res.status(500).json({
        success: false,

        error:
          error?.message ||
          "REMOVE_SESSION_ERROR"
      });
    }
  }
);

// ============================================================
// API 404
// ============================================================

app.use(
  "/api",
  (req, res) => {
    return res.status(404).json({
      success: false,

      error:
        "API_ROUTE_NOT_FOUND"
    });
  }
);

// ============================================================
// SERVER
// ============================================================

const server =
  app.listen(
    PORT,
    HOST,
    () => {
      console.log(
        `🚀 TOPFEROS MD PANEL running on ${HOST}:${PORT}`
      );
    }
  );

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
  (err, req, res, next) => {
    console.error(
      "❌ EXPRESS ERROR:",
      err?.message || err
    );

    if (res.headersSent) {
      return next(err);
    }

    return res.status(500).json({
      success: false,

      error:
        err?.message ||
        "INTERNAL_SERVER_ERROR"
    });
  }
);

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  app,
  server
};