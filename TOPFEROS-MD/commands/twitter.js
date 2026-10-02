"use strict";

const axios = require("axios");
const config = require("../config");

module.exports = {
  name: "twitter",
  aliases: ["x", "twitterdl", "xdl"],
  category: "downloader",
  description: "Télécharger une vidéo depuis Twitter/X.",
  usage: ".twitter <lien Twitter/X>",

  async execute({ sock, message, args, text }) {
    const jid = message.key.remoteJid;
    const url = String(text || args?.join(" ") || "").trim();

    if (!url) {
      return sock.sendMessage(
        jid,
        {
          text: "❌ Utilisation : *.twitter <lien Twitter/X>*"
        },
        { quoted: message }
      );
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(url);
    } catch {
      return sock.sendMessage(
        jid,
        { text: "❌ Le lien fourni est invalide." },
        { quoted: message }
      );
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    const isTwitter =
      hostname === "twitter.com" ||
      hostname.endsWith(".twitter.com") ||
      hostname === "x.com" ||
      hostname.endsWith(".x.com");

    if (!isTwitter) {
      return sock.sendMessage(
        jid,
        {
          text: "❌ Veuillez envoyer un lien Twitter/X valide."
        },
        { quoted: message }
      );
    }

    const apiUrl = config?.download?.apiUrl;
    const apiKey = config?.download?.apiKey;
    const timeout = Number(config?.download?.timeout) || 30000;

    if (!apiUrl) {
      return sock.sendMessage(
        jid,
        {
          text: "❌ Le service de téléchargement n'est pas configuré."
        },
        { quoted: message }
      );
    }

    await sock.sendMessage(
      jid,
      {
        text: "⏳ Téléchargement de la vidéo Twitter/X en cours..."
      },
      { quoted: message }
    );

    try {
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json"
      };

      if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      const response = await axios.post(
        apiUrl,
        {
          url,
          type: "video"
        },
        {
          headers,
          timeout,
          validateStatus: () => true
        }
      );

      if (response.status < 200 || response.status >= 300) {
        console.error(
          "TWITTER API ERROR:",
          response.status,
          response.data
        );

        return sock.sendMessage(
          jid,
          {
            text: "❌ Impossible de télécharger cette vidéo Twitter/X."
          },
          { quoted: message }
        );
      }

      const data = response.data || {};
      const result = data.result ?? data.data ?? data;

      const mediaUrl =
        result?.downloadUrl ||
        result?.download_url ||
        result?.mediaUrl ||
        result?.media_url ||
        result?.videoUrl ||
        result?.video_url ||
        result?.fileUrl ||
        result?.file_url ||
        result?.media ||
        result?.url ||
        result?.link;

      if (!mediaUrl || typeof mediaUrl !== "string") {
        console.error(
          "TWITTER INVALID RESPONSE:",
          JSON.stringify(data, null, 2)
        );

        return sock.sendMessage(
          jid,
          {
            text: "❌ Aucune vidéo téléchargeable n'a été trouvée."
          },
          { quoted: message }
        );
      }

      const mime =
        String(
          result?.mimeType ||
          result?.mime ||
          ""
        ).toLowerCase();

      const title =
        result?.title ||
        result?.filename ||
        "TOPFEROS MD";

      await sock.sendMessage(
        jid,
        {
          video: {
            url: mediaUrl
          },
          mimetype: mime || "video/mp4",
          fileName: `${title}.mp4`,
          caption: "✨ Téléchargé avec succès par *TOPFEROS MD*"
        },
        { quoted: message }
      );

    } catch (error) {
      console.error(
        "TWITTER ERROR:",
        error?.response?.data ||
        error?.stack ||
        error?.message ||
        error
      );

      const errorMessage =
        error?.code === "ECONNABORTED"
          ? "❌ Le téléchargement a pris trop de temps."
          : "❌ Une erreur est survenue pendant le téléchargement Twitter/X.";

      return sock.sendMessage(
        jid,
        { text: errorMessage },
        { quoted: message }
      );
    }
  }
};