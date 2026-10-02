const axios = require('axios');

module.exports = {
  name: 'pinterest',
  aliases: ['pin', 'pindl'],
  category: 'download',
  description: 'Download media from Pinterest',

  async execute({ sock, msg, args }) {
    const url = args[0];

    if (!url) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ Utilisation : .pinterest <URL Pinterest>' },
        { quoted: msg }
      );
    }

    if (!/^https?:\/\/([a-z0-9-]+\.)?pinterest\.(com|fr|ca|co\.uk)\//i.test(url)) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ Veuillez fournir une URL Pinterest valide.' },
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
        { text: '⏳ Préparation de votre contenu Pinterest...' },
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
          { text: '❌ Aucun média n’a été trouvé pour ce Pin Pinterest.' },
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
            fileName: `${media.title || 'pinterest-video'}.mp4`,
            caption: '🎬 Vidéo Pinterest'
          },
          { quoted: msg }
        );
      } else {
        await sock.sendMessage(
          msg.key.remoteJid,
          {
            image: { url: media.url },
            mimetype: media.mime || 'image/jpeg',
            fileName: `${media.title || 'pinterest-image'}.jpg`,
            caption: '🖼️ Image Pinterest'
          },
          { quoted: msg }
        );
      }

    } catch (error) {
      console.error(
        '[PINTEREST]',
        error?.response?.data || error.message
      );

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: '❌ Impossible de télécharger ce contenu Pinterest pour le moment.'
        },
        { quoted: msg }
      );
    }
  }
};