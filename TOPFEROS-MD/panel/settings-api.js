"use strict";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 TOPFEROS MD V1.0.0
// ⚙️ SETTINGS API MODULE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const settingsPanel =
  require("../src/settingPanel");


// ============================================================
// 🧹 CLEAN SESSION ID
// ============================================================

function getSessionId(req) {

  return String(
    req.query?.session ||
    req.query?.sessionId ||
    req.body?.sessionId ||
    req.body?.session ||
    ""
  ).trim();

}


// ============================================================
// 🔐 CHECK SESSION
// ============================================================

function checkSession(
  req,
  res
) {

  const sessionId =
    getSessionId(req);


  if (!sessionId) {

    res.status(400).json({
      success: false,
      authenticated: false,
      error:
        "sessionId obligatwa."
    });

    return null;
  }


  if (
    !settingsPanel ||
    typeof settingsPanel.isAuthenticated !==
      "function"
  ) {

    res.status(503).json({
      success: false,
      authenticated: false,
      error:
        "settingPanel.js pa disponib."
    });

    return null;
  }


  const authenticated =
    settingsPanel.isAuthenticated(
      sessionId
    ) === true;


  if (!authenticated) {

    res.status(401).json({
      success: false,
      authenticated: false,
      error:
        "Session panel la pa valide."
    });

    return null;
  }


  return sessionId;

}


// ============================================================
// 🔌 CHECK BOT CONNECTION
// ============================================================

function checkBotConnection(
  res
) {

  if (
    !settingsPanel ||
    typeof settingsPanel.isBotConnected !==
      "function"
  ) {

    res.status(503).json({
      success: false,
      connected: false,
      error:
        "Status bot la pa disponib."
    });

    return false;
  }


  const connected =
    settingsPanel.isBotConnected() === true;


  if (!connected) {

    res.status(403).json({
      success: false,
      connected: false,
      error:
        "Bot la pa konekte. Settings yo pa disponib."
    });

    return false;
  }


  return true;

}


// ============================================================
// ⚙️ REGISTER SETTINGS ROUTES
// ============================================================

function registerSettingsRoutes(
  app
) {

  if (
    !app ||
    typeof app.get !== "function" ||
    typeof app.post !== "function"
  ) {

    throw new TypeError(
      "Express app valid obligatwa."
    );

  }


  // ==========================================================
  // 📥 GET SETTINGS
  // ==========================================================

  app.get(
    "/api/settings",
    async (
      req,
      res
    ) => {

      try {

        const sessionId =
          checkSession(
            req,
            res
          );


        if (!sessionId) {

          return;
        }


        if (
          !checkBotConnection(
            res
          )
        ) {

          return;
        }


        if (
          typeof settingsPanel.getSettings !==
            "function"
        ) {

          return res
            .status(503)
            .json({
              success: false,
              error:
                "getSettings() pa disponib."
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


        let botNumber = null;


        if (
          typeof settingsPanel.getPhoneFromSocket ===
            "function"
        ) {

          try {

            const session =
              typeof settingsPanel.getSession ===
                "function"
                ? settingsPanel.getSession(
                    sessionId
                  )
                : null;


            if (
              session?.sock
            ) {

              botNumber =
                settingsPanel.getPhoneFromSocket(
                  session.sock
                );

            }

          } catch (
            numberError
          ) {

            console.warn(
              "[TOPFEROS] Could not read bot number:",
              numberError?.message ||
              numberError
            );

          }

        }


        return res.json({

          success: true,

          authenticated: true,

          connected: true,

          sessionId,

          number:
            botNumber ||
            botInformation?.number ||
            null,

          settings:
            settings || {},

          botInformation:
            botInformation || {}

        });

      } catch (
        error
      ) {

        console.error(
          "[TOPFEROS] GET /api/settings ERROR:",
          error?.stack ||
          error?.message ||
          error
        );


        return res
          .status(500)
          .json({

            success: false,

            error:
              error?.message ||
              "Impossible de récupérer les paramètres."

          });

      }

    }
  );


  // ==========================================================
  // 💾 POST SETTINGS
  // ==========================================================

  app.post(
    "/api/settings",
    async (
      req,
      res
    ) => {

      try {

        const sessionId =
          checkSession(
            req,
            res
          );


        if (!sessionId) {

          return;
        }


        if (
          !checkBotConnection(
            res
          )
        ) {

          return;
        }


        if (
          typeof settingsPanel.applySettings !==
            "function"
        ) {

          return res
            .status(503)
            .json({

              success: false,

              error:
                "applySettings() pa disponib nan settingPanel.js."

            });

        }


        /*
         * Frontend la ap voye:
         *
         * {
         *   sessionId,
         *   bot: {...},
         *   settings: {...}
         * }
         *
         * Nou pran sèlman settings yo isit la.
         */

        const incomingSettings =
          req.body?.settings &&
          typeof req.body.settings ===
            "object"
              ? {
                  ...req.body.settings
                }
              : {};


        /*
         * Bot information yo rete apa.
         */

        const botInformation =
          req.body?.bot &&
          typeof req.body.bot ===
            "object"
              ? {
                  ...req.body.bot
                }
              : null;


        /*
         * Apply settings.
         */

        const updatedSettings =
          await settingsPanel.applySettings(
            sessionId,
            incomingSettings
          );


        /*
         * Apply bot information si backend la
         * sipòte updateBotInformation().
         */

        let updatedBot =
          botInformation;


        if (
          botInformation &&
          typeof settingsPanel.updateBotInformation ===
            "function"
        ) {

          updatedBot =
            await settingsPanel.updateBotInformation(
              sessionId,
              botInformation
            );

        }


        return res.json({

          success: true,

          authenticated: true,

          connected: true,

          sessionId,

          settings:
            updatedSettings ||
            {},

          botInformation:
            updatedBot ||
            botInformation ||
            {}

        });

      } catch (
        error
      ) {

        console.error(
          "[TOPFEROS] POST /api/settings ERROR:",
          error?.stack ||
          error?.message ||
          error
        );


        return res
          .status(500)
          .json({

            success: false,

            error:
              error?.message ||
              "Impossible de sauvegarder les paramètres."

          });

      }

    }
  );


  console.log(
    "⚙️ TOPFEROS MD SETTINGS API ROUTES REGISTERED"
  );

}


// ============================================================
// 📦 EXPORTS
// ============================================================

module.exports = {

  registerSettingsRoutes

};


// ╔════════════════════════════════════════════════════╗
// ║             🚀 TECH BY TOPFEROS MD               ║
// ╚════════════════════════════════════════════════════╝