"use strict";

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📥 TOPFEROS MD — DOWNLOAD COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message,
    text = ""
  } = context;

  const chatId =
    message?.key?.remoteJid;

  const url =
    text.trim();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ VERIFY URL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!url) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ Tanpri mete URL ou vle telechaje a apre .download."
      },
      {
        quoted: message
      }
    );

    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔐 DOWNLOAD API CONFIGURATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const apiUrl =
    config.download?.apiUrl;

  const apiKey =
    config.download?.apiKey;

  if (!apiUrl || !apiKey) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "⚠️ Download API pa configure nan config.js."
      },
      {
        quoted: message
      }
    );

    return;
  }

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⏳ PROCESSING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendPresenceUpdate(
      "composing",
      chatId
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND URL TO DOWNLOAD API
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const apiResponse =
      await fetch(apiUrl, {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "Authorization":
            `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          url
        })
      });

    if (!apiResponse.ok) {
      throw new Error(
        `Download API Error: ${apiResponse.status}`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📥 READ API RESPONSE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const data =
      await apiResponse.json();

    const result =
      data.result ||
      data.data ||
      data;

    const title =
      result.title ||
      result.name ||
      "TOPFEROS DOWNLOAD";

    const mediaUrl =
      result.downloadUrl ||
      result.url ||
      result.mediaUrl;

    const mediaType =
      result.type ||
      result.mediaType ||
      "document";

    if (!mediaUrl) {
      throw new Error(
        "Download API pa retounen yon URL medya."
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND DOWNLOADED FILE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const developer =
      config.bot?.developer ||
      "TOPFEROS TECH";

    if (mediaType === "audio") {
      await sock.sendMessage(
        chatId,
        {
          audio: {
            url: mediaUrl
          },

          mimetype:
            result.mimetype ||
            "audio/mpeg",

          fileName:
            result.fileName ||
            `${title}.mp3`,

          caption:
            `📥 *${title}*\n\n🚀 ${developer}`
        },
        {
          quoted: message
        }
      );

    } else if (mediaType === "video") {
      await sock.sendMessage(
        chatId,
        {
          video: {
            url: mediaUrl
          },

          caption:
            `📥 *${title}*\n\n🚀 ${developer}`
        },
        {
          quoted: message
        }
      );

    } else if (mediaType === "image") {
      await sock.sendMessage(
        chatId,
        {
          image: {
            url: mediaUrl
          },

          caption:
            `📥 *${title}*\n\n🚀 ${developer}`
        },
        {
          quoted: message
        }
      );

    } else {
      await sock.sendMessage(
        chatId,
        {
          document: {
            url: mediaUrl
          },

          mimetype:
            result.mimetype ||
            "application/octet-stream",

          fileName:
            result.fileName ||
            title,

          caption:
            `📥 *${title}*\n\n🚀 ${developer}`
        },
        {
          quoted: message
        }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⏸️ STOP PROCESSING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendPresenceUpdate(
      "paused",
      chatId
    );

  } catch (error) {
    console.error(
      "❌ DOWNLOAD ERROR:",
      error.message
    );

    await sock.sendPresenceUpdate(
      "paused",
      chatId
    );

    await sock.sendMessage(
      chatId,
      {
        text: `╭━━━〔 📥 DOWNLOAD 〕━━━╮
┃
┃ ❌ Download lan echwe.
┃
┃ ⚠️ Verifye Download API a
┃    epi eseye ankò.
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 ${config.bot?.developer || "TOPFEROS TECH"}`
      },
      {
        quoted: message
      }
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  name: "download",
  aliases: ["dl"],
  description: "Telechaje yon medya oswa fichye apati yon URL.",
  usage: ".download <url>",
  execute
};