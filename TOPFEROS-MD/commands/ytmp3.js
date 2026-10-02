const axios = require('axios');

module.exports = {
  name: 'ytmp3',
  aliases: ['ytaudio', 'yta'],
  category: 'download',
  description: 'Download audio from YouTube',

  async execute({ sock, msg, args }) {
    const url = args[0];

    if (!url) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ Utilisation : .ytmp3 <URL YouTube>' },
        { quoted: msg }
      );
    }

    if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url)) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ Veuillez fournir une URL YouTube valide.' },
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
        { text: '⏳ Préparation de votre audio...' },
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

      const audio = medias.find(media =>
        media?.type === 'audio' ||
        media?.mime?.startsWith('audio/') ||
        /\.(mp3|m4a|aac|ogg|wav)(\?|$)/i.test(media?.url || '')
      );

      if (!audio?.url) {
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: '❌ Aucun fichier audio n’a été trouvé pour cette vidéo.' },
          { quoted: msg }
        );
      }

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          audio: { url: audio.url },
          mimetype: audio.mime || 'audio/mpeg',
          fileName: `${audio.title || 'youtube-audio'}.mp3`
        },
        { quoted: msg }
      );

    } catch (error) {
      console.error(
        '[YTMP3]',
        error?.response?.data || error.message
      );

      await sock.sendMessage(
        msg.key.remoteJid,
        { text: '❌ Impossible de télécharger cet audio pour le moment.' },
        { quoted: msg }
      );
    }
  }
};