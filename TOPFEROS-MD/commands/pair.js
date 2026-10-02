"use strict";

const connection = require("../src/connection");

// ============================================================
// TOPFEROS MD V1.0.0
// PAIR COMMAND
// ============================================================

function cleanPhoneNumber(number) {
  return String(number || "")
    .replace(/\D/g, "");
}

function isValidPhoneNumber(number) {
  return /^\d{7,15}$/.test(number);
}

async function execute(context) {
  const {
    sock,
    message,
    args = []
  } = context || {};

  const chatId =
    message?.key?.remoteJid;

  if (!sock || !chatId) {
    return;
  }

  const number =
    cleanPhoneNumber(args[0]);

  if (!number) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ Mete nimewo WhatsApp la.\n\n" +
          "Egzanp: .pair 509XXXXXXXX"
      },
      {
        quoted: message
      }
    );

    return;
  }

  if (!isValidPhoneNumber(number)) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ Nimewo WhatsApp la pa valid.\n\n" +
          "Egzanp: .pair 509XXXXXXXX"
      },
      {
        quoted: message
      }
    );

    return;
  }

  try {
    const result =
      await connection.requestPairingCode(
        number
      );

    const code =
      String(result?.code || "")
        .trim();

    if (!code) {
      throw new Error(
        "WhatsApp pa retounen pairing code la."
      );
    }

    await sock.sendMessage(
      chatId,
      {
        text:
          "╭━━━━━━━━━━━━━━━━━━━━━━╮\n" +
          "┃   🔐 TOPFEROS MD PAIR  ┃\n" +
          "╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +
          `📱 Number: ${number}\n\n` +
          "🔑 Pairing Code:\n\n" +
          `*${code}*\n\n` +
          "📌 Sou WhatsApp la, ale nan:\n" +
          "Settings → Linked devices → Link a device → Link with phone number\n\n" +
          "⚠️ Antre code la menm jan li parèt la."
      },
      {
        quoted: message
      }
    );

  } catch (error) {
    console.error(
      "❌ PAIR COMMAND ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    let reason =
      "Pairing code la pa kapab kreye kounye a.";

    if (
      error?.code ===
      "PAIRING_IN_PROGRESS"
    ) {
      reason =
        "Gen yon pairing code ki deja an kou pou nimewo sa a.";
    }

    else if (
      error?.code ===
      "SESSION_ALREADY_CONNECTED"
    ) {
      reason =
        "Nimewo sa a deja konekte ak TOPFEROS MD.";
    }

    else if (
      error?.code ===
      "SESSION_ALREADY_REGISTERED"
    ) {
      reason =
        "Session sa a deja anrejistre. Sèvi ak session ki deja egziste a oswa dekonekte li anvan ou fè yon nouvo pairing.";
    }

    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ *TOPFEROS MD PAIR*\n\n" +
          reason +
          "\n\n" +
          "📱 Number: " +
          number
      },
      {
        quoted: message
      }
    );
  }
}

module.exports = {
  name: "pair",

  aliases: [],

  description:
    "Kreye WhatsApp pairing code pou yon nimewo.",

  usage:
    ".pair <NUMBER>",

  execute
};