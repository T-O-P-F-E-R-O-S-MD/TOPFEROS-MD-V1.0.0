"use strict";

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📥 TOPFEROS MD — DOWNLOAD COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isValidUrl(value) {
  if (!value || typeof value !== "string") {
    return false;
  }

  try {
    const parsed = new URL(value.trim());

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function cleanFileName(name) {
  return String(
    name || "TOPFEROS-DOWNLOAD"
  )
    .replace(/[\\/:*?"<>|]/g, "")
    .trim()
    .slice(0, 100);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 DETECT MEDIA TYPE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function detectMediaType(mediaUrl, result = {}) {
  const explicitType =
    result.type ||
    result.mediaType ||
    result.mimeType ||
    result.mime ||
    "";

  if (String(explicitType).trim()) {
    return String(explicitType)
      .toLowerCase()
      .trim();
  }

  const value =
    String(mediaUrl || "")
      .split("?")[0]
      .toLowerCase();

  if (/\.(mp4|mkv|mov|webm|avi|m4v)$/i.test(value)) {
    return "video";
  }

  if (/\.(mp3|m4a|aac|ogg|opus|wav|flac)$/i.test(value)) {
    return "audio";
  }

  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
    return "image";
  }

  return "document";
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏱️ FETCH WITH TIMEOUT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function fetchWithTimeout(
  url,
  options = {},
  timeout = 30000
) {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => controller.abort(),
      timeout
    );

  try {
    return await fetch(
      url,
      {
        ...options,
        signal:
          controller.signal
      }
    );
  } finally {
    clearTimeout(timer);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 EXECUTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message,
    text = ""
  } = context || {};

  const chatId =
    message?.key?.remoteJid;

  if (!sock || !message || !chatId) {
    return;
  }

  const url =
    String(text || "").trim();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ VERIFY URL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!url) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ *TOPFEROS MD*\n\n" +
          "Tanpri mete URL ou vle telechaje a apre `.download`.\n\n" +
          "Egzanp:\n" +
          "`.download https://example.com/file`"
      },
      {
        quoted: message
      }
    );

    return;
  }

  if (!isValidUrl(url)) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ *TOPFEROS MD*\n\n" +
          "URL ou mete a pa valid.\n\n" +
          "Tanpri verifye lyen an epi eseye ankò."
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

  const download =
    config.download || {};

  const apiUrl =
    String(
      download.apiUrl || ""
    ).trim();

  const apiKey =
    String(
      download.apiKey || ""
    ).trim();

  const timeout =
    Number(
      download.timeout
    ) || 30000;

  if (!apiUrl || !apiKey) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "⚠️ *TOPFEROS MD*\n\n" +
          "Download API pa configure.\n\n" +
          "Verifye `DOWNLOAD_API_URL` ak `DOWNLOAD_API_KEY` nan `.env`."
      },
      {
        quoted: message
      }
    );

    return;
  }

  if (!isValidUrl(apiUrl)) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ *TOPFEROS MD*\n\n" +
          "Download API URL la pa valid.\n\n" +
          "Verifye `DOWNLOAD_API_URL` nan `.env`."
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
      await fetchWithTimeout(
        apiUrl,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Accept":
              "application/json",

            "Authorization":
              `Bearer ${apiKey}`
          },

          body:
            JSON.stringify({
              url
            })
        },
        timeout
      );

    if (!apiResponse.ok) {
      throw new Error(
        `Download API HTTP ${apiResponse.status}`
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📥 READ API RESPONSE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let data;

    try {
      data =
        await apiResponse.json();
    } catch {
      throw new Error(
        "Download API pa retounen JSON valid."
      );
    }

    const result =
      data?.result ??
      data?.data ??
      data;

    if (
      !result ||
      typeof result !== "object"
    ) {
      throw new Error(
        "Download API pa retounen yon rezilta valid."
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📝 MEDIA INFORMATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const title =
      String(
        result.title ||
        result.name ||
        "TOPFEROS DOWNLOAD"
      ).trim();

    const mediaUrl =
      result.downloadUrl ||
      result.download_url ||
      result.mediaUrl ||
      result.media_url ||
      result.media ||
      result.fileUrl ||
      result.file_url ||
      result.url ||
      result.link;

    const mediaType =
      detectMediaType(
        mediaUrl,
        result
      );

    const mimetype =
      result.mimetype ||
      result.mimeType ||
      result.mime ||
      "application/octet-stream";

    const fileName =
      cleanFileName(
        result.fileName ||
        result.filename ||
        result.file_name ||
        title
      );

    if (!isValidUrl(mediaUrl)) {
      throw new Error(
        "Download API pa retounen yon URL medya valid."
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 SEND DOWNLOADED FILE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const developer =
      config.bot?.developer ||
      "TOPFEROS TECH";

    const caption =
      `📥 *${title}*\n\n` +
      `🚀 ${developer}`;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎵 AUDIO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      mediaType === "audio" ||
      mediaType.startsWith("audio/")
    ) {
      await sock.sendMessage(
        chatId,
        {
          audio: {
            url: mediaUrl
          },

          mimetype:
            mimetype.startsWith("audio/")
              ? mimetype
              : "audio/mpeg",

          fileName:
            fileName
              .toLowerCase()
              .endsWith(".mp3")
              ? fileName
              : `${fileName}.mp3`,

          caption
        },
        {
          quoted: message
        }
      );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎥 VIDEO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    } else if (
      mediaType === "video" ||
      mediaType.startsWith("video/")
    ) {
      await sock.sendMessage(
        chatId,
        {
          video: {
            url: mediaUrl
          },

          mimetype:
            mimetype.startsWith("video/")
              ? mimetype
              : "video/mp4",

          caption
        },
        {
          quoted: message
        }
      );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🖼️ IMAGE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    } else if (
      mediaType === "image" ||
      mediaType.startsWith("image/")
    ) {
      await sock.sendMessage(
        chatId,
        {
          image: {
            url: mediaUrl
          },

          mimetype:
            mimetype.startsWith("image/")
              ? mimetype
              : "image/jpeg",

          caption
        },
        {
          quoted: message
        }
      );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📄 DOCUMENT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    } else {
      await sock.sendMessage(
        chatId,
        {
          document: {
            url: mediaUrl
          },

          mimetype,

          fileName,

          caption
        },
        {
          quoted: message
        }
      );
    }

  } catch (error) {
    console.error(
      "❌ DOWNLOAD ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    try {
      await sock.sendMessage(
        chatId,
        {
          text:
`╭━━━〔 📥 DOWNLOAD 〕━━━╮
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
    } catch (_) {}

  } finally {
    try {
      await sock.sendPresenceUpdate(
        "paused",
        chatId
      );
    } catch (_) {}
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  name: "download",

  aliases: [
    "dl"
  ],

  description:
    "Telechaje yon medya oswa fichye apati yon URL.",

  usage:
    ".download <url>",

  execute
};