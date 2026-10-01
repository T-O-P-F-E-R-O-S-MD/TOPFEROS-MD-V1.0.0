"use strict";

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎵 TOPFEROS MD — PLAY COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isValidUrl(value) {
  if (!value || typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value.trim());

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function cleanFileName(name) {
  return String(name || "TOPFEROS-MD")
    .replace(/[\\/:*?"<>|]/g, "")
    .trim()
    .slice(0, 80);
}

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
// 🎯 EXTRACT AUDIO URL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getAudioUrl(result = {}) {
  const direct =
    result.audioUrl ||
    result.audio_url ||
    result.downloadUrl ||
    result.download_url ||
    result.musicUrl ||
    result.music_url ||
    result.audio ||
    result.mediaUrl ||
    result.media_url ||
    result.url ||
    result.link;

  if (isValidUrl(direct)) {
    return direct;
  }

  // Support links object
  if (
    result.links &&
    typeof result.links === "object"
  ) {
    const links = result.links;

    const link =
      links.audio ||
      links.mp3 ||
      links.download ||
      links.audioUrl ||
      links.downloadUrl ||
      links.url;

    if (isValidUrl(link)) {
      return link;
    }
  }

  // Support nested media object
  if (
    result.media &&
    typeof result.media === "object"
  ) {
    const media = result.media;

    const link =
      media.audio ||
      media.url ||
      media.downloadUrl ||
      media.download_url;

    if (isValidUrl(link)) {
      return link;
    }
  }

  return null;
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

  const query =
    String(text || "").trim();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ VERIFY SEARCH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!query) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ *TOPFEROS MD*\n\n" +
          "Tanpri ekri non mizik ou vle chèche a apre `.play`.\n\n" +
          "Egzanp: `.play Faded`"
      },
      {
        quoted: message
      }
    );

    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔐 MUSIC API CONFIGURATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const music =
    config.music || {};

  const apiUrl =
    String(
      music.apiUrl || ""
    ).trim();

  const apiKey =
    String(
      music.apiKey || ""
    ).trim();

  const timeout =
    Number(
      music.timeout
    ) || 30000;

  if (!apiUrl || !apiKey) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "⚠️ *TOPFEROS MD*\n\n" +
          "Music API pa configure.\n\n" +
          "Verifye `MUSIC_API_URL` ak `MUSIC_API_KEY` nan `.env`."
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
          "Music API URL la pa valid.\n\n" +
          "Verifye `MUSIC_API_URL` nan `.env`."
      },
      {
        quoted: message
      }
    );

    return;
  }

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔎 SEARCH MUSIC
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await sock.sendPresenceUpdate(
      "composing",
      chatId
    );

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
              query
            })
        },
        timeout
      );

    if (!apiResponse.ok) {
      throw new Error(
        `Music API HTTP ${apiResponse.status}`
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
        "Music API pa retounen JSON valid."
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
        "Music API pa retounen yon rezilta valid."
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎵 MUSIC INFORMATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const title =
      String(
        result.title ||
        result.name ||
        result.song ||
        result.track ||
        query
      ).trim();

    const artist =
      String(
        result.artist ||
        result.author ||
        result.artistName ||
        result.artist_name ||
        result.creator ||
        "Unknown Artist"
      ).trim();

    const audioUrl =
      getAudioUrl(result);

    if (!isValidUrl(audioUrl)) {
      throw new Error(
        "Music API pa retounen yon audio URL valid."
      );
    }

    const mimetype =
      String(
        result.mimetype ||
        result.mimeType ||
        result.mime ||
        "audio/mpeg"
      ).trim();

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎵 SEND AUDIO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const developer =
      config.bot?.developer ||
      "TOPFEROS TECH";

    const fileName =
      `${cleanFileName(title)}.mp3`;

    await sock.sendMessage(
      chatId,
      {
        audio: {
          url: audioUrl
        },

        mimetype:
          mimetype.startsWith("audio/")
            ? mimetype
            : "audio/mpeg",

        fileName,

        caption:
`╭━━━〔 🎵 PLAY 〕━━━╮
┃
┃ 🎶 *${title}*
┃ 👤 ${artist}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 ${developer}`
      },
      {
        quoted: message
      }
    );

  } catch (error) {
    console.error(
      "❌ PLAY ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    try {
      await sock.sendMessage(
        chatId,
        {
          text:
`╭━━━〔 🎵 PLAY 〕━━━╮
┃
┃ ❌ Mwen pa kapab jwenn
┃    mizik la kounye a.
┃
┃ ⚠️ Verifye Music API a
┃    oswa eseye ankò pita.
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
  name: "play",

  aliases: [
    "song",
    "music"
  ],

  description:
    "Chèche epi voye yon mizik.",

  usage:
    ".play <non mizik>",

  execute
};