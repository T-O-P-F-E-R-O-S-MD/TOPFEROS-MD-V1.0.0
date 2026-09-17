async function sendWelcome(sock, update) {
  const groupJid = update?.id;
  const participants = update?.participants || [];

  if (!groupJid || !participants.length) {
    return;
  }

  let metadata;

  try {
    metadata = await sock.groupMetadata(groupJid);
  } catch (error) {
    metadata = null;
  }

  const groupName = metadata?.subject || "le groupe";

  for (const participant of participants) {
    const mention = participant;

    await sock.sendMessage(groupJid, {
      text: `👋 Bienvenue @${participant.split("@")[0]} dans *${groupName}* !`,
      mentions: [mention]
    });
  }
}

module.exports = {
  sendWelcome
};