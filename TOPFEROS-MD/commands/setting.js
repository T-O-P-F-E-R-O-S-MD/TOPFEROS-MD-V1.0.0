"use strict";

const config = (() => {
  try {
    return require("../config");
  } catch {
    return {};
  }
});

function getSettingsUrl() {
  const cfg = config();

  return (
    process.env.SETTINGS_URL ||
    process.env.PANEL_URL ||
    cfg?.settingsUrl ||
    cfg?.panelUrl ||
    cfg?.web?.settingsUrl ||
    cfg?.web?.panelUrl ||
    "http://localhost:3000"
  );
}

async function execute({ sock, message }) {
  const chatId = message?.key?.remoteJid;

  if (!chatId) return;

  const settingsUrl = getSettingsUrl();

  const text =
`╭━━━〔 ⚙️ TOPFEROS MD 〕━━━╮
┃
┃ ⚙️ *SETTINGS PANEL*
┃
┃ Jere paramèt bot la
┃ dirèkteman sou Web Panel la.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

🌐 *Settings Portal:*
${settingsUrl}

👇 Louvri link la pou antre nan panel settings lan.`;

  await sock.sendMessage(
    chatId,
    {
      text
    },
    {
      quoted: message
    }
  );
}

module.exports = {
  name: "setting",

  aliases: [
    "settings",
    "config",
    "configuration"
  ],

  description:
    "Montre link Settings Panel TOPFEROS MD la.",

  usage:
    ".setting",

  execute
};