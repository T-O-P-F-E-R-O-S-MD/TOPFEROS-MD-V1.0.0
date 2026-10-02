"use strict";

const {
  downloadContentFromMessage
} = require("@whiskeysockets/baileys");

function unwrapMessage(message) {
  let current =
    message?.message || message;

  for (let i = 0; i < 8; i++) {

    const keys = [
      "ephemeralMessage",
      "viewOnceMessage",
      "viewOnceMessageV2",
      "viewOnceMessageV2Extension",
      "documentWithCaptionMessage"
    ];

    const key =
      keys.find(
        k =>
          current?.[k]?.message
      );

    if (!key) break;

    current =
      current[key].message;
  }

  return current || {};
}

function getQuotedMessage(message) {
  const content =
    unwrapMessage(message);

  return (
    content
      ?.extendedTextMessage
      ?.contextInfo
      ?.quotedMessage ||

    content
      ?.imageMessage
      ?.contextInfo
      ?.quotedMessage ||

    content
      ?.videoMessage
      ?.contextInfo
      ?.quotedMessage ||

    content
      ?.documentMessage
      ?.contextInfo
      ?.quotedMessage ||

    content
      ?.audioMessage
      ?.contextInfo
      ?.quotedMessage ||

    null
  );
}

function getBotJid(sock) {
  const id =
    sock?.user?.id || "";

  const number =
    id
      .split("@")[0]
      .split(":")[0];

  return number
    ? `${number}@s.whatsapp.net`
    : null;
}

async function downloadMedia(
  media,
  type
) {
  const stream =
    await downloadContentFromMessage(
      media,
      type
    );

  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

async function execute({
  sock,
  message
}) {
  const jid =
    message?.key?.remoteJid;

  if (!jid) return;

  const quoted =
    getQuotedMessage(message);

  if (!quoted) {
    return sock.sendMessage(
      jid,
      {
        text:
          "❌ Reply sou mesaj/media " +
          "ou vle save a epi itilize .save."
      },
      {
        quoted: message
      }
    );
  }

  const content =
    unwrapMessage(quoted);

  const target =
    getBotJid(sock);

  if (!target) {
    return sock.sendMessage(
      jid,
      {
        text:
          "❌ Mwen pa jwenn JID bot la."
      },
      {
        quoted: message
      }
    );
  }

  try {

    if (content.imageMessage) {

      const buffer =
        await downloadMedia(
          content.imageMessage,
          "image"
        );

      await sock.sendMessage(
        target,
        {
          image: buffer,

          caption:
            content.imageMessage
              .caption || ""
        }
      );

    } else if (
      content.videoMessage
    ) {

      const buffer =
        await downloadMedia(
          content.videoMessage,
          "video"
        );

      await sock.sendMessage(
        target,
        {
          video: buffer,

          caption:
            content.videoMessage
              .caption || "",

          mimetype:
            content.videoMessage
              .mimetype ||
            "video/mp4"
        }
      );

    } else if (
      content.audioMessage
    ) {

      const buffer =
        await downloadMedia(
          content.audioMessage,
          "audio"
        );

      await sock.sendMessage(
        target,
        {
          audio: buffer,

          mimetype:
            content.audioMessage
              .mimetype ||
            "audio/mpeg",

          ptt:
            Boolean(
              content.audioMessage.ptt
            )
        }
      );

    } else if (
      content.documentMessage
    ) {

      const buffer =
        await downloadMedia(
          content.documentMessage,
          "document"
        );

      await sock.sendMessage(
        target,
        {
          document: buffer,

          mimetype:
            content.documentMessage
              .mimetype ||
            "application/octet-stream",

          fileName:
            content.documentMessage
              .fileName ||
            "TOPFEROS-MD-file"
        }
      );

    } else {

      const text =
        content.conversation ||
        content.extendedTextMessage?.text;

      if (!text) {
        throw new Error(
          "Unsupported message"
        );
      }

      await sock.sendMessage(
        target,
        {
          text:
            `💾 Saved message:\n\n${text}`
        }
      );
    }

    await sock.sendMessage(
      jid,
      {
        text:
          "✅ Save fini.\n\n" +
          "Mwen voye l nan DM bot la."
      },
      {
        quoted: message
      }
    );

  } catch (e) {

    console.error(
      "[SAVE]",
      e?.stack || e
    );

    await sock.sendMessage(
      jid,
      {
        text:
          "❌ Mwen pa kapab save mesaj sa a."
      },
      {
        quoted: message
      }
    );
  }
}

module.exports = {
  name: "save",

  aliases: [
    "store"
  ],

  description:
    "Save yon mesaj/media nan DM bot la.",

  usage:
    ".save (reply)",

  execute
};