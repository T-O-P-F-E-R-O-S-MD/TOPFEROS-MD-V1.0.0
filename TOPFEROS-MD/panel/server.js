"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");

const connection = require("../src/connection");
const sessionManager = require("../src/sessionManager");
const language = require("../src/language");

/*
|--------------------------------------------------------------------------
| SETTINGS PANEL BACKEND
|--------------------------------------------------------------------------
*/

const SETTING_PANEL_FILE = path.join(
  __dirname,
  "..",
  "src",
  "settingPanel.js"
);

console.log(
  "[TOPFEROS] settingPanel path:",
  SETTING_PANEL_FILE
);

console.log(
  "[TOPFEROS] settingPanel exists:",
  fs.existsSync(SETTING_PANEL_FILE)
);

let settingsPanel = null;

try {
  settingsPanel = require("../src/settingPanel");

  console.log(
    "[TOPFEROS] ✅ settingPanel.js chaje avèk siksè."
  );
} catch (error) {
  console.error(
    "[TOPFEROS] ❌ settingPanel.js pa disponib:",
    error?.stack ||
      error?.message ||
      error
  );
}

const app = express();

/*
|--------------------------------------------------------------------------
| SERVER
|--------------------------------------------------------------------------
*/

const PORT =
  Number(process.env.PORT) || 3000;

const HOST =
  process.env.HOST || "0.0.0.0";

/*
|--------------------------------------------------------------------------
| PATHS
|--------------------------------------------------------------------------
*/

const PUBLIC_DIR =
  path.join(
    __dirname,
    "public"
  );

const BACKGROUND_FILE =
  path.join(
    __dirname,
    "background.png"
  );

const ASSETS_DIR =
  path.join(
    __dirname,
    "..",
    "assets"
  );

/*
|--------------------------------------------------------------------------
| MIDDLEWARE
|--------------------------------------------------------------------------
*/

app.disable("x-powered-by");

app.use(
  express.json({
    limit: "2mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb"
  })
);

/*
|--------------------------------------------------------------------------
| STATIC FILES
|--------------------------------------------------------------------------
*/

app.use(
  express.static(
    PUBLIC_DIR
  )
);

app.use(
  "/assets",
  express.static(
    ASSETS_DIR
  )
);

/*
|--------------------------------------------------------------------------
| BACKGROUND
|--------------------------------------------------------------------------
*/

app.get(
  "/background.png",
  (req, res) => {
    if (
      !fs.existsSync(
        BACKGROUND_FILE
      )
    ) {
      return res.status(404).end();
    }

    return res.sendFile(
      BACKGROUND_FILE
    );
  }
);

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanNumberValue(value) {
  return String(
    value || ""
  ).replace(
    /\D/g,
    ""
  );
}

function isValidPhoneNumber(number) {
  return /^\d{8,15}$/.test(
    number
  );
}

function makeSessionId(number) {
  return `session_${cleanNumberValue(
    number
  )}`;
}

function getConnectionSession(
  sessionId
) {
  if (!sessionId) {
    return null;
  }

  try {
    if (
      typeof sessionManager.getSession !==
      "function"
    ) {
      return null;
    }

    return sessionManager.getSession(
      sessionId
    );
  } catch (error) {
    console.error(
      "[TOPFEROS] getSession:",
      error?.message || error
    );

    return null;
  }
}

function getPublicSessions() {
  try {
    if (
      typeof sessionManager.getPublicSessions ===
      "function"
    ) {
      return (
        sessionManager.getPublicSessions() ||
        []
      );
    }

    return [];
  } catch (error) {
    console.error(
      "[TOPFEROS] getPublicSessions:",
      error?.message || error
    );

    return [];
  }
}

function publicSession(
  session
) {
  if (!session) {
    return null;
  }

  try {
    if (
      typeof sessionManager.publicSession ===
      "function"
    ) {
      return sessionManager.publicSession(
        session
      );
    }
  } catch (error) {
    console.error(
      "[TOPFEROS] publicSession:",
      error?.message || error
    );
  }

  return session;
}

function getSessionIdFromRequest(
  req
) {
  return (
    req.query?.sessionId ||
    req.query?.session ||
    req.body?.sessionId ||
    req.body?.session ||
    null
  );
}

function isSessionConnected(
  session
) {
  return Boolean(
    session &&
      session.connected === true
  );
}

function requireSession(
  req,
  res
) {
  const sessionId =
    getSessionIdFromRequest(
      req
    );

  if (!sessionId) {
    res.status(400).json({
      success: false,
      error:
        "sessionId obligatwa."
    });

    return null;
  }

  const session =
    getConnectionSession(
      sessionId
    );

  if (!session) {
    res.status(404).json({
      success: false,
      error:
        "Session introuvable."
    });

    return null;
  }

  return {
    sessionId,
    session
  };
}

/*
|--------------------------------------------------------------------------
| HOME
|--------------------------------------------------------------------------
*/

app.get(
  "/",
  (req, res) => {
    return res.sendFile(
      path.join(
        PUBLIC_DIR,
        "index.html"
      )
    );
  }
);

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get(
  "/health",
  (req, res) => {
    return res.json({
      success: true,
      service:
        "TOPFEROS MD SETTINGS PANEL",
      status: "online",
      port: PORT,
      host: HOST,
      settingPanel:
        Boolean(settingsPanel),
      settingPanelFile:
        fs.existsSync(
          SETTING_PANEL_FILE
        )
    });
  }
);

/*
|--------------------------------------------------------------------------
| API STATUS
|--------------------------------------------------------------------------
*/

app.get(
  "/api/status",
  (req, res) => {
    try {
      const sessions =
        getPublicSessions();

      const connected =
        sessions.filter(
          session =>
            session.connected === true
        );

      const pairing =
        sessions.filter(
          session =>
            session.pairing === true
        );

      return res.json({
        success: true,
        status: "online",

        settingPanel:
          Boolean(settingsPanel),

        settingPanelFile:
          fs.existsSync(
            SETTING_PANEL_FILE
          ),

        totalSessions:
          sessions.length,

        connectedSessions:
          connected.length,

        pairingSessions:
          pairing.length,

        sessions
      });
    } catch (error) {
      console.error(
        "[TOPFEROS] /api/status:",
        error?.stack ||
          error?.message ||
          error
      );

      return res.status(500).json({
        success: false,
        error:
          "Impossible de récupérer le statut."
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| API SESSIONS
|--------------------------------------------------------------------------
*/

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
        "[TOPFEROS] /api/sessions:",
        error?.message || error
      );

      return res.status(500).json({
        success: false,
        error:
          "Impossible de récupérer les sessions."
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| PAIRING CODE
|--------------------------------------------------------------------------
*/

app.post(
  "/api/pairing",
  async (req, res) => {
    try {
      const rawNumber =
        req.body?.number ||
        req.body?.phoneNumber ||
        req.body?.phone ||
        "";

      const number =
        cleanNumberValue(
          rawNumber
        );

      if (
        !isValidPhoneNumber(
          number
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Numéro invalide. Utilisez le code pays + numéro, sans +, espaces ou tirets."
        });
      }

      const sessionId =
        cleanNumberValue(
          req.body?.sessionId
        ) ||
        makeSessionId(
          number
        );

      let session =
        getConnectionSession(
          sessionId
        );

      if (
        session &&
        session.connected === true
      ) {
        return res.status(409).json({
          success: false,
          error:
            "Ce numéro est déjà connecté.",
          sessionId
        });
      }

      if (
        session &&
        session.pairing === true &&
        typeof sessionManager.updateSession ===
          "function"
      ) {
        await sessionManager.updateSession(
          sessionId,
          {
            status:
              "disconnected",

            connected:
              false,

            pairing:
              false,

            pairingCode:
              null,

            pairingStartedAt:
              null,

            number
          }
        );
      }

      console.log(
        `[TOPFEROS] Demande pairing code: ${number}`
      );

      if (
        !connection ||
        typeof connection.requestPairingCode !==
          "function"
      ) {
        return res.status(500).json({
          success: false,
          error:
            "requestPairingCode() pa disponib nan connection.js."
        });
      }

      const result =
        await connection.requestPairingCode(
          sessionId,
          number
        );

      return res.json({
        success: true,

        sessionId:
          result?.sessionId ||
          sessionId,

        number:
          result?.number ||
          number,

        code:
          result?.code || null,

        pairingCode:
          result?.code || null,

        message:
          "Pairing code généré avec succès."
      });
    } catch (error) {
      console.error(
        "[TOPFEROS] /api/pairing:",
        error?.stack ||
          error?.message ||
          error
      );

      return res.status(500).json({
        success: false,
        error:
          error?.message ||
          "Impossible de générer le pairing code."
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CURRENT SESSION
|--------------------------------------------------------------------------
*/

app.get(
  "/api/current-session",
  (req, res) => {
    try {
      const sessionId =
        req.query?.session ||
        req.query?.sessionId;

      if (!sessionId) {
        return res.json({
          success: true,
          session: null
        });
      }

      const session =
        getConnectionSession(
          sessionId
        );

      if (!session) {
        return res.json({
          success: true,
          session: null
        });
      }

      return res.json({
        success: true,
        session:
          publicSession(
            session
          )
      });
    } catch (error) {
      console.error(
        "[TOPFEROS] /api/current-session:",
        error?.message || error
      );

      return res.status(500).json({
        success: false,
        error:
          "Impossible de récupérer la session."
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| SINGLE SESSION
|--------------------------------------------------------------------------
*/

app.get(
  "/api/session/:sessionId",
  (req, res) => {
    try {
      const {
        sessionId
      } = req.params;

      const session =
        getConnectionSession(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          error:
            "Session introuvable."
        });
      }

      return res.json({
        success: true,
        session:
          publicSession(
            session
          )
      });
    } catch (error) {
      console.error(
        "[TOPFEROS] /api/session:",
        error?.message || error
      );

      return res.status(500).json({
        success: false,
        error:
          "Impossible de récupérer la session."
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| VERIFY PANEL SESSION
|--------------------------------------------------------------------------
*/

app.post(
  "/api/verify",
  async (req, res) => {
    try {
      const sessionId =
        req.body?.sessionId ||
        req.body?.session;

      const code =
        req.body?.code ||
        req.body?.panelCode ||
        "";

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          verified: false,
          error:
            "sessionId obligatwa."
        });
      }

      const session =
        getConnectionSession(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          verified: false,
          error:
            "Session introuvable."
        });
      }

      /*
       * Bot la dwe konekte.
       */
      if (
        !isSessionConnected(
          session
        )
      ) {
        return res.status(403).json({
          success: false,
          verified: false,
          authenticated: false,
          connected: false,
          error:
            "Bot la pa konekte."
        });
      }

      if (!settingsPanel) {
        return res.status(503).json({
          success: false,
          verified: false,
          authenticated: false,
          error:
            "settingPanel.js pa disponib."
        });
      }

      /*
       * Verifye code panel la.
       */
      let authenticated = false;

      if (
        typeof settingsPanel.verifySession ===
        "function"
      ) {
        authenticated =
          Boolean(
            await settingsPanel.verifySession(
              sessionId,
              code
            )
          );
      }

      if (!authenticated) {
        return res.status(401).json({
          success: false,
          verified: false,
          authenticated: false,
          connected: true,
          error:
            "Code panel la pa valide."
        });
      }

      return res.json({
        success: true,
        verified: true,
        authenticated: true,
        connected: true,
        sessionId,
        session:
          publicSession(
            session
          )
      });
    } catch (error) {
      console.error(
        "[TOPFEROS] /api/verify:",
        error?.stack ||
          error?.message ||
          error
      );

      return res.status(500).json({
        success: false,
        verified: false,
        error:
          "Erreur de vérification."
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET SETTINGS
|--------------------------------------------------------------------------
*/

app.get(
  "/api/settings",
  async (req, res) => {
    try {
      const sessionData =
        requireSession(
          req,
          res
        );

      if (!sessionData) {
        return;
      }

      const {
        sessionId,
        session
      } = sessionData;

      if (
        !isSessionConnected(
          session
        )
      ) {
        return res.status(403).json({
          success: false,
          error:
            "Bot la pa konekte. Settings yo pa disponib."
        });
      }

      if (
        !settingsPanel ||
        typeof settingsPanel.getSettings !==
          "function"
      ) {
        return res.status(503).json({
          success: false,
          error:
            "settingPanel.js pa disponib."
        });
      }

      const settings =
        await settingsPanel.getSettings(
          sessionId
        );

      let botInformation = {};

      if (
        typeof settingsPanel.getBotInformation ===
          "function"
      ) {
        botInformation =
          await settingsPanel.getBotInformation(
            sessionId
          );
      }

      return res.json({
        success: true,
        sessionId,

        settings:
          settings || {},

        botInformation:
          botInformation || {}
      });
    } catch (error) {
      console.error(
        "[TOPFEROS] GET settings:",
        error?.stack ||
          error?.message ||
          error
      );

      return res.status(500).json({
        success: false,
        error:
          "Impossible de récupérer les paramètres."
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| SAVE SETTINGS
|--------------------------------------------------------------------------
*/

app.post(
  "/api/settings",
  async (req, res) => {
    try {
      const sessionId =
        req.body?.sessionId ||
        req.body?.session;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error:
            "sessionId obligatwa."
        });
      }

      const session =
        getConnectionSession(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          error:
            "Session introuvable."
        });
      }

      if (
        !isSessionConnected(
          session
        )
      ) {
        return res.status(403).json({
          success: false,
          error:
            "Bot la pa konekte."
        });
      }

      if (
        !settingsPanel ||
        typeof settingsPanel.applySettings !==
          "function"
      ) {
        return res.status(503).json({
          success: false,
          error:
            "applySettings() pa disponib nan settingPanel.js."
        });
      }

      const updatedData = {
        ...(req.body || {})
      };

      delete updatedData.sessionId;
      delete updatedData.session;

      const settings =
        await settingsPanel.applySettings(
          sessionId,
          updatedData
        );

      return res.json({
        success: true,
        sessionId,

        settings:
          settings || {}
      });
    } catch (error) {
      console.error(
        "[TOPFEROS] POST settings:",
        error?.stack ||
          error?.message ||
          error
      );

      return res.status(500).json({
        success: false,
        error:
          error?.message ||
          "Impossible de sauvegarder les paramètres."
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| BOT INFORMATION
|--------------------------------------------------------------------------
*/

app.get(
  "/api/bot-information",
  async (req, res) => {
    try {
      const sessionData =
        requireSession(
          req,
          res
        );

      if (!sessionData) {
        return;
      }

      const {
        sessionId,
        session
      } = sessionData;

      if (
        !isSessionConnected(
          session
        )
      ) {
        return res.status(403).json({
          success: false,
          error:
            "Bot la pa konekte."
        });
      }

      if (
        !settingsPanel ||
        typeof settingsPanel.getBotInformation !==
          "function"
      ) {
        return res.status(503).json({
          success: false,
          error:
            "getBotInformation() pa disponib."
        });
      }

      const botInformation =
        await settingsPanel.getBotInformation(
          sessionId
        );

      return res.json({
        success: true,
        sessionId,

        botInformation:
          botInformation || {}
      });
    } catch (error) {
      console.error(
        "[TOPFEROS] bot-information:",
        error?.message || error
      );

      return res.status(500).json({
        success: false,
        error:
          "Impossible de récupérer les informations du bot."
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE BOT INFORMATION
|--------------------------------------------------------------------------
*/

app.post(
  "/api/bot-information",
  async (req, res) => {
    try {
      const sessionId =
        req.body?.sessionId ||
        req.body?.session;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error:
            "sessionId obligatwa."
        });
      }

      const session =
        getConnectionSession(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          error:
            "Session introuvable."
        });
      }

      if (
        !isSessionConnected(
          session
        )
      ) {
        return res.status(403).json({
          success: false,
          error:
            "Bot la pa konekte."
        });
      }

      if (
        !settingsPanel ||
        typeof settingsPanel.updateBotInformation !==
          "function"
      ) {
        return res.status(503).json({
          success: false,
          error:
            "updateBotInformation() pa disponib."
        });
      }

      const data = {
        ...(req.body || {})
      };

      delete data.sessionId;
      delete data.session;

      const botInformation =
        await settingsPanel.updateBotInformation(
          sessionId,
          data
        );

      return res.json({
        success: true,
        sessionId,

        botInformation:
          botInformation || {}
      });
    } catch (error) {
      console.error(
        "[TOPFEROS] update bot information:",
        error?.message || error
      );

      return res.status(500).json({
        success: false,
        error:
          error?.message ||
          "Impossible de modifier les informations du bot."
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| LANGUAGES
|--------------------------------------------------------------------------
*/

app.get(
  "/api/languages",
  (req, res) => {
    try {
      return res.json({
        success: true,

        languages:
          language.getLanguages()
      });
    } catch (error) {
      console.error(
        "[TOPFEROS] languages:",
        error?.message || error
      );

      return res.status(500).json({
        success: false,
        error:
          "Impossible de récupérer les langues."
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| LANGUAGE PACK
|--------------------------------------------------------------------------
*/

app.get(
  "/api/language",
  (req, res) => {
    try {
      const selectedLanguage =
        req.query?.language ||
        req.query?.lang ||
        language.DEFAULT_LANGUAGE;

      const normalized =
        language.normalizeLanguage(
          selectedLanguage
        );

      return res.json({
        success: true,

        language:
          normalized,

        info:
          language.getLanguageInfo(
            normalized
          ),

        translations:
          language.getLanguagePack(
            normalized
          )
      });
    } catch (error) {
      console.error(
        "[TOPFEROS] GET language:",
        error?.message || error
      );

      return res.status(500).json({
        success: false,
        error:
          "Impossible de récupérer la langue."
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CHANGE LANGUAGE
|--------------------------------------------------------------------------
*/

app.post(
  "/api/language",
  async (req, res) => {
    try {
      const sessionId =
        req.body?.sessionId ||
        req.body?.session;

      const requestedLanguage =
        req.body?.language ||
        req.body?.lang;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error:
            "sessionId obligatwa."
        });
      }

      if (!requestedLanguage) {
        return res.status(400).json({
          success: false,
          error:
            "language obligatwa."
        });
      }

      if (
        !language.isSupportedLanguage(
          requestedLanguage
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Langue non supportée."
        });
      }

      const normalized =
        language.normalizeLanguage(
          requestedLanguage
        );

      const session =
        getConnectionSession(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          error:
            "Session introuvable."
        });
      }

      if (
        !isSessionConnected(
          session
        )
      ) {
        return res.status(403).json({
          success: false,
          error:
            "Bot la pa konekte."
        });
      }

      if (
        settingsPanel &&
        typeof settingsPanel.setLanguage ===
          "function"
      ) {
        await settingsPanel.setLanguage(
          sessionId,
          normalized
        );
      }

      return res.json({
        success: true,
        sessionId,

        language:
          normalized,

        info:
          language.getLanguageInfo(
            normalized
          ),

        translations:
          language.getLanguagePack(
            normalized
          )
      });
    } catch (error) {
      console.error(
        "[TOPFEROS] POST language:",
        error?.stack ||
          error?.message ||
          error
      );

      return res.status(500).json({
        success: false,
        error:
          error?.message ||
          "Impossible de changer la langue."
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| DISCONNECT SESSION
|--------------------------------------------------------------------------
*/

app.post(
  "/api/session/:sessionId/disconnect",
  async (req, res) => {
    try {
      const {
        sessionId
      } = req.params;

      const session =
        getConnectionSession(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          error:
            "Session introuvable."
        });
      }

      /*
       * Invalid panel session/code anvan disconnect.
       */
      if (
        settingsPanel &&
        typeof settingsPanel.setBotDisconnected ===
          "function"
      ) {
        await settingsPanel.setBotDisconnected(
          sessionId
        );
      }

      if (
        !connection ||
        typeof connection.stopSession !==
          "function"
      ) {
        return res.status(500).json({
          success: false,
          error:
            "stopSession() pa disponib nan connection.js."
        });
      }

      await connection.stopSession(
        sessionId
      );

      return res.json({
        success: true,
        message:
          "Session déconnectée.",
        sessionId
      });
    } catch (error) {
      console.error(
        "[TOPFEROS] disconnect:",
        error?.stack ||
          error?.message ||
          error
      );

      return res.status(500).json({
        success: false,
        error:
          error?.message ||
          "Impossible de déconnecter la session."
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE SESSION
|--------------------------------------------------------------------------
*/

app.delete(
  "/api/session/:sessionId",
  async (req, res) => {
    try {
      const {
        sessionId
      } = req.params;

      const session =
        getConnectionSession(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          error:
            "Session introuvable."
        });
      }

      if (
        settingsPanel &&
        typeof settingsPanel.removeSession ===
          "function"
      ) {
        await settingsPanel.removeSession(
          sessionId
        );
      }

      if (
        !connection ||
        typeof connection.removeSession !==
          "function"
      ) {
        return res.status(500).json({
          success: false,
          error:
            "removeSession() pa disponib nan connection.js."
        });
      }

      await connection.removeSession(
        sessionId
      );

      return res.json({
        success: true,
        message:
          "Session supprimée.",
        sessionId
      });
    } catch (error) {
      console.error(
        "[TOPFEROS] delete session:",
        error?.stack ||
          error?.message ||
          error
      );

      return res.status(500).json({
        success: false,
        error:
          error?.message ||
          "Impossible de supprimer la session."
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| API 404
|--------------------------------------------------------------------------
*/

app.use(
  "/api",
  (req, res) => {
    return res.status(404).json({
      success: false,
      error:
        "API route introuvable."
    });
  }
);

/*
|--------------------------------------------------------------------------
| EXPRESS ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "[TOPFEROS] Express error:",
      error?.stack ||
        error?.message ||
        error
    );

    if (
      res.headersSent
    ) {
      return next(error);
    }

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Erreur interne du serveur."
    });
  }
);

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

const server =
  app.listen(
    PORT,
    HOST,
    () => {
      console.log(
        "=================================================="
      );

      console.log(
        "[TOPFEROS MD] SETTINGS PANEL ONLINE"
      );

      console.log(
        `[TOPFEROS] HOST: ${HOST}`
      );

      console.log(
        `[TOPFEROS] PORT: ${PORT}`
      );

      console.log(
        `[TOPFEROS] PUBLIC DIR: ${PUBLIC_DIR}`
      );

      console.log(
        `[TOPFEROS] settingPanel file: ${SETTING_PANEL_FILE}`
      );

      console.log(
        `[TOPFEROS] settingPanel exists: ${fs.existsSync(
          SETTING_PANEL_FILE
        )}`
      );

      console.log(
        `[TOPFEROS] settingPanel loaded: ${Boolean(
          settingsPanel
        )}`
      );

      console.log(
        "=================================================="
      );
    }
  );

server.on(
  "error",
  error => {
    console.error(
      "[TOPFEROS] ❌ Panel server error:",
      error?.stack ||
        error?.message ||
        error
    );
  }
);

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  app,
  server
};