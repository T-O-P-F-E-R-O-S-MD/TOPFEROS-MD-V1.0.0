"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║                 🤝 PARRAIN CODE                  ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 LOAD CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤝 LOAD PARRAIN SERVICE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const parrainService =
  require("../services/parrain");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📩 PARRAIN COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleParrainCommand({
  sock,
  jid,
  args = [],
  config: commandConfig
}) {
  try {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⚙️ USE PROVIDED CONFIG OR MAIN CONFIG
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const botConfig =
      commandConfig || config;

    const ownerNumber =
      botConfig?.owner?.number;

    if (!ownerNumber) {
      throw new Error(
        "Owner number pa configured nan config la."
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔐 CREATE PARRAIN CODE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const result =
      parrainService.createParrainCode(
        ownerNumber
      );

    // Service la ka retounen object oswa code
    // selon fason li te prepare a.
    const code =
      typeof result === "string"
        ? result
        : result?.code;

    if (!code) {
      throw new Error(
        "Parrain Code la pa kapab kreye."
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND PARRAIN CODE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendMessage(
      jid,
      {
        text:
          "╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n" +
          "┃\n" +
          "┃        🤝 PARRAIN CODE\n" +
          "┃\n" +
          "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +

          "🔐 *Code Parrain:*\n" +
          `${code}\n\n` +

          "🟢 Code la pare pou itilize.\n" +
          "⏳ Li rete disponib jiskaske li itilize.\n\n" +

          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
          "🚀 TOPFEROS TECH\n" +
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      }
    );

    console.log(
      `🤝 Parrain Code created: ${code}`
    );

    return {
      success: true,
      code
    };

  } catch (error) {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ ERROR HANDLING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.error(
      "❌ PARRAIN COMMAND ERROR:",
      error?.message || error
    );

    if (sock && jid) {
      try {

        await sock.sendMessage(
          jid,
          {
            text:
              "╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n" +
              "┃        ❌ PARRAIN ERROR\n" +
              "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +

              "Pa kapab kreye Parrain Code la.\n\n" +

              "⚙️ Verifye:\n" +
              "• config.owner.number\n" +
              "• services/parrain.js\n" +
              "• WhatsApp connection\n\n" +

              "🚀 TOPFEROS TECH"
          }
        );

      } catch (sendError) {

        console.error(
          "❌ PARRAIN ERROR MESSAGE:",
          sendError?.message || sendError
        );

      }
    }

    return {
      success: false,
      message:
        error?.message ||
        "Unknown error"
    };
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  handleParrainCommand
};


// ╔════════════════════════════════════════════════════╗
// ║                 🚀 TOPFEROS TECH                 ║
// ║                TOPFEROS MD V1.0.0                ║
// ╚════════════════════════════════════════════════════╝