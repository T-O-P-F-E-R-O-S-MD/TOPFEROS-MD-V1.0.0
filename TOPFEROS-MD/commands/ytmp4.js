"use strict";

const axios = require("axios");
const config = require("../config");

module.exports = {
  name: "ytmp4",
  aliases: ["ytvideo", "ytv"],
  category: "downloader",
  description: "Télécharger une vidéo YouTube.",
  usage: ".ytmp4 <lien YouTube>",

  async execute({ sock, message, args, text }) {
    const jid = message.key.remoteJid;
    const url = String(text || args?.join(" ") || "").trim();

    if (!url) {
      return sock.sendMessage(
        jid,
        {
          text: "❌ Utilisation : *.ytmp4 <lien YouTube>*"
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

    if (
      !hostname.includes("youtube.com") &&
      !hostname.includes("youtu.be")
    ) {
      return sock.sendMessage(
        jid,
        { text: "❌ Veuillez envoyer un lien YouTube valide." },
        { quoted: message }
      );
    }

    const apiUrl = config?.download?.apiUrl;
    const apiKey = config?.download?.apiKey;
    const timeout = Number(config?.download?.timeout) || 30000;

    if (!apiUrl) {
      return sock.sendMessage(
        jid,
        { text: "❌ Le service de téléchargement n'est pas configuré." },
        { quoted: message }
      );
    }

    await sock.sendMessage(
      jid,
      {
        text: "⏳ Téléchargement de la vidéo YouTube en cours..."
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
          "YTMP4 API ERROR:",
          response.status,
          response.data
        );

        return sock.sendMessage(
          jid,
          {
            text: "❌ Impossible de télécharger cette vidéo YouTube."
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
        result?.fileUrl ||
        result?.file_url ||
        result?.media ||
        result?.url ||
        result?.link;

      if (!mediaUrl || typeof mediaUrl !== "string") {
        console.error(
          "YTMP4 INVALID RESPONSE:",
          JSON.stringify(data, null, 2)
        );

        return sock.sendMessage(
          jid,
          {
            text: "❌ Aucune vidéo n'a été trouvée pour ce lien."
          },
          { quoted: message }
        );
      }

      const title =
        result?.title ||
        result?.filename ||
        "TOPFEROS MD";

      const mime =
        result?.mimeType ||
        result?.mime ||
        "video/mp4";

      await sock.sendMessage(
        jid,
        {
          video: { url: mediaUrl },
          mimetype: mime,
          fileName: `${title}.mp4`,
          caption: "✨ Téléchargé avec succès par *TOPFEROS MD*"
        },
        { quoted: message }
      );

    } catch (error) {
      console.error(
        "YTMP4 ERROR:",
        error?.response?.data ||
        error?.stack ||
        error?.message ||
        error
      );

      const errorMessage =
        error?.code === "ECONNABORTED"
          ? "❌ Le téléchargement a pris trop de temps."
          : "❌ Une erreur est survenue pendant le téléchargement vidéo.";

      return sock.sendMessage(
        jid,
        { text: errorMessage },
        { quoted: message }
      );
    }
  }
};