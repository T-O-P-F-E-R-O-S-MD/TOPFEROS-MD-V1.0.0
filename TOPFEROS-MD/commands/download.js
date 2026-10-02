"use strict";

const config = require("../config");

const axios = require("axios");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📥 TOPFEROS MD — DOWNLOAD COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  name: "download",

  aliases: [
    "dl",
    "d"
  ],

  category: "downloader",

  description:
    "Télécharge une vidéo, une image, un audio ou un fichier depuis une URL.",

  usage:
    ".download <url>",

  async execute(context) {
    // Support both the current context style and the older style.
    const {
      sock,
      message,
      args = [],
      text = ""
    } = context || {};

    if (!sock || !message) {
      return;
    }

    const jid = message.key?.remoteJid;

    if (!jid) {
      return;
    }

    const url =
      String(
        text ||
        args.join(" ") ||
        ""
      ).trim();

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ URL MANQUANTE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!url) {
      return reply(
        sock,
        jid,
        "❌ Utilisation : .download <URL>",
        message
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔗 VÉRIFICATION URL
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!isValidUrl(url)) {
      return reply(
        sock,
        jid,
        "❌ Veuillez fournir une URL valide.",
        message
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔐 DOWNLOAD API
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
      return reply(
        sock,
        jid,
        "❌ L’API de téléchargement n’est pas configurée sur le serveur.",
        message
      );
    }

    if (!isValidUrl(apiUrl)) {
      return reply(
        sock,
        jid,
        "❌ L’URL de l’API de téléchargement est invalide.",
        message
      );
    }

    try {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ⏳ TRAITEMENT
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      try {
        await sock.sendPresenceUpdate(
          "composing",
          jid
        );
      } catch (_) {}

      await reply(
        sock,
        jid,
        "⏳ Préparation de votre téléchargement...",
        message
      );

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 📤 ENVOYER L'URL À L'API
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      const response =
        await axios.post(
          apiUrl,
          {
            url
          },
          {
            timeout,

            headers: {
              "Content-Type":
                "application/json",

              "Accept":
                "application/json",

              "Authorization":
                `Bearer ${apiKey}`
            }
          }
        );

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 📥 RÉCUPÉRER LA RÉPONSE
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      const data =
        response?.data || {};

      const result =
        data?.result ??
        data?.data ??
        data;

      if (
        !result ||
        typeof result !== "object"
      ) {
        throw new Error(
          "Réponse invalide de l’API."
        );
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🔎 TROUVER L'URL DU MÉDIA
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      const mediaUrl =
        result.downloadUrl ||
        result.download_url ||
        result.mediaUrl ||
        result.media_url ||
        result.fileUrl ||
        result.file_url ||
        result.media ||
        result.url ||
        result.link;

      if (!isValidUrl(mediaUrl)) {
        throw new Error(
          "L’API n’a pas retourné une URL média valide."
        );
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 📝 INFORMATIONS DU FICHIER
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      const title =
        cleanFileName(
          result.title ||
          result.name ||
          "TOPFEROS-DOWNLOAD"
        );

      const mime =
        String(
          result.mimetype ||
          result.mimeType ||
          result.mime ||
          ""
        ).toLowerCase();

      const mediaType =
        detectMediaType(
          mediaUrl,
          result
        );

      const fileName =
        cleanFileName(
          result.fileName ||
          result.filename ||
          result.file_name ||
          title
        );

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 📤 ENVOYER LE MÉDIA
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      const developer =
        config.bot?.developer ||
        "TOPFEROS TECH";

      const caption =
        `📥 ${title}\n\n` +
        `🚀 ${developer}`;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🎵 AUDIO
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      if (
        mediaType === "audio" ||
        mediaType.startsWith("audio/") ||
        mime.startsWith("audio/")
      ) {
        await sock.sendMessage(
          jid,
          {
            audio: {
              url: mediaUrl
            },

            mimetype:
              mime.startsWith("audio/")
                ? mime
                : "audio/mpeg",

            fileName:
              ensureExtension(
                fileName,
                ".mp3"
              )
          },
          {
            quoted: message
          }
        );

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🎥 VIDEO
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      } else if (
        mediaType === "video" ||
        mediaType.startsWith("video/") ||
        mime.startsWith("video/")
      ) {
        await sock.sendMessage(
          jid,
          {
            video: {
              url: mediaUrl
            },

            mimetype:
              mime.startsWith("video/")
                ? mime
                : "video/mp4",

            fileName:
              ensureExtension(
                fileName,
                ".mp4"
              ),

            caption
          },
          {
            quoted: message
          }
        );

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🖼️ IMAGE
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      } else if (
        mediaType === "image" ||
        mediaType.startsWith("image/") ||
        mime.startsWith("image/")
      ) {
        await sock.sendMessage(
          jid,
          {
            image: {
              url: mediaUrl
            },

            mimetype:
              mime.startsWith("image/")
                ? mime
                : "image/jpeg",

            fileName:
              ensureExtension(
                fileName,
                ".jpg"
              ),

            caption
          },
          {
            quoted: message
          }
        );

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 📄 DOCUMENT
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      } else {
        await sock.sendMessage(
          jid,
          {
            document: {
              url: mediaUrl
            },

            mimetype:
              mime ||
              "application/octet-stream",

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
        error?.response?.data ||
        error?.message ||
        error
      );

      await reply(
        sock,
        jid,
        "❌ Impossible de télécharger ce contenu pour le moment.",
        message
      );

    } finally {
      try {
        await sock.sendPresenceUpdate(
          "paused",
          jid
        );
      } catch (_) {}
    }
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔗 URL VALIDATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isValidUrl(value) {
  if (
    !value ||
    typeof value !== "string"
  ) {
    return false;
  }

  try {
    const parsed =
      new URL(
        value.trim()
      );

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );

  } catch {
    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 MEDIA TYPE DETECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function detectMediaType(
  mediaUrl,
  result = {}
) {
  const explicitType =
    result.type ||
    result.mediaType ||
    result.mimeType ||
    result.mime ||
    "";

  if (
    String(
      explicitType
    ).trim()
  ) {
    return String(
      explicitType
    )
      .toLowerCase()
      .trim();
  }

  const value =
    String(
      mediaUrl || ""
    )
      .split("?")[0]
      .toLowerCase();

  if (
    /\.(mp4|mkv|mov|webm|avi|m4v)$/i
      .test(value)
  ) {
    return "video";
  }

  if (
    /\.(mp3|m4a|aac|ogg|opus|wav|flac)$/i
      .test(value)
  ) {
    return "audio";
  }

  if (
    /\.(jpg|jpeg|png|gif|webp)$/i
      .test(value)
  ) {
    return "image";
  }

  return "document";
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧹 CLEAN FILE NAME
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function cleanFileName(name) {
  return String(
    name ||
    "TOPFEROS-DOWNLOAD"
  )
    .replace(
      /[\\/:*?"<>|]/g,
      ""
    )
    .trim()
    .slice(0, 100);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📎 ENSURE EXTENSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ensureExtension(
  fileName,
  extension
) {
  const clean =
    cleanFileName(
      fileName
    );

  if (
    clean
      .toLowerCase()
      .endsWith(
        extension
      )
  ) {
    return clean;
  }

  return (
    clean +
    extension
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💬 REPLY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function reply(
  sock,
  jid,
  text,
  quoted
) {
  return sock.sendMessage(
    jid,
    {
      text
    },
    {
      quoted
    }
  );
}