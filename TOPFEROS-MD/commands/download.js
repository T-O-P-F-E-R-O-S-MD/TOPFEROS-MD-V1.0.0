"use strict";

const axios = require("axios");
const config = require("../config");

module.exports = {
  name: "download",
  aliases: ["dl", "d"],
  category: "downloader",
  description: "Télécharger une vidéo, une image ou un audio depuis un lien.",
  usage: ".download <url>",

  async execute({ sock, message, args, text }) {
    const jid = message.key.remoteJid;
    const url = String(text || args?.join(" ") || "").trim();

    if (!url) {
      return sock.sendMessage(
        jid,
        {
          text: "❌ Utilisation : *.download <lien>*\n\nEnvoyez un lien valide à télécharger."
        },
        { quoted: message }
      );
    }

    try {
      new URL(url);
    } catch {
      return sock.sendMessage(
        jid,
        { text: "❌ Le lien fourni est invalide." },
        { quoted: message }
      );
    }

    await sock.sendMessage(
      jid,
      {
        text: "⏳ *TOPFEROS MD* traite votre lien. Veuillez patienter..."
      },
      { quoted: message }
    );

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
        { url },
        {
          headers,
          timeout,
          validateStatus: () => true
        }
      );

      if (response.status < 200 || response.status >= 300) {
        console.error(
          "DOWNLOAD API ERROR:",
          response.status,
          response.data
        );

        return sock.sendMessage(
          jid,
          {
            text: "❌ Le service de téléchargement n'a pas pu traiter ce lien."
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
          "DOWNLOAD API INVALID RESPONSE:",
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

      const type = String(
        result?.type ||
        result?.mimeType ||
        result?.mime ||
        ""
      ).toLowerCase();

      const mime = String(
        result?.mimeType ||
        result?.mime ||
        ""
      ).toLowerCase();

      const title =
        result?.title ||
        result?.filename ||
        "TOPFEROS MD";

      if (
        type.includes("audio") ||
        mime.startsWith("audio/")
      ) {
        await sock.sendMessage(
          jid,
          {
            audio: { url: mediaUrl },
            mimetype: mime || "audio/mpeg",
            fileName: `${title}.mp3`,
            ptt: false
          },
          { quoted: message }
        );

        return;
      }

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

      if (
        type.includes("video") ||
        mime.startsWith("video/")
      ) {
        await sock.sendMessage(
          jid,
          {
            video: { url: mediaUrl },
            mimetype: mime || "video/mp4",
            caption: "✨ Téléchargé avec succès par *TOPFEROS MD*"
          },
          { quoted: message }
        );

        return;
      }

      await sock.sendMessage(
        jid,
        {
          document: { url: mediaUrl },
          fileName: `${title}.bin`,
          mimetype: mime || "application/octet-stream",
          caption: "✨ Téléchargé avec succès par *TOPFEROS MD*"
        },
        { quoted: message }
      );

    } catch (error) {
      console.error(
        "DOWNLOAD ERROR:",
        error?.response?.data ||
        error?.stack ||
        error?.message ||
        error
      );

      const messageText =
        error?.code === "ECONNABORTED"
          ? "❌ Le téléchargement a pris trop de temps."
          : "❌ Une erreur est survenue pendant le téléchargement.";

      return sock.sendMessage(
        jid,
        { text: messageText },
        { quoted: message }
      );
    }
  }
};