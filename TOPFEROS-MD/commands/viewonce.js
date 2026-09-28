"use strict";

const {
  downloadContentFromMessage
} = require("@whiskeysockets/baileys");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👁️ TOPFEROS MD — VIEW ONCE SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// .vv2
// → Reply sou View Once
// → Dekode
// → Voye nan MENM CHAT la
//
// .viewonce
// → Reply sou View Once
// → Dekode
// → Voye nan DM BOT la
//
// ❌ status.js pa itilize pou View Once
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔓 UNWRAP VIEW ONCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function unwrapViewOnce(message) {
  let current =
    message?.message ||
    message ||
    null;

  let safety = 0;

  const wrappers = [
    "ephemeralMessage",
    "viewOnceMessage",
    "viewOnceMessageV2",
    "viewOnceMessageV2Extension",
    "documentWithCaptionMessage"
  ];

  while (
    current &&
    safety < 10
  ) {
    safety++;

    let found = false;

    for (const key of wrappers) {
      if (
        current[key] &&
        typeof current[key] === "object"
      ) {
        current =
          current[key]?.message ||
          current[key];

        found = true;
        break;
      }
    }

    if (!found) {
      break;
    }
  }

  return current;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 GET MEDIA TYPE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getViewOnceMedia(message) {
  const msg =
    unwrapViewOnce(message);

  if (!msg) {
    return null;
  }

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


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📥 DOWNLOAD VIEW ONCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function downloadViewOnce(
  media,
  type
) {
  if (!media || !type) {
    return null;
  }

  try {
    const stream =
      await downloadContentFromMessage(
        media,
        type
      );

    const chunks = [];

    for await (
      const chunk of stream
    ) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);

  } catch (error) {
    console.error(
      "❌ VIEW ONCE DOWNLOAD ERROR:",
      error?.message ||
      error
    );

    return null;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💬 GET QUOTED MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getQuotedMessage(message) {
  return (
    message
      ?.message
      ?.extendedTextMessage
      ?.contextInfo
      ?.quotedMessage ||

    message
      ?.message
      ?.imageMessage
      ?.contextInfo
      ?.quotedMessage ||

    message
      ?.message
      ?.videoMessage
      ?.contextInfo
      ?.quotedMessage ||

    message
      ?.message
      ?.documentMessage
      ?.contextInfo
      ?.quotedMessage ||

    null
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👁️ VV2
// DECODE → MENM CHAT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleVV2(context) {
  const {
    sock,
    message
  } = context || {};

  if (!sock || !message) {
    return false;
  }

  const chatId =
    message?.key?.remoteJid;

  if (!chatId) {
    return false;
  }

  try {
    const quoted =
      getQuotedMessage(
        message
      );

    if (!quoted) {
      return false;
    }

    const mediaInfo =
      getViewOnceMedia(
        quoted
      );

    if (!mediaInfo) {
      return false;
    }

    const buffer =
      await downloadViewOnce(
        mediaInfo.media,
        mediaInfo.type
      );

    if (!buffer) {
      return false;
    }

    const media =
      mediaInfo.media;

    const caption =
      media?.caption ||
      "";

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🖼️ IMAGE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      mediaInfo.type === "image"
    ) {
      await sock.sendMessage(
        chatId,
        {
          image: buffer,

          ...(caption
            ? {
                caption
              }
            : {})
        },
        {
          quoted: message
        }
      );

      return true;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎥 VIDEO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      mediaInfo.type === "video"
    ) {
      await sock.sendMessage(
        chatId,
        {
          video: buffer,

          ...(caption
            ? {
                caption
              }
            : {}),

          mimetype:
            media?.mimetype ||
            "video/mp4"
        },
        {
          quoted: message
        }
      );

      return true;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎵 AUDIO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      mediaInfo.type === "audio"
    ) {
      await sock.sendMessage(
        chatId,
        {
          audio: buffer,

          mimetype:
            media?.mimetype ||
            "audio/mp4",

          ptt:
            Boolean(
              media?.ptt
            )
        },
        {
          quoted: message
        }
      );

      return true;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📄 DOCUMENT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      mediaInfo.type === "document"
    ) {
      await sock.sendMessage(
        chatId,
        {
          document: buffer,

          mimetype:
            media?.mimetype ||
            "application/octet-stream",

          fileName:
            media?.fileName ||
            "TOPFEROS-MD-file",

          ...(caption
            ? {
                caption
              }
            : {})
        },
        {
          quoted: message
        }
      );

      return true;
    }

    return false;

  } catch (error) {
    console.error(
      "❌ VV2 HANDLER ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    return false;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 GET BOT JID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getBotJid(sock) {
  const id =
    sock?.user?.id;

  if (!id) {
    return null;
  }

  /*
   * Baileys ka konn bay:
   * 509xxxxxxxx:xx@s.whatsapp.net
   *
   * Nou retire device ID a pou DM la.
   */

  if (
    id.endsWith(
      "@s.whatsapp.net"
    )
  ) {
    const number =
      id.split("@")[0]
        .split(":")[0];

    return (
      number +
      "@s.whatsapp.net"
    );
  }

  return id;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📩 VIEWONCE → DM BOT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleReplyForward(context) {
  const {
    sock,
    message
  } = context || {};

  if (!sock || !message) {
    return false;
  }

  try {
    const quoted =
      getQuotedMessage(
        message
      );

    if (!quoted) {
      return false;
    }

    const mediaInfo =
      getViewOnceMedia(
        quoted
      );

    if (!mediaInfo) {
      return false;
    }

    const buffer =
      await downloadViewOnce(
        mediaInfo.media,
        mediaInfo.type
      );

    if (!buffer) {
      return false;
    }

    const botJid =
      getBotJid(sock);

    if (!botJid) {
      console.error(
        "❌ BOT JID PA JWENN."
      );

      return false;
    }

    const media =
      mediaInfo.media;

    const caption =
      media?.caption ||
      "";

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🖼️ IMAGE → BOT DM
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      mediaInfo.type === "image"
    ) {
      await sock.sendMessage(
        botJid,
        {
          image: buffer,

          ...(caption
            ? {
                caption
              }
            : {})
        }
      );

      return true;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎥 VIDEO → BOT DM
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      mediaInfo.type === "video"
    ) {
      await sock.sendMessage(
        botJid,
        {
          video: buffer,

          ...(caption
            ? {
                caption
              }
            : {}),

          mimetype:
            media?.mimetype ||
            "video/mp4"
        }
      );

      return true;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎵 AUDIO → BOT DM
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      mediaInfo.type === "audio"
    ) {
      await sock.sendMessage(
        botJid,
        {
          audio: buffer,

          mimetype:
            media?.mimetype ||
            "audio/mp4",

          ptt:
            Boolean(
              media?.ptt
            )
        }
      );

      return true;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📄 DOCUMENT → BOT DM
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      mediaInfo.type === "document"
    ) {
      await sock.sendMessage(
        botJid,
        {
          document: buffer,

          mimetype:
            media?.mimetype ||
            "application/octet-stream",

          fileName:
            media?.fileName ||
            "TOPFEROS-MD-file",

          ...(caption
            ? {
                caption
              }
            : {})
        }
      );

      return true;
    }

    return false;

  } catch (error) {
    console.error(
      "❌ VIEW ONCE DM ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    return false;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 .VIEWONCE COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message
  } = context || {};

  const chatId =
    message?.key?.remoteJid;

  if (
    !sock ||
    !message ||
    !chatId
  ) {
    return;
  }

  try {
    const processed =
      await handleReplyForward(
        context
      );

    if (processed) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "✅ View Once dekode epi voye nan DM bot la."
        },
        {
          quoted: message
        }
      );

      return;
    }

    await sock.sendMessage(
      chatId,
      {
        text:
          "👁️ *VIEW ONCE*\n\n" +
          "❌ Mwen pa jwenn yon View Once nan reply la.\n\n" +
          "Reply sou View Once la epi itilize:\n" +
          "`.viewonce`"
      },
      {
        quoted: message
      }
    );

  } catch (error) {
    console.error(
      "❌ VIEW ONCE COMMAND ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    try {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ Gen yon erè pandan m t ap trete View Once la."
        },
        {
          quoted: message
        }
      );
    } catch (_) {}
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  name: "viewonce",

  aliases: [
    "vreply",
    "vforward"
  ],

  description:
    "Dekode View Once epi voye li nan DM bot la.",

  usage:
    ".viewonce",

  execute,

  handleReplyForward,

  handleVV2
};