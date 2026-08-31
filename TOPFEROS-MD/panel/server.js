"use strict";

const express = require("express");
const path = require("path");

const settingsPanel = require("../settings/panel");
const settingsApi = require("./settings-api");

// Session Manager panel la
const sessionManager = require("./session");

const app = express();


// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V1.0.0                ║
// ║                 🌐 WEB PANEL                      ║
// ║                🚀 TOPFEROS TECH                   ║
// ╚════════════════════════════════════════════════════╝


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ KONFIGIRASYON SERVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 CHEMEN DOSYE YO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Dosye kote index.html ak lòt paj panel yo ye.
const publicDir =
  path.join(
    __dirname,
    "public"
  );


// Dosye assets bot la.
// Egzanp:
// TOPFEROS-MD/
// ├── assets/
// │   └── logo.png
// └── panel/
//     └── server.js

const assetsDir =
  path.join(
    __dirname,
    "..",
    "assets"
  );


const logoPath =
  path.join(
    assetsDir,
    "logo.png"
  );


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧱 EXPRESS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.disable(
  "x-powered-by"
);


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
// 📂 FICHYE PUBLIC
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// CSS, JS ak lòt fichye ki nan panel/public/
app.use(
  express.static(
    publicDir
  )
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ ASSETS BOT LA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Sa pèmèt:
// /assets/logo.png
//
// mache dirèkteman ak:
// TOPFEROS-MD/assets/logo.png

app.use(
  "/assets",
  express.static(
    assetsDir
  )
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ ROUTE LOGO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Sa pèmèt tou:
// /logo.png

app.get(
  "/logo.png",
  (req, res) => {

    return res.sendFile(
      logoPath,
      error => {

        if (error) {

          console.error(
            "❌ LOGO ERROR:",
            error.message
          );

          if (
            !res.headersSent
          ) {

            return res
              .status(404)
              .send(
                "Logo not found"
              );
          }
        }
      }
    );
  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 NETWAYAJ SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function cleanupSessions() {

  try {

    if (
      sessionManager &&
      typeof sessionManager.cleanupSessions ===
      "function"
    ) {

      sessionManager.cleanupSessions();

    }

  } catch (error) {

    console.error(
      "❌ SESSION CLEANUP ERROR:",
      error.message
    );

  }

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 LANGUE DISPONIB
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
// 🔎 VERIFYE LANGUE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isValidLanguage(
  language
) {

  return Object.prototype.hasOwnProperty.call(
    translations,
    language
  );

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🆕 KREYE SESSION PANEL OTOMATIKMAN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createPanelSession() {

  try {

    if (
      !sessionManager ||
      typeof sessionManager.createSession !==
      "function"
    ) {

      return null;

    }


    const session =
      sessionManager.createSession({

        language: null,

        connected: false

      });


    return session;

  } catch (error) {

    console.error(
      "❌ CREATE PANEL SESSION ERROR:",
      error.message
    );

    return null;

  }

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 JWENN SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getPanelSession(
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
      "❌ GET PANEL SESSION ERROR:",
      error.message
    );

    return null;

  }

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 VERIFYE AUTHENTIFICATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function verifySession(
  sessionId
) {

  if (!sessionId) {
    return false;
  }


  try {

    return (
      typeof sessionManager.isAuthenticated ===
      "function" &&
      sessionManager.isAuthenticated(
        sessionId
      ) === true
    );

  } catch (error) {

    console.error(
      "❌ SESSION VERIFY ERROR:",
      error.message
    );

    return false;

  }

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 VERIFYE SESSION CONNECTED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isSessionConnected(
  sessionId
) {

  if (!sessionId) {
    return false;
  }


  try {

    return (
      typeof sessionManager.isSessionConnected ===
      "function" &&
      sessionManager.isSessionConnected(
        sessionId
      ) === true
    );

  } catch (error) {

    console.error(
      "❌ SESSION CONNECTION ERROR:",
      error.message
    );

    return false;

  }

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 JWENN NUMERO BOT LA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getBotNumber() {

  try {

    // Premye opsyon:
    // verifye tout session panel yo.

    if (
      typeof sessionManager.getSessions ===
      "function"
    ) {

      const sessions =
        sessionManager.getSessions();


      const connected =
        sessions.find(
          session =>
            session.connected === true
        );


      if (
        connected?.number
      ) {

        return connected.number;

      }

    }


    // Dezyèm opsyon:
    // itilize settings/panel.js si li genyen fonksyon an.

    if (
      typeof settingsPanel.getSessions ===
      "function"
    ) {

      const sessions =
        settingsPanel.getSessions();


      const connected =
        sessions.find(
          session =>
            session.connected === true
        );


      return connected?.number || null;

    }


    return null;

  } catch (error) {

    console.error(
      "❌ GET BOT NUMBER ERROR:",
      error.message
    );

    return null;

  }

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 VERIFYE SI BOT LA CONNECTED
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isBotConnected() {

  try {

    // Si settings/panel.js gen fonksyon an,
    // itilize li.

    if (
      typeof settingsPanel.isBotConnected ===
      "function"
    ) {

      return (
        settingsPanel.isBotConnected() === true
      );

    }


    // Sinon gade session manager la.

    if (
      typeof sessionManager.getSessions ===
      "function"
    ) {

      return sessionManager
        .getSessions()
        .some(
          session =>
            session.connected === true
        );

    }


    return false;

  } catch (error) {

    console.error(
      "❌ BOT CONNECTION CHECK ERROR:",
      error.message
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

    cleanupSessions();


    let sessionId =
      String(
        req.query.session ||
        req.query.sessionId ||
        ""
      ).trim();


    // Si pa gen sessionId,
    // kreye youn otomatikman.

    if (!sessionId) {

      const session =
        createPanelSession();


      if (
        session?.sessionId
      ) {

        sessionId =
          session.sessionId;


        return res.redirect(
          `/?session=${encodeURIComponent(sessionId)}`
        );

      }

    }


    return res.sendFile(
      path.join(
        publicDir,
        "index.html"
      )
    );

  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ SETTINGS PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/settings.html",
  (req, res) => {

    cleanupSessions();


    const sessionId =
      String(
        req.query.session ||
        req.query.sessionId ||
        ""
      ).trim();


    // Pa kite yon moun antre dirèkteman
    // nan settings san li pa login.

    if (
      !sessionId ||
      !verifySession(sessionId)
    ) {

      return res.redirect(
        "/"
      );

    }


    return res.sendFile(
      path.join(
        publicDir,
        "settings.html"
      )
    );

  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 API LANGUAGE
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
      !getPanelSession(sessionId)
    ) {

      return res
        .status(401)
        .json({

          success: false,

          message:
            "Session panel la pa valid oswa li ekspire."

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


    try {

      if (
        typeof sessionManager.setLanguage ===
        "function"
      ) {

        sessionManager.setLanguage(
          sessionId,
          language
        );

      }


      return res.json({

        success: true,

        language,

        message:
          "Language saved successfully."

      });

    } catch (error) {

      console.error(
        "❌ LANGUAGE ERROR:",
        error.message
      );


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Pa kapab sove language la."

        });

    }

  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 GET LANGUAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/language",
  (req, res) => {

    cleanupSessions();


    const sessionId =
      String(
        req.query.session ||
        req.query.sessionId ||
        ""
      ).trim();


    if (!sessionId) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Session panel la pa jwenn."

        });

    }


    const session =
      getPanelSession(
        sessionId
      );


    return res.json({

      success: true,

      language:
        session?.language || null

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


    const session =
      getPanelSession(
        sessionId
      );


    if (!session) {

      return res
        .status(401)
        .json({

          success: false,

          message:
            "Session panel la pa valid oswa li ekspire."

        });

    }


    if (!number) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Tanpri antre nimewo bot la."

        });

    }


    if (!code) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Tanpri antre Parrain Code la."

        });

    }


    // Nimewo a dwe sèlman chif.
    const cleanNumber =
      String(number)
        .replace(/\D/g, "");


    // Code a netwaye pou evite
    // pwoblèm ak lèt miniskil.
    const cleanCode =
      String(code)
        .trim()
        .toUpperCase();


    if (!cleanNumber) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Nimewo bot la pa valid."

        });

    }


    if (!cleanCode) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Parrain Code la pa valid."

        });

    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔐 VERIFYE PARRAIN CODE LA AK SESSION MANAGER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    try {

      if (
        typeof sessionManager.verifyLogin !==
        "function"
      ) {

        console.error(
          "❌ verifyLogin() pa jwenn nan panel/session.js"
        );


        return res
          .status(500)
          .json({

            success: false,

            message:
              "Session Manager pa pare."

          });

      }


      const result =
        sessionManager.verifyLogin(
          sessionId,
          cleanNumber,
          cleanCode
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


      return res.json({

        success: true,

        authenticated: true,

        sessionId,

        language:
          getPanelSession(
            sessionId
          )?.language || "en",

        number:
          cleanNumber,

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
            "Pa kapab verifye login lan."

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

    cleanupSessions();


    const sessionId =
      String(
        req.query.session ||
        req.query.sessionId ||
        ""
      ).trim();


    const session =
      getPanelSession(
        sessionId
      );


    return res.json({

      success: true,

      botConnected:
        session
          ? session.connected === true
          : isBotConnected(),

      authenticated:
        sessionId
          ? verifySession(
              sessionId
            )
          : false,

      botNumber:
        session?.number ||
        getBotNumber(),

      sessionId:
        session?.sessionId ||
        null,

      language:
        session?.language ||
        null

    });

  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 SESSION INFO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/session",
  (req, res) => {

    cleanupSessions();


    const sessionId =
      String(
        req.query.session ||
        req.query.sessionId ||
        ""
      ).trim();


    if (!sessionId) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Session ID la pa jwenn."

        });

    }


    const session =
      getPanelSession(
        sessionId
      );


    if (!session) {

      return res
        .status(404)
        .json({

          success: false,

          message:
            "Session lan pa egziste oswa li ekspire."

        });

    }


    return res.json({

      success: true,

      session

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


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━