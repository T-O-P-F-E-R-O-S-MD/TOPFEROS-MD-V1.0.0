"use strict";

const config = require("../config");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎵 TOPFEROS MD — PLAY COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function execute(context) {
  const {
    sock,
    message,
    text = ""
  } = context;

  const chatId =
    message?.key?.remoteJid;

  const query =
    text.trim();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ VERIFY SEARCH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!query) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "❌ Tanpri ekri non mizik ou vle chèche a apre .play."
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

  const apiUrl =
    config.music?.apiUrl;

  const apiKey =
    config.music?.apiKey;

  if (!apiUrl || !apiKey) {
    await sock.sendMessage(
      chatId,
      {
        text:
          "⚠️ Music API pa configure nan config.js."
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
      await fetch(apiUrl, {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "Authorization":
            `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          query
        })
      });

    if (!apiResponse.ok) {
      throw new Error(
        `Music API Error: ${apiResponse.status}`
      );
    }

    const data =
      await apiResponse.json();

    const result =
      data.result ||
      data.data ||
      data;

    const title =
      result.title ||
      result.name ||
      query;

    const artist =
      result.artist ||
      result.author ||
      "Unknown Artist";

    const audioUrl =
      result.audioUrl ||
      result.downloadUrl ||
      result.url;

    if (!audioUrl) {
      throw new Error(
        "Music API pa retounen yon audio URL."
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎵 SEND AUDIO
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const developer =
      config.bot?.developer ||
      "TOPFEROS TECH";

    await sock.sendMessage(
      chatId,
      {
        audio: {
          url: audioUrl
        },

        mimetype:
          "audio/mpeg",

        fileName:
          `${title}.mp3`,

        caption: `╭━━━〔 🎵 PLAY 〕━━━╮
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

    await sock.sendPresenceUpdate(
      "paused",
      chatId
    );

  } catch (error) {
    console.error(
      "❌ PLAY ERROR:",
      error.message
    );

    await sock.sendPresenceUpdate(
      "paused",
      chatId
    );

    await sock.sendMessage(
      chatId,
      {
        text: `╭━━━〔 🎵 PLAY 〕━━━╮
┃
┃ ❌ Mwen pa kapab jwenn
┃    mizik la kounye a.
┃
┃ ⚠️ Verifye Music API a.
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
  name: "play",
  aliases: ["song", "music"],
  description: "Chèche epi voye yon mizik.",
  usage: ".play <non mizik>",
  execute
};