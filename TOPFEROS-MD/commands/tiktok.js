const axios = require('axios');

module.exports = {
  name: 'tiktok',
  aliases: ['tt', 'tiktokdl'],
  category: 'download',
  description: 'Download video from TikTok',

  async execute({ sock, msg, args }) {
    const url = args[0];

    if (!url) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ Utilisation : .tiktok <URL TikTok>' },
        { quoted: msg }
      );
    }

    if (!/^https?:\/\/([a-z0-9-]+\.)?tiktok\.com\//i.test(url)) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ Veuillez fournir une URL TikTok valide.' },
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
        { text: '⏳ Préparation de votre vidéo TikTok...' },
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

      const video = medias.find(media =>
        media?.type === 'video' ||
        media?.mime?.startsWith('video/') ||
        /\.(mp4|mkv|webm|mov)(\?|$)/i.test(media?.url || '')
      );

      if (!video?.url) {
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: '❌ Aucun fichier vidéo n’a été trouvé pour ce TikTok.' },
          { quoted: msg }
        );
      }

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          video: { url: video.url },
          mimetype: video.mime || 'video/mp4',
          fileName: `${video.title || 'tiktok-video'}.mp4`,
          caption: video.title
            ? `🎬 ${video.title}`
            : '🎬 Vidéo TikTok'
        },
        { quoted: msg }
      );

    } catch (error) {
      console.error(
        '[TIKTOK]',
        error?.response?.data || error.message
      );

      await sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ Impossible de télécharger cette vidéo TikTok pour le moment.' },
        { quoted: msg }
      );
    }
  }
};