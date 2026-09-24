"use strict";

const fs = require("fs");
const path = require("path");

const parrainService =
  require("../services/parrain");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤝 TOPFEROS MD — PARRAIN COMMAND
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
// 📤 SEND MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendParrainMessage(
  sock,
  jid,
  message,
  quoted
) {

  if (fs.existsSync(LOGO_PATH)) {

    const logo =
      fs.readFileSync(LOGO_PATH);

    await sock.sendMessage(
      jid,
      {
        image: logo,
        caption: message
      },
      quoted
        ? { quoted }
        : undefined
    );

  } else {

    console.warn(
      `⚠️ Logo pa jwenn: ${LOGO_PATH}`
    );

    await sock.sendMessage(
      jid,
      {
        text: message
      },
      quoted
        ? { quoted }
        : undefined
    );

  }

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📩 EXECUTE PARRAIN COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {

  const {
    sock,
    message,
    args = []
  } = context;

  const jid =
    message?.key?.remoteJid;

  if (!sock || !jid) {
    return;
  }


  try {

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
        "By TOPFEROS MD\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

      await sendParrainMessage(
        sock,
        jid,
        helpMessage,
        message
      );

      return;
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
        "By TOPFEROS MD\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

      await sendParrainMessage(
        sock,
        jid,
        errorMessage,
        message
      );

      return;
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
      "By TOPFEROS MD\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND PARRAIN CODE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sendParrainMessage(
      sock,
      jid,
      parrainMessage,
      message
    );


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📊 LOG
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log(
      `🤝 Parrain Code created for ${targetNumber}: ${code}`
    );


  } catch (error) {

    console.error(
      "❌ PARRAIN COMMAND ERROR:",
      error?.stack ||
      error?.message ||
      error
    );


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ ERROR MESSAGE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    try {

      const errorMessage =
        "╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n" +
        "┃        ❌ PARRAIN ERROR\n" +
        "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +

        "Pa kapab kreye Parrain Code la.\n\n" +

        "⚙️ Verifye:\n" +
        "• services/parrain.js\n" +
        "• Nimewo target la\n" +
        "• WhatsApp connection\n\n" +

        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "By TOPFEROS MD\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

      await sendParrainMessage(
        sock,
        jid,
        errorMessage,
        message
      );

    } catch (sendError) {

      console.error(
        "❌ PARRAIN ERROR MESSAGE:",
        sendError?.message ||
        sendError
      );

    }

  }

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 COMMAND EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {

  name: "parrain",

  aliases: [
    "parraincode",
    "referral"
  ],

  description:
    "Kreye yon Parrain Code pou yon nimewo.",

  usage:
    ".parrain 50934640464",

  execute

};


// ╔════════════════════════════════════════════════════╗
// ║             🚀 TECH BY TOPFEROS MD               ║
// ╚════════════════════════════════════════════════════╝