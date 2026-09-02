"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║                 ⚙️ PANEL SERVER                  ║
// ║                 🚀 TOPFEROS TECH                 ║
// ╚════════════════════════════════════════════════════╝

const path = require("path");
const fs = require("fs");
const express = require("express");


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ MODULES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const settingsPanel =
  require("../settings/panel");

const settingsApi =
  require("./settings-api");


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧱 EXPRESS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const app = express();

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
// 📁 CHEMEN DOSYE YO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// TOPFEROS-MD/panel/public
const publicDir =
  path.resolve(
    __dirname,
    "public"
  );


// TOPFEROS-MD/assets
const assetsDir =
  path.resolve(
    __dirname,
    "..",
    "assets"
  );


// TOPFEROS-MD/assets/logo.png
const logoPath =
  path.resolve(
    assetsDir,
    "logo.png"
  );


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📂 PUBLIC FILES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(
  express.static(
    publicDir
  )
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ ASSETS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// URL:
// /assets/logo.png
//
// Fichye:
// TOPFEROS-MD/assets/logo.png
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(
  "/assets",
  express.static(
    assetsDir
  )
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ LOGO ROUTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/assets/logo.png",
  (req, res) => {

    if (
      !fs.existsSync(
        logoPath
      )
    ) {

      console.error(
        "❌ TOPFEROS MD LOGO NOT FOUND"
      );

      console.error(
        "📁 Logo path:",
        logoPath
      );

      return res
        .status(404)
        .send(
          "TOPFEROS MD logo not found"
        );
    }


    return res.sendFile(
      logoPath,
      error => {

        if (error) {

          console.error(
            "❌ TOPFEROS MD LOGO ERROR:",
            error.message
          );

          console.error(
            "📁 Logo path:",
            logoPath
          );

          if (
            !res.headersSent
          ) {

            return res
              .status(404)
              .send(
                "TOPFEROS MD logo not found"
              );
          }
        }

      }
    );

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

        number:
          number || null
      });

    } catch (error) {

      console.error(
        "❌ STATUS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          connected: false,
          number: null,

          message:
            "Unable to get bot status."
        });
    }

  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 PANEL AUTHENTICATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/auth",
  (req, res) => {

    try {

      const sessionId =
        String(
          req.query.session || ""
        ).trim();


      if (
        !sessionId
      ) {

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


      const authenticated =
        settingsPanel.isAuthenticated(
          sessionId
        ) === true;


      const connected =
        settingsPanel.isBotConnected() === true;


      const number =
        settingsPanel.getBotNumber();


      if (
        !authenticated
      ) {

        return res
          .status(401)
          .json({
            success: false,

            authenticated: false,

            connected,

            number:
              number || null,

            message:
              "Session panel la pa valide."
          });
      }


      return res.json({
        success: true,

        authenticated: true,

        connected,

        number:
          number || null
      });

    } catch (error) {

      console.error(
        "❌ AUTH ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          authenticated: false,
          connected: false,

          message:
            "Auth error."
        });
    }

  }
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔑 PANEL LOGIN
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
        ).trim();


      const code =
        String(
          req.body?.code || ""
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

            message:
              "Session ID, number ak code obligatwa."
          });
      }


      const verified =
        settingsPanel.verifySession(
          sessionId,
          number,
          code
        ) === true;


      if (
        !verified
      ) {

        return res
          .status(401)
          .json({
            success: false,

            message:
              "Number, code oswa session pa valide."
          });
      }


      return res.json({
        success: true,

        authenticated: true,

        connected:
          settingsPanel.isBotConnected() === true,

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


      if (
        !sessionId
      ) {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Session panel la pa jwenn."
          });
      }


      if (
        !settingsPanel.isAuthenticated(
          sessionId
        )
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
// settings-api.js deja jere:
//
// GET  /api/settings
// POST /api/settings
//
// Nou pa ajoute route sa yo ankò isit la.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

settingsApi.registerSettingsRoutes(
  app
);


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


      if (
        sessionId
      ) {

        settingsPanel.deleteSession(
          sessionId
        );
      }


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

      return next(
        error
      );
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
        `🌐 Panel: http://localhost:${PORT}`
      );

      console.log(
        `🖼️ Logo: http://localhost:${PORT}/assets/logo.png`
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

function shutdown(
  signal
) {

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
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  app,
  server
};