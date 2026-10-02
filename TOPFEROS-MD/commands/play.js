"use strict";

const config = require("../config");

function validUrl(value) {
  try {
    const url =
      new URL(
        String(value || "").trim()
      );

    return /^https?:$/.test(
      url.protocol
    );

  } catch {
    return false;
  }
}

function pickAudio(data) {

  const values = [
    data?.audioUrl,
    data?.audio_url,
    data?.downloadUrl,
    data?.download_url,
    data?.musicUrl,
    data?.music_url,
    data?.audio,
    data?.mediaUrl,
    data?.media_url,
    data?.url,
    data?.link,

    data?.result?.audioUrl,
    data?.result?.downloadUrl,
    data?.result?.url,

    data?.data?.audioUrl,
    data?.data?.downloadUrl,
    data?.data?.url
  ];

  for (const value of values) {
    if (validUrl(value)) {
      return value;
    }
  }

  return null;
}

async function execute({
  sock,
  message,
  text = ""
}) {
  const jid =
    message?.key?.remoteJid;

  const query =
    String(text || "").trim();

  if (!jid) return;

  if (!query) {
    return sock.sendMessage(
      jid,
      {
        text:
          "❌ Egzanp:\n\n" +
          ".play Faded"
      },
      {
        quoted: message
      }
    );
  }

  const apiUrl =
    String(
      config.music?.apiUrl || ""
    ).trim();

  const apiKey =
    String(
      config.music?.apiKey || ""
    ).trim();

  const timeout =
    Number(
      config.music?.timeout
    ) || 30000;

  if (!apiUrl || !apiKey) {
    return sock.sendMessage(
      jid,
      {
        text:
          "⚠️ MUSIC_API_URL ak " +
          "MUSIC_API_KEY pa configure.\n\n" +
          ".play bezwen yon Music API."
      },
      {
        quoted: message
      }
    );
  }

  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => controller.abort(),
      timeout
    );

  try {

    await sock
      .sendPresenceUpdate(
        "composing",
        jid
      )
      .catch(() => {});

    const response =
      await fetch(
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
              query,
              type: "audio"
            }),

          signal:
            controller.signal
        }
      );

    const raw =
      await response.text();

    let data;

    try {
      data =
        JSON.parse(raw);
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        `Music API HTTP ${response.status}: ` +
        raw.slice(0, 250)
      );
    }

    const audioUrl =
      pickAudio(data);

    if (!audioUrl) {
      throw new Error(
        "Music API did not return an audio URL"
      );
    }

    const title =
      data?.title ||
      data?.result?.title ||
      data?.data?.title ||
      query;

    await sock.sendMessage(
      jid,
      {
        text:
          `🎵 *${title}*\n\n` +
          `⏳ M ap voye audio a...`
      },
      {
        quoted: message
      }
    );

    await sock.sendMessage(
      jid,
      {
        audio: {
          url: audioUrl
        },

        mimetype:
          "audio/mpeg",

        fileName:
          `${String(title)
            .replace(
              /[\\/:*?"<>|]/g,
              ""
            )
            .slice(0, 70) ||
            "TOPFEROS-MD"}.mp3`
      },
      {
        quoted: message
      }
    );

  } catch (e) {

    console.error(
      "[PLAY]",
      e?.stack || e
    );

    await sock.sendMessage(
      jid,
      {
        text:
          "❌ .play pa jwenn audio a.\n\n" +
          "Verifye Music API URL/key ak " +
          "fòma response provider la."
      },
      {
        quoted: message
      }
    );

  } finally {

    clearTimeout(timer);

    await sock
      .sendPresenceUpdate(
        "paused",
        jid
      )
      .catch(() => {});
  }
}

module.exports = {
  name: "play",

  aliases: [
    "song",
    "music"
  ],

  description:
    "Chèche epi voye mizik.",

  usage:
    ".play <non mizik>",

  execute
};