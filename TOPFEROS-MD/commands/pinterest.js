"use strict";

const axios = require("axios");
const config = require("../config");

module.exports = {
  name: "pinterest",
  aliases: ["pin", "pindl"],
  category: "downloader",
  description: "Télécharger une image ou une vidéo Pinterest.",
  usage: ".pinterest <lien Pinterest>",

  async execute({ sock, message, args, text }) {
    const jid = message.key.remoteJid;
    const url = String(text || args?.join(" ") || "").trim();

    if (!url) {
      return sock.sendMessage(
        jid,
        {
          text: "❌ Utilisation : *.pinterest <lien Pinterest>*"
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

    if (!hostname.includes("pinterest.com")) {
      return sock.sendMessage(
        jid,
        { text: "❌ Veuillez envoyer un lien Pinterest valide." },
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
        text: "⏳ Téléchargement du contenu Pinterest en cours..."
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
          "PINTEREST API ERROR:",
          response.status,
          response.data
        );

        return sock.sendMessage(
          jid,
          {
            text: "❌ Impossible de télécharger ce contenu Pinterest."
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
          "PINTEREST INVALID RESPONSE:",
          JSON.stringify(data, null, 2)
        );

        return sock.sendMessage(
          jid,
          {
            text: "❌ Aucun fichier n'a été trouvé pour ce lien."
          },
          { quoted: message }
        );
      }

      const title =
        result?.title ||
        result?.filename ||
        "TOPFEROS MD";

      const mime = String(
        result?.mimeType ||
        result?.mime ||
        ""
      ).toLowerCase();

      const type = String(
        result?.type ||
        ""
      ).toLowerCase();

      if (
        type.includes("image") ||
        mime.startsWith("image/")
      ) {
        await sock.sendMessage(
          jid,
          {
            image: { url: mediaUrl },
            caption: "✨ Téléchargé avec succès par *TOPFEROS MD*"
          },
          { quoted: message }
        );

        return;
      }

      await sock.sendMessage(
        jid,
        {
          video: { url: mediaUrl },
          mimetype: mime || "video/mp4",
          fileName: `${title}.mp4`,
          caption: "✨ Téléchargé avec succès par *TOPFEROS MD*"
        },
        { quoted: message }
      );

    } catch (error) {
      console.error(
        "PINTEREST ERROR:",
        error?.response?.data ||
        error?.stack ||
        error?.message ||
        error
      );

      const errorMessage =
        error?.code === "ECONNABORTED"
          ? "❌ Le téléchargement a pris trop de temps."
          : "❌ Une erreur est survenue pendant le téléchargement Pinterest.";

      return sock.sendMessage(
        jid,
        { text: errorMessage },
        { quoted: message }
      );
    }
  }
};