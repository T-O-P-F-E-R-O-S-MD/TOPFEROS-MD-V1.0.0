"use strict";

const axios = require("axios");
const config = require("../config");

module.exports = {
  name: "reddit",
  aliases: ["rd", "redditdl"],
  category: "downloader",
  description: "Télécharger une vidéo ou une image Reddit.",
  usage: ".reddit <lien Reddit>",

  async execute({ sock, message, args, text }) {
    const jid = message.key.remoteJid;
    const url = String(text || args?.join(" ") || "").trim();

    if (!url) {
      return sock.sendMessage(
        jid,
        {
          text: "❌ Utilisation : *.reddit <lien Reddit>*"
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

    const isReddit =
      hostname === "reddit.com" ||
      hostname.endsWith(".reddit.com") ||
      hostname === "redd.it";

    if (!isReddit) {
      return sock.sendMessage(
        jid,
        {
          text: "❌ Veuillez envoyer un lien Reddit valide."
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
        text: "⏳ Téléchargement du contenu Reddit en cours..."
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
          type: "auto"
        },
        {
          headers,
          timeout,
          validateStatus: () => true
        }
      );

      if (response.status < 200 || response.status >= 300) {
        console.error(
          "REDDIT API ERROR:",
          response.status,
          response.data
        );

        return sock.sendMessage(
          jid,
          {
            text: "❌ Impossible de télécharger ce contenu Reddit."
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
        result?.imageUrl ||
        result?.image_url ||
        result?.fileUrl ||
        result?.file_url ||
        result?.media ||
        result?.url ||
        result?.link;

      if (!mediaUrl || typeof mediaUrl !== "string") {
        console.error(
          "REDDIT INVALID RESPONSE:",
          JSON.stringify(data, null, 2)
        );

        return sock.sendMessage(
          jid,
          {
            text: "❌ Aucun fichier téléchargeable n'a été trouvé."
          },
          { quoted: message }
        );
      }

      const mime = String(
        result?.mimeType ||
        result?.mime ||
        ""
      ).toLowerCase();

      const type = String(
        result?.type ||
        ""
      ).toLowerCase();

      const title =
        result?.title ||
        result?.filename ||
        "TOPFEROS MD";

      if (
        type.includes("image") ||
        mime.startsWith("image/")
      ) {
        await sock.sendMessage(
          jid,
          {
            image: {
              url: mediaUrl
            },
            caption: "✨ Téléchargé avec succès par *TOPFEROS MD*"
          },
          { quoted: message }
        );

        return;
      }

      if (
        type.includes("audio") ||
        mime.startsWith("audio/")
      ) {
        await sock.sendMessage(
          jid,
          {
            audio: {
              url: mediaUrl
            },
            mimetype: mime || "audio/mpeg",
            fileName: `${title}.mp3`,
            ptt: false
          },
          { quoted: message }
        );

        return;
      }

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
        "REDDIT ERROR:",
        error?.response?.data ||
        error?.stack ||
        error?.message ||
        error
      );

      const errorMessage =
        error?.code === "ECONNABORTED"
          ? "❌ Le téléchargement a pris trop de temps."
          : "❌ Une erreur est survenue pendant le téléchargement Reddit.";

      return sock.sendMessage(
        jid,
        { text: errorMessage },
        { quoted: message }
      );
    }
  }
};