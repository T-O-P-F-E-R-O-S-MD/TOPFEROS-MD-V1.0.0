"use strict";

const path = require("path");
const express = require("express");

const settingsPanel = require("../settings/panel");
const connection = require("../src/connection");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 TOPFEROS MD — PANEL SERVER
// 🚀 TOPFEROS TECH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const app = express();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ SERVER CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PORT =
  Number(
    process.env.PORT ||
    process.env.PANEL_PORT ||
    3000
  );

const HOST =
  "0.0.0.0";

const PUBLIC_DIR =
  path.join(
    __dirname,
    "public"
  );

const ASSETS_DIR =
  path.join(
    PUBLIC_DIR,
    "assets"
  );

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 PANEL SESSIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Nou pa kreye fake Parrain Code ankò.
//
// Code ki nan Map sa a se vrè code
// WhatsApp/Baileys te retounen.
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const pairingSessions =
  new Map();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧩 MIDDLEWARE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.use(
  express.json()
);

app.use(
  express.urlencoded({
    extended: true
  })
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 STATIC FILES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ❤️ HEALTH CHECK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/status",
  (req, res) => {

    try {

      return res.json({
        success: true,

        connected:
          connection.isConnected(),

        botConnected:
          connection.isConnected(),

        phoneNumber:
          connection.getPhoneNumber() || null

      });

    } catch (error) {

      console.error(
        "❌ STATUS ERROR:",
        error?.message || error
      );

      return res.status(500).json({
        success: false,
        connected: false,
        error:
          "Unable to get bot status."
      });

    }

  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 REAL WHATSAPP PAIRING CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// POST /api/auth
//
// Body:
// {
//   "sessionId": "...",
//   "number": "509XXXXXXXX"
// }
//
// Li pral rele:
//
// connection.requestPairingCode(number)
//
// Sa ap retounen vrè WhatsApp Pairing Code la.
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.post(
  "/api/auth",
  async (req, res) => {

    try {

      const sessionId =
        String(
          req.body?.sessionId ||
          ""
        ).trim();

      const number =
        String(
          req.body?.number ||
          ""
        ).trim();

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🔎 VERIFY SESSION ID
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      if (!sessionId) {

        return res.status(400).json({
          success: false,
          error:
            "Session ID obligatwa."
        });

      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 📱 VERIFY NUMBER
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      if (!number) {

        return res.status(400).json({
          success: false,
          error:
            "WhatsApp phone number obligatwa."
        });

      }

      console.log("");

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      console.log(
        "📱 TOPFEROS MD — NEW PAIRING REQUEST"
      );

      console.log(
        `🆔 Session: ${sessionId}`
      );

      console.log(
        `📞 Number: ${number}`
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🔐 REQUEST REAL WHATSAPP CODE
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      const pairingCode =
        await connection.requestPairingCode(
          number
        );

      if (!pairingCode) {

        return res.status(500).json({
          success: false,
          error:
            "WhatsApp pa retounen pairing code."
        });

      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 💾 SAVE PAIRING SESSION
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      pairingSessions.set(
        sessionId,
        {
          number:
            number.replace(/\D/g, ""),

          code:
            pairingCode,

          createdAt:
            Date.now()
        }
      );

      console.log("");

      console.log(
        "✅ REAL WHATSAPP PAIRING CODE GENERATED"
      );

      console.log(
        `🔐 Code: ${pairingCode}`
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      );

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 📤 SEND CODE TO PANEL
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      return res.json({

        success: true,

        sessionId,

        number:
          number.replace(/\D/g, ""),

        // Frontend aktyèl la ap chèche sa
        parrainCode:
          pairingCode,

        // Backup pou frontend
        code:
          pairingCode

      });

    } catch (error) {

      console.error("");

      console.error(
        "❌ PAIRING REQUEST ERROR:",
        error?.message || error
      );

      console.error("");

      return res.status(500).json({

        success: false,

        error:
          error?.message ||
          "Unable to generate WhatsApp pairing code."

      });

    }

  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 GET PAIRING SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/api/auth/:sessionId",
  (req, res) => {

    try {

      const sessionId =
        String(
          req.params.sessionId ||
          ""
        ).trim();

      if (!sessionId) {

        return res.status(400).json({
          success: false,
          error:
            "Session ID obligatwa."
        });

      }

      const session =
        pairingSessions.get(
          sessionId
        );

      if (!session) {

        return res.status(404).json({
          success: false,
          error:
            "Pairing session pa jwenn."
        });

      }

      return res.json({

        success: true,

        sessionId,

        number:
          session.number,

        parrainCode:
          session.code,

        code:
          session.code,

        createdAt:
          session.createdAt

      });

    } catch (error) {

      console.error(
        "❌ GET PAIRING SESSION ERROR:",
        error?.message || error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to get pairing session."
      });

    }

  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ❤️ BOT LOGIN / STATUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Pa gen Panel Code ankò.
//
// WhatsApp Pairing Code la se WhatsApp li menm
// ki itilize pou konekte account lan.
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.post(
  "/api/login",
  (req, res) => {

    return res.json({

      success:
        connection.isConnected(),

      connected:
        connection.isConnected(),

      message:
        connection.isConnected()
          ? "WhatsApp bot connected."
          : "WhatsApp bot not connected."

    });

  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌍 LANGUAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.post(
  "/api/language",
  (req, res) => {

    const language =
      String(
        req.body?.language ||
        "en"
      ).toLowerCase();

    const allowedLanguages =
      [
        "en",
        "fr",
        "es"
      ];

    if (
      !allowedLanguages.includes(
        language
      )
    ) {

      return res.status(400).json({
        success: false,
        error:
          "Unsupported language."
      });

    }

    return res.json({

      success: true,

      language

    });

  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚪 LOGOUT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.post(
  "/api/logout",
  async (req, res) => {

    try {

      await connection.stop();

      return res.json({

        success: true,

        message:
          "WhatsApp connection stopped."

      });

    } catch (error) {

      console.error(
        "❌ LOGOUT ERROR:",
        error?.message || error
      );

      return res.status(500).json({

        success: false,

        error:
          error?.message ||
          "Unable to logout."

      });

    }

  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏠 MAIN PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get(
  "/",
  (req, res) => {

    res.sendFile(
      path.join(
        PUBLIC_DIR,
        "index.html"
      )
    );

  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 START WHATSAPP CONNECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Render ap kouri panel/server.js dirèkteman.
// Se poutèt sa nou bezwen lanse connection.js isit la.
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startWhatsApp() {

  try {

    console.log("");

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.log(
      "🤖 TOPFEROS MD — STARTING WHATSAPP"
    );

    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    await connection.start();

    console.log(
      "✅ WhatsApp connection initialized."
    );

  } catch (error) {

    console.error(
      "❌ WHATSAPP START ERROR:",
      error?.message || error
    );

  }

}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 START PANEL SERVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.listen(
  PORT,
  HOST,
  () => {

    console.log("");

    console.log(
      "╔══════════════════════════════════════════════╗"
    );

    console.log(
      "║             🤖 TOPFEROS MD                 ║"
    );

    console.log(
      "║                 V1.0.0                     ║"
    );

    console.log(
      "║                                            ║"
    );

    console.log(
      "║             🚀 TOPFEROS TECH               ║"
    );

    console.log(
      "╚══════════════════════════════════════════════╝"
    );

    console.log("");

    console.log(
      `🌐 Panel running on port ${PORT}`
    );

    console.log(
      `📡 Host: ${HOST}`
    );

    console.log("");

  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 START WHATSAPP AFTER PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

startWhatsApp();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛑 PROCESS SHUTDOWN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function shutdown(
  signal
) {

  console.log("");

  console.log(
    `🛑 TOPFEROS MD: Received ${signal}`
  );

  try {

    await connection.stop();

  } catch (error) {

    console.error(
      "❌ SHUTDOWN ERROR:",
      error?.message || error
    );

  }

  process.exit(0);

}

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = app;