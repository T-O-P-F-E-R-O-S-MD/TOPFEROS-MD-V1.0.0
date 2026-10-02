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

function pickMedia(data, type) {

  const values = [
    data?.downloadUrl,
    data?.download_url,
    data?.mediaUrl,
    data?.media_url,
    data?.url,
    data?.link,

    data?.result?.downloadUrl,
    data?.result?.download_url,
    data?.result?.url,

    data?.data?.downloadUrl,
    data?.data?.download_url,
    data?.data?.url
  ];

  if (type === "audio") {
    values.unshift(
      data?.audioUrl,
      data?.audio_url,
      data?.musicUrl,
      data?.music_url,
      data?.result?.audioUrl,
      data?.data?.audioUrl
    );
  }

  for (const value of values) {
    if (validUrl(value)) {
      return value;
    }
  }

  return null;
}

async function requestDownload(
  url,
  type,
  timeout
) {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => controller.abort(),
      timeout
    );

  try {

    const response =
      await fetch(
        config.download.apiUrl,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Accept":
              "application/json",

            "Authorization":
              `Bearer ${config.download.apiKey}`
          },

          body:
            JSON.stringify({
              url,
              type
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
        `Download API HTTP ${response.status}: ` +
        raw.slice(0, 250)
      );
    }

    return data;

  } finally {
    clearTimeout(timer);
  }
}

async function execute({
  sock,
  message,
  text = ""
}) {
  const jid =
    message?.key?.remoteJid;

  const url =
    String(text || "").trim();

  if (!jid) return;

  if (!url) {
    return sock.sendMessage(
      jid,
      {
        text:
          "❌ Voye URL la.\n\n" +
          "Egzanp:\n" +
          ".download https://..."
      },
      {
        quoted: message
      }
    );
  }

  if (!validUrl(url)) {
    return sock.sendMessage(
      jid,
      {
        text:
          "❌ URL la pa valid."
      },
      {
        quoted: message
      }
    );
  }

  if (
    !config.download?.apiUrl ||
    !config.download?.apiKey
  ) {
    return sock.sendMessage(
      jid,
      {
        text:
          "⚠️ DOWNLOAD_API_URL ak " +
          "DOWNLOAD_API_KEY pa configure " +
          "sou Render."
      },
      {
        quoted: message
      }
    );
  }

  const type =
    /\.(mp3|m4a|wav|aac|ogg)(\?|$)/i.test(url)
      ? "audio"
      : "video";

  try {

    const data =
      await requestDownload(
        url,
        type,
        Number(
          config.download.timeout
        ) || 30000
      );

    const media =
      pickMedia(
        data,
        type
      );

    if (!media) {
      throw new Error(
        "No media URL returned"
      );
    }

    if (type === "audio") {

      await sock.sendMessage(
        jid,
        {
          audio: {
            url: media
          },

          mimetype:
            "audio/mpeg"
        },
        {
          quoted: message
        }
      );

    } else {

      await sock.sendMessage(
        jid,
        {
          video: {
            url: media
          },

          mimetype:
            "video/mp4"
        },
        {
          quoted: message
        }
      );
    }

  } catch (e) {

    console.error(
      "[DOWNLOAD]",
      e?.stack || e
    );

    await sock.sendMessage(
      jid,
      {
        text:
          "❌ Download la echwe.\n\n" +
          "Verifye API provider la epi " +
          "asire response la gen " +
          "downloadUrl, mediaUrl oswa url."
      },
      {
        quoted: message
      }
    );
  }
}

module.exports = {
  name: "download",

  aliases: [
    "dl"
  ],

  description:
    "Download media soti nan URL.",

  usage:
    ".download <url>",

  execute
};