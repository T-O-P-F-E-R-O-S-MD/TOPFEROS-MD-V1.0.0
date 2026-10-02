"use strict";

function jidFromNumber(value) {
  const number =
    String(value || "")
      .replace(/\D/g, "");

  if (!number) {
    return null;
  }

  return `${number}@s.whatsapp.net`;
}

async function execute({
  sock,
  message,
  text = ""
}) {
  const jid =
    message?.key?.remoteJid;

  const raw =
    String(text || "").trim();

  if (!jid) return;

  const match =
    raw.match(
      /^(\+?[0-9][0-9\s().-]{6,})\s+([\s\S]+)$/
    );

  if (!match) {
    return sock.sendMessage(
      jid,
      {
        text:
          "❌ Fòma:\n\n" +
          ".send 509xxxxxxxx Mesaj la"
      },
      {
        quoted: message
      }
    );
  }

  const target =
    jidFromNumber(match[1]);

  const messageText =
    match[2].trim();

  if (!target) {
    return sock.sendMessage(
      jid,
      {
        text:
          "❌ Number la pa valid."
      },
      {
        quoted: message
      }
    );
  }

  if (!messageText) {
    return sock.sendMessage(
      jid,
      {
        text:
          "❌ Mesaj la vid."
      },
      {
        quoted: message
      }
    );
  }

  try {

    await sock.sendMessage(
      target,
      {
        text: messageText
      }
    );

    await sock.sendMessage(
      jid,
      {
        text:
          `✅ Mesaj la voye bay ${match[1]}.`
      },
      {
        quoted: message
      }
    );

  } catch (e) {

    console.error(
      "[SEND]",
      e?.stack || e
    );

    await sock.sendMessage(
      jid,
      {
        text:
          "❌ Mwen pa kapab voye mesaj la.\n\n" +
          "Verifye number la ak koneksyon " +
          "WhatsApp la."
      },
      {
        quoted: message
      }
    );
  }
}

module.exports = {
  name: "send",

  aliases: [
    "msg"
  ],

  description:
    "Voye yon mesaj bay yon number.",

  usage:
    ".send <number> <message>",

  execute
};