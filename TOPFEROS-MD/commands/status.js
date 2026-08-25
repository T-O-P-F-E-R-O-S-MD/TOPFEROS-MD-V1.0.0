"use strict";

const {
  downloadContentFromMessage
} = require("@whiskeysockets/baileys");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ TOPFEROS MD — STATUS / VIEW ONCE SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 JWENN JID BOT LA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getBotJid(sock) {
  if (!sock?.user?.id) {
    return null;
  }

  const number =
    sock.user.id.split(":")[0];

  return `${number}@s.whatsapp.net`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👁️ JWENN VIEW ONCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getViewOnceMessage(message) {
  if (!message?.message) {
    return null;
  }

  const msg = message.message;

  if (msg.viewOnceMessageV2?.message) {
    return msg.viewOnceMessageV2.message;
  }

  if (
    msg.viewOnceMessageV2Extension?.message
  ) {
    return msg.viewOnceMessageV2Extension.message;
  }

  if (msg.viewOnceMessage?.message) {
    return msg.viewOnceMessage.message;
  }

  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📱 JWENN MEDYA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getMediaMessage(message) {
  if (!message) {
    return null;
  }

  if (message.imageMessage) {
    return {
      type: "image",
      media: message.imageMessage
    };
  }

  if (message.videoMessage) {
    return {
      type: "video",
      media: message.videoMessage
    };
  }

  if (message.audioMessage) {
    return {
      type: "audio",
      media: message.audioMessage
    };
  }

  if (message.documentMessage) {
    return {
      type: "document",
      media: message.documentMessage
    };
  }

  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📥 TELECHAJE MEDYA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function downloadMedia(media, type) {
  if (!media || !type) {
    return null;
  }

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 VOYE MEDYA NAN DM BOT LA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendMediaToBotDM({
  sock,
  type,
  media,
  buffer,
  caption
}) {
  const botJid =
    getBotJid(sock);

  if (!botJid) {
    return false;
  }

  if (type === "image") {
    await sock.sendMessage(
      botJid,
      {
        image: buffer,
        caption
      }
    );

    return true;
  }

  if (type === "video") {
    await sock.sendMessage(
      botJid,
      {
        video: buffer,
        caption,
        mimetype:
          media?.mimetype ||
          "video/mp4"
      }
    );

    return true;
  }

  if (type === "audio") {
    await sock.sendMessage(
      botJid,
      {
        audio: buffer,
        mimetype:
          media?.mimetype ||
          "audio/mpeg",
        ptt:
          media?.ptt || false
      }
    );

    return true;
  }

  if (type === "document") {
    await sock.sendMessage(
      botJid,
      {
        document: buffer,
        mimetype:
          media?.mimetype ||
          "application/octet-stream",
        fileName:
          media?.fileName ||
          "status"
      }
    );

    return true;
  }

  return false;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ SAVE STATUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function saveStatus(context) {
  const {
    sock,
    message
  } = context;

  if (!sock || !message?.message) {
    return false;
  }

  try {
    const mediaData =
      getMediaMessage(
        message.message
      );

    if (!mediaData) {
      return false;
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

    const caption =
      media.caption ||
      "🖼️ STATUS SAVED\n\n" +
      "🤖 TOPFEROS MD";

    return await sendMediaToBotDM({
      sock,
      type,
      media,
      buffer,
      caption
    });

  } catch (error) {
    console.error(
      "❌ STATUS SAVE ERROR:",
      error
    );

    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 DETEKTE STATUS OTOMATIKMAN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleAutoStatus(context) {
  const {
    message
  } = context;

  if (!message?.key) {
    return false;
  }

  if (
    message.key.remoteJid !==
    "status@broadcast"
  ) {
    return false;
  }

  return await saveStatus(
    context
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👁️ TRETE VIEW ONCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function processViewOnce(
  context,
  sourceMessage
) {
  const {
    sock
  } = context;

  if (!sock || !sourceMessage) {
    return false;
  }

  try {
    const viewOnce =
      getViewOnceMessage(
        sourceMessage
      );

    if (!viewOnce) {
      return false;
    }

    const mediaData =
      getMediaMessage(
        viewOnce
      );

    if (!mediaData) {
      return false;
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

    return await sendMediaToBotDM({
      sock,
      type,
      media,
      buffer,
      caption:
        "👁️ VIEW ONCE PROCESSED\n\n" +
        "🤖 TOPFEROS MD"
    });

  } catch (error) {
    console.error(
      "❌ VIEW ONCE ERROR:",
      error
    );

    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👁️ PREFIX VV2
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleVV2(context) {
  const {
    message
  } = context;

  if (!message) {
    return false;
  }

  const viewOnce =
    getViewOnceMessage(
      message
    );

  if (!viewOnce) {
    return false;
  }

  return await processViewOnce(
    context,
    message
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔁 REPLY / FORWARD VIEW ONCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleReplyViewOnce(context) {
  const {
    message
  } = context;

  if (!message?.message) {
    return false;
  }

  const contextInfo =
    message.message
      ?.extendedTextMessage
      ?.contextInfo;

  if (!contextInfo) {
    return false;
  }

  const quotedMessage =
    contextInfo.quotedMessage;

  if (!quotedMessage) {
    return false;
  }

  const viewOnce =
    getViewOnceMessage({
      message:
        quotedMessage
    });

  if (!viewOnce) {
    return false;
  }

  return await processViewOnce(
    context,
    {
      message:
        quotedMessage
    }
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 COMMAND STATUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message
  } = context;

  const chatId =
    message?.key?.remoteJid;

  if (!chatId) {
    return;
  }

  await sock.sendMessage(
    chatId,
    {
      text:
        "╭━━━〔 🖼️ STATUS & MEDIA 〕━━━╮\n" +
        "┃\n" +
        "┃ 🖼️ Status Saver: READY\n" +
        "┃ 📥 Save / Send: READY\n" +
        "┃\n" +
        "┃ 👁️ View Once: READY\n" +
        "┃ .vv2: READY\n" +
        "┃ 👁️ Reply / Forward: READY\n" +
        "┃\n" +
        "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯"
    },
    {
      quoted: message
    }
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  name: "status",

  aliases: [
    "savestatus",
    "vostatus"
  ],

  description:
    "Status Saver ak View Once system.",

  usage:
    ".status",

  execute,

  saveStatus,

  handleAutoStatus,

  handleVV2,

  handleReplyViewOnce,

  processViewOnce,

  getViewOnceMessage,

  getMediaMessage,

  downloadMedia
};