"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║                 ⚙️ PANEL SERVER                  ║
// ║                 🚀 TOPFEROS TECH                 ║
// ╚════════════════════════════════════════════════════╝

const path = require("path");
const fs = require("fs");
const express = require("express");
const crypto = require("crypto");

const settingsPanel = require("../settings/panel");

const app = express();

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
// 📁 PATHS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const publicDir = path.resolve(
  __dirname,
  "public"
);

const assetsDir = path.resolve(
  __dirname,
  "..",
  "assets"
);

const logoPath = path.resolve(
  assetsDir,
  "logo.png"
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📂 PUBLIC FILES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(
  express.static(publicDir)
);

app.use(
  "/assets",
  express.static(assetsDir)
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ LOGO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/assets/logo.png",
  (req, res) => {

    if (!fs.existsSync(logoPath)) {

      console.error(
        "❌ TOPFEROS MD LOGO NOT FOUND:",
        logoPath
      );

      return res
        .status(404)
        .send("TOPFEROS MD logo not found");
    }

    return res.sendFile(logoPath);
  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📡 BOT STATUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/status",
  (req, res) => {

    try {

      const connected =
        settingsPanel.isBotConnected() === true;

      const number =
        settingsPanel.getBotNumber();

      return res.json({
        success: true,
        connected,
        number: number || null
      });

    } catch (error) {

      console.error(
        "❌ STATUS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        connected: false,
        number: null,
        message: "Unable to get bot status."
      });
    }
  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 PARRAIN CODE STORAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Parrain Code = kòd otantifikasyon PANEL la.
// Li pa menm bagay ak WhatsApp Pairing Code.
//
// sessionId -> {
//   number,
//   code,
//   expiresAt
// }
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const parrainCodes = new Map();

const PARRAIN_CODE_LENGTH = 6;
const PARRAIN_CODE_TTL = 10 * 60 * 1000;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔑 GENERATE PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateParrainCode() {

  const bytes =
    crypto.randomBytes(4);

  const value =
    bytes.readUInt32BE(0) % 1000000;

  return String(value)
    .padStart(
      PARRAIN_CODE_LENGTH,
      "0"
    );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🆔 GENERATE SESSION ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateSessionId() {

  return crypto
    .randomBytes(24)
    .toString("hex");
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 CLEAN EXPIRED CODES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function cleanupExpiredParrainCodes() {

  const now = Date.now();

  for (
    const [
      sessionId,
      session
    ] of parrainCodes.entries()
  ) {

    if (
      !session ||
      session.expiresAt <= now
    ) {

      parrainCodes.delete(
        sessionId
      );
    }
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 CREATE / REFRESH PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createParrainCode(
  sessionId,
  number
) {

  cleanupExpiredParrainCodes();

  let code;

  do {

    code =
      generateParrainCode();

  } while (
    Array.from(
      parrainCodes.values()
    ).some(
      session =>
        session.code === code
    )
  );


  const expiresAt =
    Date.now() +
    PARRAIN_CODE_TTL;


  parrainCodes.set(
    sessionId,
    {
      number,
      code,
      expiresAt,
      authenticated: false
    }
  );


  return {
    code,
    expiresAt
  };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 VERIFY PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function verifyParrainCode(
  sessionId,
  number,
  code
) {

  cleanupExpiredParrainCodes();

  const session =
    parrainCodes.get(
      sessionId
    );


  if (!session) {
    return false;
  }


  if (
    session.number !== number
  ) {
    return false;
  }


  if (
    session.code !== code
  ) {
    return false;
  }


  if (
    session.expiresAt <= Date.now()
  ) {

    parrainCodes.delete(
      sessionId
    );

    return false;
  }


  session.authenticated = true;

  return true;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 DELETE PARRAIN SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function deleteParrainSession(
  sessionId
) {

  if (sessionId) {

    parrainCodes.delete(
      sessionId
    );
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 PARRAIN CODE AUTH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// POST /api/auth
//
// Body:
//
// {
//   sessionId: "...",
//   number: "509xxxxxxxx"
// }
//
// Response:
//
// {
//   success: true,
//   sessionId: "...",
//   number: "...",
//   code: "123456",
//   parrainCode: "123456",
//   panelCode: "123456",
//   expiresAt: 123456789
// }
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.post(
  "/api/auth",
  (req, res) => {

    try {

      let sessionId =
        String(
          req.body?.sessionId || ""
        ).trim();


      const number =
        String(
          req.body?.number || ""
        )
        .replace(
          /[^\d+]/g,
          ""
        );


      if (!number) {

        return res
          .status(400)
          .json({
            success: false,
            message:
              "Number User obligatwa."
          });
      }


      /*
       * Si frontend lan pa voye sessionId,
       * server la kreye youn.
       */
      if (!sessionId) {

        sessionId =
          generateSessionId();
      }


      const result =
        createParrainCode(
          sessionId,
          number
        );


      console.log(
        `🔐 Parrain Code created for ${number}: ${result.code}`
      );


      return res.json({

        success: true,

        authenticated: false,

        sessionId,

        number,

        code:
          result.code,

        parrainCode:
          result.code,

        panelCode:
          result.code,

        expiresAt:
          result.expiresAt

      });

    } catch (error) {

      console.error(
        "❌ PARRAIN AUTH ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Unable to generate Parrain Code."

        });
    }
  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 CHECK AUTHENTICATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/auth",
  (req, res) => {

    try {

      cleanupExpiredParrainCodes();

      const sessionId =
        String(
          req.query.session ||
          req.query.sessionId ||
          ""
        ).trim();


      if (!sessionId) {

        return res
          .status(401)
          .json({

            success: false,

            authenticated: false,

            connected:
              settingsPanel.isBotConnected() === true,

            message:
              "Session ID missing."

          });
      }


      const session =
        parrainCodes.get(
          sessionId
        );


      if (
        !session ||
        !session.authenticated
      ) {

        return res
          .status(401)
          .json({

            success: false,

            authenticated: false,

            connected:
              settingsPanel.isBotConnected() === true,

            message:
              "Session panel la pa valide."

          });
      }


      return res.json({

        success: true,

        authenticated: true,

        connected:
          settingsPanel.isBotConnected() === true,

        number:
          session.number

      });

    } catch (error) {

      console.error(
        "❌ AUTH CHECK ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          authenticated: false,

          message:
            "Auth error."

        });
    }
  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔑 PANEL LOGIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// POST /api/login
//
// Verifikasyon an fèt kont Parrain Code
// nou te kreye nan /api/auth.
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.post(
  "/api/login",
  (req, res) => {

    try {

      const sessionId =
        String(
          req.body?.sessionId || ""
        ).trim();


      const number =
        String(
          req.body?.number || ""
        )
        .replace(
          /[^\d+]/g,
          ""
        );


      const code =
        String(
          req.body?.code ||
          req.body?.parrainCode ||
          req.body?.panelCode ||
          ""
        ).trim();


      if (
        !sessionId ||
        !number ||
        !code
      ) {

        return res
          .status(400)
          .json({

            success: false,

            authenticated: false,

            message:
              "Session ID, number ak Parrain Code obligatwa."

          });
      }


      const verified =
        verifyParrainCode(
          sessionId,
          number,
          code
        );


      if (!verified) {

        return res
          .status(401)
          .json({

            success: false,

            authenticated: false,

            message:
              "Parrain Code la pa valide oswa li ekspire."

          });
      }


      /*
       * Si settingsPanel gen verifySession(),
       * nou ka kenbe ansyen session system lan tou.
       *
       * Men Parrain Code panel la deja verifye
       * anlè a, kidonk login lan pa depann de
       * WhatsApp Pairing Code.
       */

      return res.json({

        success: true,

        authenticated: true,

        connected:
          settingsPanel.isBotConnected() === true,

        sessionId,

        number

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

          authenticated: false,

          message:
            "Login failed."

        });
    }
  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 LANGUAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.post(
  "/api/language",
  (req, res) => {

    try {

      const sessionId =
        String(
          req.body?.sessionId || ""
        ).trim();


      const language =
        String(
          req.body?.language || "en"
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
        parrainCodes.get(
          sessionId
        );


      if (
        !session ||
        !session.authenticated
      ) {

        return res
          .status(401)
          .json({

            success: false,

            message:
              "Session panel la pa valide."

          });
      }


      const supportedLanguages = [
        "en",
        "fr",
        "es"
      ];


      if (
        !supportedLanguages.includes(
          language
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Language not supported."

          });
      }


      return res.json({

        success: true,

        language

      });

    } catch (error) {

      console.error(
        "❌ LANGUAGE ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Unable to save language."

        });
    }
  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ SETTINGS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Pa rele registerSettingsRoutes() isit la.
// settings-api.js separe li.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔒 LOGOUT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.post(
  "/api/logout",
  (req, res) => {

    try {

      const sessionId =
        String(
          req.body?.sessionId || ""
        ).trim();


      deleteParrainSession(
        sessionId
      );


      return res.json({

        success: true,

        message:
          "Session deleted."

      });

    } catch (error) {

      console.error(
        "❌ LOGOUT ERROR:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Logout failed."

        });
    }
  }
);


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
// ❌ 404
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(
  (req, res) => {

    if (
      req.path.startsWith(
        "/api/"
      )
    ) {

      return res
        .status(404)
        .json({

          success: false,

          message:
            "API route not found."

        });
    }


    return res
      .status(404)
      .send(
        "TOPFEROS MD Panel - Page not found."
      );
  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚨 ERROR HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(
  (error, req, res, next) => {

    console.error(
      "❌ PANEL SERVER ERROR:",
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
          "Internal server error."

      });
  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 START SERVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PORT =
  Number(
    process.env.PORT ||
    process.env.PANEL_PORT ||
    3000
  );


const HOST =
  process.env.PANEL_HOST ||
  "0.0.0.0";


const server =
  app.listen(
    PORT,
    HOST,
    () => {

      console.log("");

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log(
        "🤖 TOPFEROS MD V1.0.0 — PANEL SERVER"
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log(
        `🌐 Panel: http://${HOST}:${PORT}`
      );

      console.log(
        `🖼️ Logo: http://${HOST}:${PORT}/assets/logo.png`
      );

      console.log(
        `🔐 Parrain Code TTL: ${PARRAIN_CODE_TTL / 60000} minutes`
      );

      console.log(
        `📁 Public: ${publicDir}`
      );

      console.log(
        `📁 Assets: ${assetsDir}`
      );

      console.log(
        "🚀 TOPFEROS TECH"
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log("");
    }
  );


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 GRACEFUL SHUTDOWN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function shutdown(signal) {

  console.log(
    `\n🛑 ${signal} received.`
  );


  try {

    settingsPanel.setBotDisconnected();

  } catch (error) {

    console.error(
      "❌ BOT DISCONNECT ERROR:",
      error
    );
  }


  clearInterval(
    cleanupInterval
  );


  server.close(
    () => {

      console.log(
        "✅ TOPFEROS MD Panel stopped."
      );

      process.exit(0);
    }
  );
}


process.on(
  "SIGINT",
  () => {
    shutdown("SIGINT");
  }
);


process.on(
  "SIGTERM",
  () => {
    shutdown("SIGTERM");
  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 PERIODIC CLEANUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const cleanupInterval =
  setInterval(
    cleanupExpiredParrainCodes,
    60 * 1000
  );


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  app,
  server
};