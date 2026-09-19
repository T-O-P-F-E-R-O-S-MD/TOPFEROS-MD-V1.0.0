"use strict";

let config = {};

try {
  config = require("../config");
} catch (error) {
  console.warn(
    "[TOPFEROS] Config pa disponib pou setting.js:",
    error?.message || error
  );
}

function getSettingsUrl() {
  return (
    process.env.SETTINGS_URL ||
    process.env.PANEL_URL ||
    config?.settingsUrl ||
    config?.panelUrl ||
    config?.web?.settingsUrl ||
    config?.web?.panelUrl ||
    "http://localhost:3000"
  );
}

async function execute({
  sock,
  message
}) {
  try {
    const chatId =
      message?.key?.remoteJid;

    if (!chatId) {
      return;
    }

    const settingsUrl =
      getSettingsUrl();

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

    console.log(
      `[TOPFEROS] .setting executed successfully`
    );
  } catch (error) {
    console.error(
      "[TOPFEROS] Erè .setting:",
      error?.message || error
    );
  }
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