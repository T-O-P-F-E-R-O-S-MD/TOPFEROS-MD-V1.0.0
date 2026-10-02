const axios = require('axios');

module.exports = {
  name: 'reddit',
  aliases: ['rd', 'redditdl'],
  category: 'download',
  description: 'Download media from Reddit',

  async execute({ sock, msg, args }) {
    const url = args[0];

    if (!url) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ Utilisation : .reddit <URL Reddit>' },
        { quoted: msg }
      );
    }

    if (!/^https?:\/\/(www\.|old\.)?reddit\.com\//i.test(url)) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ Veuillez fournir une URL Reddit valide.' },
        { quoted: msg }
      );
    }

    const apiUrl = process.env.DOWNLOAD_API_URL;
    const apiKey = process.env.DOWNLOAD_API_KEY;
    const timeout = Number(process.env.DOWNLOAD_API_TIMEOUT || 30000);

    if (!apiUrl || !apiKey) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ L’API de téléchargement n’est pas configurée sur le serveur.' },
        { quoted: msg }
      );
    }

    try {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: '⏳ Préparation de votre contenu Reddit...' },
        { quoted: msg }
      );

      const response = await axios.get(apiUrl, {
        params: { url },
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json'
        },
        timeout
      });

      const medias = Array.isArray(response.data?.medias)
        ? response.data.medias
        : [];

      const media = medias.find(item =>
        item?.url &&
        (
          item?.type === 'video' ||
          item?.type === 'image' ||
          item?.mime?.startsWith('video/') ||
          item?.mime?.startsWith('image/') ||
          /\.(mp4|mkv|webm|mov|jpg|jpeg|png|webp)(\?|$)/i.test(item.url)
        )
      );

      if (!media?.url) {
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: '❌ Aucun média n’a été trouvé pour cette publication Reddit.' },
          { quoted: msg }
        );
      }

      const isVideo =
        media.type === 'video' ||
        media.mime?.startsWith('video/') ||
        /\.(mp4|mkv|webm|mov)(\?|$)/i.test(media.url);

      if (isVideo) {
        await sock.sendMessage(
          msg.key.remoteJid,
          {
            video: { url: media.url },
            mimetype: media.mime || 'video/mp4',
            fileName: `${media.title || 'reddit-video'}.mp4`,
            caption: '🎬 Vidéo Reddit'
          },
          { quoted: msg }
        );
      } else {
        await sock.sendMessage(
          msg.key.remoteJid,
          {
            image: { url: media.url },
            mimetype: media.mime || 'image/jpeg',
            fileName: `${media.title || 'reddit-image'}.jpg`,
            caption: '🖼️ Image Reddit'
          },
          { quoted: msg }
        );
      }

    } catch (error) {
      console.error(
        '[REDDIT]',
        error?.response?.data || error.message
      );

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: '❌ Impossible de télécharger ce contenu Reddit pour le moment.'
        },
        { quoted: msg }
      );
    }
  }
};