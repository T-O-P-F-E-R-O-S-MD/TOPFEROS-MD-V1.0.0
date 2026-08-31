"use strict";

const express = require("express");
const path = require("path");

const settingsPanel = require("../settings/panel");
const settingsApi = require("./settings-api");

const app = express();

const PORT =
  Number(
    process.env.PANEL_PORT ||
    process.env.PORT ||
    3000
  );

const HOST =
  process.env.PANEL_HOST ||
  "0.0.0.0";

const PANEL_URL =
  process.env.PANEL_URL ||
  `http://localhost:${PORT}`;

const publicDir =
  path.join(__dirname, "public");


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧱 EXPRESS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.disable("x-powered-by");

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
// 🌐 LANGUAGE SESSIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const languageSessions = new Map();


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 CLEANUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function cleanupSessions() {

  const now = Date.now();

  for (
    const [sessionId, data]
    of languageSessions.entries()
  ) {

    if (
      data.expiresAt &&
      data.expiresAt < now
    ) {

      languageSessions.delete(
        sessionId
      );
    }
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 TRANSLATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const translations = {

  en: {

    languageTitle:
      "• Principal Language",

    languageSubtitle:
      "Choose your principal language.",

    parrain:
      "⚙️ Parrain Code",

    number:
      "Number :",

    code:
      "Code :",

    numberPlaceholder:
      "Enter bot number",

    codePlaceholder:
      "Enter Parrain Code",

    checking:
      "Checking...",

    botDisconnected:
      "❌ Bot is disconnected. The Parrain Code is no longer valid.",

    sessionMissing:
      "❌ The panel link has no session.",

    numberMissing:
      "❌ Enter the bot number.",

    codeMissing:
      "❌ Enter the Parrain Code.",

    loginFailed:
      "❌ Login failed.",

    serverError:
      "❌ Cannot contact the panel server.",

    connected:
      "🟢 Bot Connected",

    settings:
      "⚙️ SETTINGS PANEL",

    botSettings:
      "⚙️ Bot Settings",

    groupSettings:
      "👥 Group Settings",

    automatic:
      "🤖 Automatic Systems",

    footer:
      "By TOPFEROS TECH"
  },


  fr: {

    languageTitle:
      "• Langue principale",

    languageSubtitle:
      "Choisissez votre langue principale.",

    parrain:
      "⚙️ Code Parrain",

    number:
      "Numéro :",

    code:
      "Code :",

    numberPlaceholder:
      "Entrez le numéro du bot",

    codePlaceholder:
      "Entrez le Code Parrain",

    checking:
      "Vérification...",

    botDisconnected:
      "❌ Le bot est déconnecté. Le Code Parrain n'est plus valide.",

    sessionMissing:
      "❌ Le lien du panneau ne contient pas de session.",

    numberMissing:
      "❌ Entrez le numéro du bot.",

    codeMissing:
      "❌ Entrez le Code Parrain.",

    loginFailed:
      "❌ La connexion a échoué.",

    serverError:
      "❌ Impossible de contacter le serveur du panneau.",

    connected:
      "🟢 Bot connecté",

    settings:
      "⚙️ PANNEAU DE CONFIGURATION",

    botSettings:
      "⚙️ Paramètres du bot",

    groupSettings:
      "👥 Paramètres du groupe",

    automatic:
      "🤖 Systèmes automatiques",

    footer:
      "By TOPFEROS TECH"
  },


  es: {

    languageTitle:
      "• Idioma principal",

    languageSubtitle:
      "Elige tu idioma principal.",

    parrain:
      "⚙️ Código Parrain",

    number:
      "Número :",

    code:
      "Código :",

    numberPlaceholder:
      "Introduce el número del bot",

    codePlaceholder:
      "Introduce el Código Parrain",

    checking:
      "Comprobando...",

    botDisconnected:
      "❌ El bot está desconectado. El Código Parrain ya no es válido.",

    sessionMissing:
      "❌ El enlace del panel no contiene una sesión.",

    numberMissing:
      "❌ Introduce el número del bot.",

    codeMissing:
      "❌ Introduce el Código Parrain.",

    loginFailed:
      "❌ El inicio de sesión falló.",

    serverError:
      "❌ No se puede contactar con el servidor del panel.",

    connected:
      "🟢 Bot conectado",

    settings:
      "⚙️ PANEL DE CONFIGURACIÓN",

    botSettings:
      "⚙️ Configuración del bot",

    groupSettings:
      "👥 Configuración del grupo",

    automatic:
      "🤖 Sistemas automáticos",

    footer:
      "By TOPFEROS TECH"
  }

};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 VALID LANGUAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isValidLanguage(language) {

  return Object.prototype.hasOwnProperty.call(
    translations,
    language
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 GET BOT NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getBotNumber() {

  try {

    const sessions =
      typeof settingsPanel.getSessions ===
      "function"
        ? settingsPanel.getSessions()
        : [];

    const connected =
      sessions.find(
        session =>
          session.connected === true
      );

    return connected?.number || null;

  } catch (error) {

    console.error(
      "❌ GET BOT NUMBER ERROR:",
      error
    );

    return null;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 CHECK BOT CONNECTED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isBotConnected() {

  try {

    return (
      typeof settingsPanel.isBotConnected ===
      "function" &&
      settingsPanel.isBotConnected() === true
    );

  } catch (error) {

    console.error(
      "❌ BOT CONNECTION CHECK ERROR:",
      error
    );

    return false;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 VERIFY AUTHENTICATED SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function verifySession(sessionId) {

  if (!sessionId) {
    return false;
  }

  try {

    return (
      typeof settingsPanel.isAuthenticated ===
      "function" &&
      settingsPanel.isAuthenticated(
        sessionId
      ) === true
    );

  } catch (error) {

    console.error(
      "❌ SESSION VERIFY ERROR:",
      error
    );

    return false;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏠 HOME
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
// 🖼️ LOGO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/logo.png",
  (req, res) => {

    const logoPath =
      path.join(
        publicDir,
        "logo.png"
      );

    return res.sendFile(
      logoPath,
      error => {

        if (error) {

          return res
            .status(404)
            .end();
        }
      }
    );
  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 LANGUAGE API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.post(
  "/api/language",
  (req, res) => {

    cleanupSessions();

    const {
      sessionId,
      language
    } = req.body || {};


    if (!sessionId) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Session panel la pa jwenn."
        });
    }


    if (
      !isValidLanguage(language)
    ) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Language la pa valid."
        });
    }


    const old =
      languageSessions.get(
        sessionId
      ) || {};


    languageSessions.set(
      sessionId,
      {

        ...old,

        language,

        expiresAt:
          Date.now() +
          1000 *
          60 *
          60 *
          24
      }
    );


    return res.json({

      success: true,

      language,

      message:
        "Language saved successfully."
    });
  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 GET LANGUAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/language",
  (req, res) => {

    cleanupSessions();

    const {
      session
    } = req.query;


    if (!session) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Session panel la pa jwenn."
        });
    }


    const data =
      languageSessions.get(
        session
      );


    return res.json({

      success: true,

      language:
        data?.language || null
    });
  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 LOGIN API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.post(
  "/api/login",
  async (req, res) => {

    cleanupSessions();

    const {
      sessionId,
      number,
      code
    } = req.body || {};


    if (!sessionId) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Session panel la pa jwenn."
        });
    }


    const languageSession =
      languageSessions.get(
        sessionId
      );


    if (!languageSession) {

      return res
        .status(401)
        .json({

          success: false,

          message:
            "Session panel la pa valid."
        });
    }


    if (!number) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Enter bot number."
        });
    }


    if (!code) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Enter Parrain Code."
        });
    }


    // Verifye session WhatsApp espesifik la.

    if (
      typeof settingsPanel.isSessionConnected !==
      "function" ||
      !settingsPanel.isSessionConnected(
        sessionId
      )
    ) {

      return res
        .status(401)
        .json({

          success: false,

          message:
            "Bot la dekonekte oswa session lan pa egziste."
        });
    }


    try {

      const result =
        settingsPanel.verifySession(
          sessionId,
          String(number),
          String(code)
        );


      if (
        !result ||
        result.success !== true
      ) {

        return res
          .status(401)
          .json({

            success: false,

            message:
              result?.message ||
              "Login failed."
          });
      }


      languageSessions.set(
        sessionId,
        {

          ...languageSession,

          language:
            languageSession.language ||
            "en",

          authenticated:
            true,

          number:
            String(number)
              .replace(/\D/g, ""),

          expiresAt:
            Date.now() +
            1000 *
            60 *
            60 *
            24
        }
      );


      return res.json({

        success: true,

        authenticated: true,

        sessionId,

        message:
          "Login successful."
      });

    } catch (error) {

      console.error(
        "❌ LOGIN ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Cannot contact the panel server."
        });
    }
  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 PANEL STATUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/status",
  (req, res) => {

    const {
      session
    } = req.query;


    let sessionInfo = null;


    if (
      session &&
      typeof settingsPanel.getSession ===
      "function"
    ) {

      sessionInfo =
        settingsPanel.getSession(
          session
        );
    }


    return res.json({

      success: true,

      botConnected:
        session
          ? !!sessionInfo?.connected
          : isBotConnected(),

      authenticated:
        verifySession(
          session
        ),

      botNumber:
        sessionInfo?.number ||
        getBotNumber()
    });
  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ SETTINGS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (
  settingsApi &&
  typeof settingsApi.registerSettingsRoutes ===
  "function"
) {

  settingsApi.registerSettingsRoutes(
    app
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 404 API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(
  "/api",
  (req, res) => {

    return res
      .status(404)
      .json({

        success: false,

        message:
          "API route not found."
      });
  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ❌ ERROR HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(
  (
    error,
    req,
    res,
    next
  ) => {

    console.error(
      "❌ PANEL ERROR:",
      error
    );


    if (
      res.headersSent
    ) {

      return next(error);
    }


    return res
      .status(500)
      .json({

        success: false,

        message:
          "Internal panel server error."
      });
  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 START SERVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (
  require.main === module
) {

  app.listen(
    PORT,
    HOST,
    () => {

      console.log("");

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log(
        "🦁 TOPFEROS MD V1.0.0"
      );

      console.log(
        "🌐 PANEL SERVER"
      );

      console.log(
        `📡 ${PANEL_URL}`
      );

      console.log(
        `🔌 ${HOST}:${PORT}`
      );

      console.log(
        "🔐 Parrain Code: SESSION-BASED"
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log("");
    }
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {

  app,

  PORT,

  HOST,

  PANEL_URL,

  translations,

  isBotConnected,

  getBotNumber,

  verifySession
};