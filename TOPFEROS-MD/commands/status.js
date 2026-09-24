"use strict";

const {
  downloadContentFromMessage
} = require("@whiskeysockets/baileys");

// ============================================================
// 🦁 TOPFEROS MD — STATUS SYSTEM
// ============================================================
// Save / Send / Anrejistre Status = AUTOMATIC
// Pa bezwen prefix.
// View Once pa nan fichye sa a.
// ============================================================

function getBotJid(sock) {
  if (!sock?.user?.id) return null;

  const number = String(sock.user.id).split(":")[0];
  return `${number}@s.whatsapp.net`;
}

function unwrapStatusMessage(message) {
  let current = message?.message || message || null;
  let safety = 0;

  const wrappers = [
    "ephemeralMessage",
    "documentWithCaptionMessage",
    "associatedChildMessage"
  ];

  while (current && safety < 8) {
    safety++;

    let found = false;

    for (const key of wrappers) {
      if (current[key]?.message) {
        current = current[key].message;
        found = true;
        break;
      }
    }

    if (!found) break;
  }

  return current;
}

function getMediaMessage(message) {
  const msg = unwrapStatusMessage(message);

  if (!msg) return null;

  if (msg.imageMessage) {
    return {
      type: "image",
      media: msg.imageMessage
    };
  }

  if (msg.videoMessage) {
    return {
      type: "video",
      media: msg.videoMessage
    };
  }

  if (msg.audioMessage) {
    return {
      type: "audio",
      media: msg.audioMessage
    };
  }

  if (msg.documentMessage) {
    return {
      type: "document",
      media: msg.documentMessage
    };
  }

  return null;
}

async function downloadMedia(media, type) {
  if (!media || !type) return null;

  const stream = await downloadContentFromMessage(
    media,
    type
  );

  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

// ============================================================
// 📤 SEND STATUS TO BOT DM
// ============================================================

async function sendMediaToBotDM({
  sock,
  type,
  media,
  buffer,
  caption
}) {
  const botJid = getBotJid(sock);

  if (!botJid) return false;

  if (type === "image") {
    await sock.sendMessage(botJid, {
      image: buffer,
      caption
    });

    return true;
  }

  if (type === "video") {
    await sock.sendMessage(botJid, {
      video: buffer,
      caption,
      mimetype:
        media?.mimetype || "video/mp4"
    });

    return true;
  }

  if (type === "audio") {
    await sock.sendMessage(botJid, {
      audio: buffer,
      mimetype:
        media?.mimetype || "audio/mpeg",
      ptt: media?.ptt || false
    });

    return true;
  }

  if (type === "document") {
    await sock.sendMessage(botJid, {
      document: buffer,
      mimetype:
        media?.mimetype ||
        "application/octet-stream",
      fileName:
        media?.fileName || "status"
    });

    return true;
  }

  return false;
}

// ============================================================
// 📝 TEXT STATUS
// ============================================================

function getStatusText(message) {
  const msg = unwrapStatusMessage(message);

  if (!msg) return "";

  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    ""
  );
}

async function sendTextStatusToBotDM({
  sock,
  message
}) {
  const botJid = getBotJid(sock);

  if (!botJid) return false;

  const text = getStatusText(message);

  if (!text) return false;

  const sender =
    message?.key?.participant ||
    message?.participant ||
    "Unknown";

  await sock.sendMessage(botJid, {
    text:
      "╭━━━〔 🖼️ STATUS SAVED 〕━━━╮\n" +
      "┃\n" +
      `┃ 👤 From: ${sender}\n` +
      "┃\n" +
      `┃ 📝 ${text}\n` +
      "┃\n" +
      "┃ 📥 Save: AUTO\n" +
      "┃ 📤 Send: AUTO\n" +
      "┃ 🗂️ Anrejistre: AUTO\n" +
      "┃\n" +
      "╰━━━━━━━━━━━━━━━━━━━━╯\n" +
      "🦁 TOPFEROS MD"
  });

  return true;
}

// ============================================================
// 📥 SAVE STATUS AUTOMATIC
// ============================================================

async function saveStatus(context) {
  const {
    sock,
    message
  } = context || {};

  if (!sock || !message?.message) {
    return false;
  }

  try {
    const mediaData =
      getMediaMessage(message);

    // TEXT STATUS
    if (!mediaData) {
      return await sendTextStatusToBotDM({
        sock,
        message
      });
    }

    const {
      type,
      media
    } = mediaData;

    const buffer =
      await downloadMedia(
        media,
        type
      );

    if (!buffer) {
      return false;
    }

    const sender =
      message?.key?.participant ||
      message?.participant ||
      "Unknown";

    const caption =
      media?.caption ||
      "╭━━━〔 🖼️ STATUS SAVED 〕━━━╮\n" +
      "┃\n" +
      `┃ 👤 From: ${sender}\n` +
      "┃\n" +
      "┃ 📥 Save: AUTO\n" +
      "┃ 📤 Send: AUTO\n" +
      "┃ 🗂️ Anrejistre: AUTO\n" +
      "┃\n" +
      "╰━━━━━━━━━━━━━━━━━━━━╯\n" +
      "🦁 TOPFEROS MD";

    return await sendMediaToBotDM({
      sock,
      type,
      media,
      buffer,
      caption
    });

  } catch (error) {
    console.error(
      "❌ STATUS AUTO SAVE ERROR:",
      error
    );

    return false;
  }
}

// ============================================================
// 👁️ DETECT STATUS AUTOMATICALLY
// ============================================================

async function handleAutoStatus(context) {
  const {
    message
  } = context || {};

  if (
    message?.key?.remoteJid !==
    "status@broadcast"
  ) {
    return false;
  }

  const saved =
    await saveStatus(context);

  if (saved) {
    console.log(
      "✅ STATUS SAVED / SENT TO BOT DM"
    );
  }

  return saved;
}

// ============================================================
// ℹ️ STATUS INFO COMMAND
// ============================================================

async function execute(context) {
  const {
    sock,
    message
  } = context || {};

  const chatId =
    message?.key?.remoteJid;

  if (!chatId) return;

  await sock.sendMessage(
    chatId,
    {
      text:
        "╭━━━〔 🖼️ STATUS 〕━━━╮\n" +
        "┃\n" +
        "┃ 📥 Save: AUTOMATIC\n" +
        "┃ 📤 Send: AUTOMATIC\n" +
        "┃ 🗂️ Anrejistre: AUTOMATIC\n" +
        "┃ 🚫 Pa bezwen prefix\n" +
        "┃\n" +
        "╰━━━━━━━━━━━━━━━━━━━━╯"
    },
    {
      quoted: message
    }
  );
}

module.exports = {
  name: "status",
  aliases: ["savestatus"],
  description:
    "Status Save / Send / Anrejistre otomatikman.",
  usage: ".status",

  execute,
  saveStatus,
  handleAutoStatus,
  getMediaMessage,
  downloadMedia,
  sendMediaToBotDM,
  sendTextStatusToBotDM
};