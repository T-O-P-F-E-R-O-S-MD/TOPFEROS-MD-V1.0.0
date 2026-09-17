const { jidNormalizedUser } = require("@whiskeysockets/baileys");

module.exports = {
  name: "kick",
  aliases: ["remove"],
  description: "Retire yon manm nan gwoup la",
  usage: ".kick @user",
  category: "group",

  async execute({ sock, msg, args }) {
    const jid = msg?.key?.remoteJid;

    if (!jid || !jid.endsWith("@g.us")) {
      return sock.sendMessage(jid, {
        text: "❌ Cette commande est réservée aux groupes."
      });
    }

    const mentioned =
      msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    let target = mentioned[0];

    if (!target && args?.[0]) {
      const raw = String(args[0]).replace(/[^\d]/g, "");

      if (raw) {
        target = `${raw}@s.whatsapp.net`;
      }
    }

    if (!target) {
      return sock.sendMessage(jid, {
        text: "❌ Mentionne le membre à retirer."
      });
    }

    target = jidNormalizedUser(target);

    await sock.groupParticipantsUpdate(
      jid,
      [target],
      "remove"
    );

    return sock.sendMessage(jid, {
      text: "✅ Membre retiré du groupe."
    });
  }
};