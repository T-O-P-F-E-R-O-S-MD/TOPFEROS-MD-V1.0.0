"use strict";

const express =
  require("express");

const path =
  require("path");

const connection =
  require("../src/connection");

const sessionManager =
  require("../src/sessionManager");

const settingsPanel =
  require("../settings/panel");

const app =
  express();

const PORT =
  Number(
    process.env.PORT || 3000
  );

const HOST =
  process.env.HOST ||
  "0.0.0.0";

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

const publicDir =
  path.join(
    __dirname,
    "public"
  );

app.use(
  express.static(
    publicDir
  )
);

// ============================================================
// ASSETS
// ============================================================

const assetsDir =
  path.join(
    __dirname,
    "..",
    "assets"
  );

app.use(
  "/assets",
  express.static(
    assetsDir
  )
);

// ============================================================
// BACKGROUND
// ============================================================

app.get(
  "/background.png",
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        "background.png"
      )
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

function cleanNumberValue(
  number
) {
  return sessionManager.cleanPhoneNumber(
    number
  );
}

function getConnectionSession(
  sessionId
) {
  return sessionManager.getSession(
    sessionId
  );
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
          req.query.sessionId ||
          ""
        ).trim();

      if (sessionId) {
        const session =
          getConnectionSession(
            sessionId
          );

        if (!session) {
          return res.json({
            success: false,
            connected: false,
            error:
              "SESSION_NOT_FOUND"
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
          sessionManager.listPublicSessions()
      });

    } catch (error) {
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
    return res.json({
      success: true,

      sessions:
        sessionManager.listPublicSessions()
    });
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

      // ======================================================
      // PAIRING IN PROGRESS ONLY
      // ======================================================

      if (
        existing?.pairing
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

      // ======================================================
      // IMPORTANT
      //
      // Pa bloke nimewo ki deja konekte.
      // connection.js ap jere session ki deja egziste a.
      // ======================================================

      const result =
        await connection.requestPairingCode(
          number
        );

      return res.json({
        success: true,

        sessionId:
          result.sessionId,

        number:
          result.number,

        code:
          result.code
      });

    } catch (error) {
      console.error(
        "❌ PAIRING API ERROR:",
        error?.message || error
      );

      const status =
        error?.code ===
        "PAIRING_IN_PROGRESS"
          ? 409
          : 500;

      return res.status(
        status
      ).json({
        success: false,

        error:
          error?.code ||
          "PAIRING_ERROR",

        message:
          error?.message ||
          "Unable to generate pairing code."
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
          req.query.sessionId ||
          ""
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
        return res.json({
          success: false,

          session: null
        });
      }

      const connected =
        sessionManager.isConnected(
          sessionId
        );

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
            connected
              ? `${
                  settingsPanel.PANEL_URL ||
                  process.env.PANEL_URL ||
                  "https://topferos-md-v1-0-0.onrender.com"
                }/settings`
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
          session.pairing
      }
    });
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
          settingsPanel.getSettings(
            sessionId
          ),

        botInformation:
          settingsPanel.getBotInformation(
            sessionId
          )
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
          settingsPanel.getSettings(
            sessionId
          ),

        botInformation:
          settingsPanel.getBotInformation(
            sessionId
          )
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
        req.body?.settings ||
        {};

      const result =
        settingsPanel.updateSettings(
          sessionId,
          updates
        );

      return res.json({
        success: true,

        settings:
          result ||
          settingsPanel.getSettings(
            sessionId
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

      const result =
        await connection.stopSession(
          sessionId
        );

      return res.json({
        success:
          Boolean(result)
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

      const result =
        await connection.removeSession(
          sessionId
        );

      return res.json({
        success:
          Boolean(result)
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
    res.status(404).json({
      success: false,

      error:
        "API_ROUTE_NOT_FOUND"
    });
  }
);

// ============================================================
// START WHATSAPP
// ============================================================

async function startWhatsApp() {
  try {
    if (
      typeof connection.restoreStoredSessions ===
      "function"
    ) {
      await connection.restoreStoredSessions();
    }

    console.log(
      "✅ TOPFEROS MD WhatsApp service ready."
    );

  } catch (error) {
    console.error(
      "❌ START WHATSAPP ERROR:",
      error?.message || error
    );
  }
}

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

      startWhatsApp();
    }
  );

// ============================================================
// SHUTDOWN
// ============================================================

async function shutdown(
  signal
) {
  console.log(
    `🛑 ${signal} received.`
  );

  try {
    await connection.stop();
  } catch {}

  server.close(
    () => {
      process.exit(0);
    }
  );
}

process.once(
  "SIGTERM",
  () =>
    shutdown(
      "SIGTERM"
    )
);

process.once(
  "SIGINT",
  () =>
    shutdown(
      "SIGINT"
    )
);

module.exports = {
  app,

  server
};