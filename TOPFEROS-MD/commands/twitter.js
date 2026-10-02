const axios = require('axios');

module.exports = {
  name: 'twitter',
  aliases: ['x', 'twitterdl', 'xdl'],
  category: 'download',
  description: 'Download media from X/Twitter',

  async execute({ sock, msg, args }) {
    const url = args[0];

    if (!url) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ Utilisation : .twitter <URL X/Twitter>' },
        { quoted: msg }
      );
    }

    if (!/^https?:\/\/(www\.)?(twitter\.com|x\.com)\//i.test(url)) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ Veuillez fournir une URL X/Twitter valide.' },
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
        { text: '⏳ Préparation de votre contenu X/Twitter...' },
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
          { text: '❌ Aucun média n’a été trouvé pour ce post.' },
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
            fileName: `${media.title || 'twitter-video'}.mp4`,
            caption: '🎬 Vidéo X/Twitter'
          },
          { quoted: msg }
        );
      } else {
        await sock.sendMessage(
          msg.key.remoteJid,
          {
            image: { url: media.url },
            mimetype: media.mime || 'image/jpeg',
            fileName: `${media.title || 'twitter-image'}.jpg`,
            caption: '🖼️ Image X/Twitter'
          },
          { quoted: msg }
        );
      }

    } catch (error) {
      console.error(
        '[TWITTER]',
        error?.response?.data || error.message
      );

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: '❌ Impossible de télécharger ce contenu X/Twitter pour le moment.'
        },
        { quoted: msg }
      );
    }
  }
};