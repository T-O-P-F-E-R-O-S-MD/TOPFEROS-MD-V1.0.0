"use strict";

const fs = require("fs");
const path = require("path");

const config = require("../config");
const parrainService = require("../services/parrain");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ LOGO BOT LA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LOGO_PATH = path.join(
  __dirname,
  "..",
  "assets",
  "logo.png"
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 CLEAN PHONE NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function cleanPhoneNumber(number) {
  return String(number || "")
    .replace(/\D/g, "");
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 VALIDATE PHONE NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isValidPhoneNumber(number) {
  return /^\d{10,15}$/.test(number);
}


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

    const botConfig =
      commandConfig || config;


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📱 GET TARGET NUMBER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const rawNumber =
      args?.[0];

    const targetNumber =
      cleanPhoneNumber(rawNumber);


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ NUMBER REQUIRED
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!targetNumber) {

      const helpMessage =
        "╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n" +
        "┃        🤝 PARRAIN\n" +
        "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +

        "❌ Ou dwe mete nimewo moun nan.\n\n" +

        "📌 *Egzanp:*\n" +
        "`.parrain 50934640464`\n\n" +

        "📱 Mete nimewo a ak country code la.\n\n" +

        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "By TECH TOPFEROS MD\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";


      if (fs.existsSync(LOGO_PATH)) {

        const logo =
          fs.readFileSync(LOGO_PATH);

        await sock.sendMessage(
          jid,
          {
            image: logo,
            caption: helpMessage
          }
        );

      } else {

        await sock.sendMessage(
          jid,
          {
            text: helpMessage
          }
        );
      }

      return {
        success: false,
        message:
          "Target phone number obligatwa."
      };
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ INVALID NUMBER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!isValidPhoneNumber(targetNumber)) {

      const errorMessage =
        "╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n" +
        "┃        ❌ PARRAIN ERROR\n" +
        "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +

        "📱 Nimewo a pa valid.\n\n" +

        "📌 *Egzanp:*\n" +
        "`.parrain 50934640464`\n\n" +

        "Country code la dwe ladan l.\n\n" +

        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "By TECH TOPFEROS MD\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";


      if (fs.existsSync(LOGO_PATH)) {

        const logo =
          fs.readFileSync(LOGO_PATH);

        await sock.sendMessage(
          jid,
          {
            image: logo,
            caption: errorMessage
          }
        );

      } else {

        await sock.sendMessage(
          jid,
          {
            text: errorMessage
          }
        );
      }

      return {
        success: false,
        message:
          "Invalid phone number."
      };
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔐 CREATE PARRAIN CODE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const result =
      parrainService.createParrainCode(
        targetNumber
      );

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
    // 🤝 PARRAIN MESSAGE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const parrainMessage =
      "╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n" +
      "┃        🤝 PARRAIN CODE\n" +
      "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +

      "📱 *Nimewo:*\n" +
      `${targetNumber}\n\n` +

      "🔐 *CODE PARRAIN:*\n\n" +
      "```" +
      `${code}` +
      "```\n\n" +

      "📋 *Kopye code la anlè a pou itilize li.*\n" +
      "🟢 Code la pare pou itilize.\n" +
      "⏳ Li rete disponib jiskaske li itilize.\n\n" +

      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "By TECH TOPFEROS MD\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND PARRAIN CODE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (fs.existsSync(LOGO_PATH)) {

      const logo =
        fs.readFileSync(LOGO_PATH);

      await sock.sendMessage(
        jid,
        {
          image: logo,
          caption: parrainMessage
        }
      );

    } else {

      console.warn(
        `⚠️ Logo pa jwenn: ${LOGO_PATH}`
      );

      await sock.sendMessage(
        jid,
        {
          text: parrainMessage
        }
      );
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📊 LOG
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log(
      `🤝 Parrain Code created for ${targetNumber}: ${code}`
    );


    return {
      success: true,
      code,
      targetNumber
    };


  } catch (error) {

    console.error(
      "❌ PARRAIN COMMAND ERROR:",
      error?.message || error
    );


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ ERROR MESSAGE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (sock && jid) {

      try {

        const errorMessage =
          "╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n" +
          "┃        ❌ PARRAIN ERROR\n" +
          "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +

          "Pa kapab kreye Parrain Code la.\n\n" +

          "⚙️ Verifye:\n" +
          "• Nimewo a\n" +
          "• services/parrain.js\n" +
          "• WhatsApp connection\n\n" +

          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
          "By TECH TOPFEROS MD\n" +
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";


        if (fs.existsSync(LOGO_PATH)) {

          const logo =
            fs.readFileSync(LOGO_PATH);

          await sock.sendMessage(
            jid,
            {
              image: logo,
              caption: errorMessage
            }
          );

        } else {

          await sock.sendMessage(
            jid,
            {
              text: errorMessage
            }
          );
        }

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
// ║             🚀 TECH BY TOPFEROS MD               ║
// ╚════════════════════════════════════════════════════╝