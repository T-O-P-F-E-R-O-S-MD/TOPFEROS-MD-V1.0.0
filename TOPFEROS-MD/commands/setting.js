"use strict";

const config = require("../config");
const settingPanel = require("../src/settingPanel");

// ============================================================
// TOPFEROS MD
// SETTINGS COMMAND
// ============================================================

function cleanNumber(value) {
  return String(value || "")
    .split(":")[0]
    .split("@")[0]
    .replace(/\D/g, "");
}

// ============================================================
// GET REAL PANEL SESSION
// ============================================================

function getRealSession(sock) {
  try {
    // --------------------------------------------------------
    // 1. TRY SOCKET
    // --------------------------------------------------------

    if (
      typeof settingPanel.getSessionBySocket === "function"
    ) {
      const session =
        settingPanel.getSessionBySocket(sock);

      if (session?.sessionId) {
        console.log(
          `[TOPFEROS] Session found by socket: ${session.sessionId}`
        );

        return session;
      }
    }

    // --------------------------------------------------------
    // 2. TRY WHATSAPP NUMBER
    // --------------------------------------------------------

    const socketNumber =
      cleanNumber(sock?.user?.id);

    if (
      socketNumber &&
      typeof settingPanel.getSessionByNumber === "function"
    ) {
      const session =
        settingPanel.getSessionByNumber(socketNumber);

      if (session?.sessionId) {
        console.log(
          `[TOPFEROS] Session found by number: ${session.sessionId}`
        );

        return session;
      }
    }

    console.error(
      "[TOPFEROS] Pa jwenn panel session pou socket/number:",
      socketNumber || "UNKNOWN"
    );

    return null;

  } catch (error) {

    console.error(
      "[TOPFEROS] Erè jwenn panel session:",
      error?.stack ||
      error?.message ||
      error
    );

    return null;
  }
}

// ============================================================
// GET REAL PANEL LINK
// ============================================================

function getPanelLink(session) {

  if (
    session &&
    typeof session.link === "string" &&
    session.link.includes("/setting")
  ) {
    return session.link;
  }

  const panelUrl =
    process.env.SETTINGS_PANEL_URL ||
    process.env.PANEL_URL ||
    "https://topferos-md-v1-0-0.onrender.com";

  return `${panelUrl.replace(/\/+$/, "")}/setting`;
}

// ============================================================
// SETTINGS COMMAND
// ============================================================

async function execute(context) {

  const sock = context?.sock;
  const msg =
    context?.message ||
    context?.msg;

  const args =
    context?.args || []; {

  try {

    if (!sock) {
      console.error(
        "[TOPFEROS] Settings: socket manke."
      );

      return;
    }

    const jid =
      msg?.key?.remoteJid ||
      msg?.from ||
      msg?.chat;

    if (!jid) {
      console.error(
        "[TOPFEROS] Settings: JID manke."
      );

      return;
    }

    // --------------------------------------------------------
    // FIND REAL SESSION
    // --------------------------------------------------------

    const session =
      getRealSession(sock);

    if (!session) {

      await sock.sendMessage(
        jid,
        {
          text:
`❌ *TOPFEROS MD*

Pa jwenn session panel pou bot sa a.

Tanpri verifye ke bot la konekte byen epi eseye ankò.`
        }
      );

      return;
    }

    // --------------------------------------------------------
    // SESSION DATA
    // --------------------------------------------------------

    const sessionId =
      session.sessionId;

    const settings =
      session.settings || {};

    const botInformation =
      session.botInformation || {};

    const number =
      cleanNumber(
        session.number ||
        botInformation.number ||
        sock?.user?.id
      );

    const password =
      session.code ||
      "NOT_SET";

    // --------------------------------------------------------
    // REAL PANEL LINK
    // --------------------------------------------------------

    const panelLink =
      getPanelLink(session);

    // --------------------------------------------------------
    // SETTINGS STATUS
    // --------------------------------------------------------

    const status = value =>
      value ? "🟢 ON" : "🔴 OFF";

    const mode =
      settings.publicMode === false &&
      settings.privateMode === true
        ? "Private"
        : "Public";

    // --------------------------------------------------------
    // SETTINGS INFORMATION
    // --------------------------------------------------------

    const settingsMessage =
`╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃     🦁 *TOPFEROS MD*         ┃
┃        *SETTINGS*            ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

👤 *Bot Name:* ${botInformation.name || config.bot?.name || "TOPFEROS MD"}
📱 *Number:* ${number || "Not Set"}
⚡ *Prefix:* ${botInformation.prefix || config.bot?.prefix || "."}
🌐 *Mode:* ${mode}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚙️ *BOT SETTINGS*

🔵 Always Online : ${status(settings.alwaysOnline)}
⌨️ Fake Typing   : ${status(settings.fakeTyping)}
🎙️ Fake Recording: ${status(settings.fakeRecording)}
📞 Anti Call     : ${status(settings.antiCall)}
🗑️ Anti Delete   : ${status(settings.antiDelete)}
🛡️ Anti Spam     : ${status(settings.antiSpam)}
🔗 Anti Link     : ${status(settings.antiLink)}
🤖 Anti Robot    : ${status(settings.antiRobot)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 *STATUS SETTINGS*

👁️ Auto Status   : ${status(settings.autoStatus)}
💬 Status Reply  : ${status(settings.statusReply)}
❤️ Status Like   : ${status(settings.statusLike)}
⚡ Status React  : ${status(settings.statusReact)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 *GROUP SETTINGS*

🛡️ Group AntiSpam : ${status(settings.groupAntiSpam)}
🔗 Group AntiLink : ${status(settings.groupAntiLink)}
🗑️ Group AntiDelete: ${status(settings.groupAntiDelete)}
🔒 Group Close    : ${status(settings.groupClose)}
🔓 Group Open     : ${status(settings.groupOpen)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 AI Chat : ${status(settings.aiChat)}

╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃ 🦁 *By TOPFEROS MD TECH*     ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

    // --------------------------------------------------------
    // SEND SETTINGS INFORMATION
    // --------------------------------------------------------

    await sock.sendMessage(
      jid,
      {
        text: settingsMessage
      },
      {
        quoted: msg
      }
    );

    // --------------------------------------------------------
    // ACCESS INFORMATION
    // --------------------------------------------------------

    const accessMessage =
`╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃      🔐 *PANEL ACCESS*       ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📱 *Owner Number*
└──➤ ${number || "Not Set"}

🌸 *Password*
└──➤ ${password}

🌐 *Web Settings*
└──➤ ${panelLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💖 *Keep Safe & Don't Share* 💖

╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃ 🦁 *By TOPFEROS MD TECH*     ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

    // --------------------------------------------------------
    // SEND PANEL ACCESS
    // --------------------------------------------------------

    try {

      await sock.sendMessage(
        jid,
        {
          text: accessMessage
        },
        {
          quoted: msg
        }
      );

    } catch (error) {

      console.error(
        "[TOPFEROS] Access message error:",
        error?.stack ||
        error?.message ||
        error
      );

    }

    // --------------------------------------------------------
    // COPY PASSWORD BUTTON
    // --------------------------------------------------------

    try {

      await sock.sendMessage(
        jid,
        {
          text: "📋 *Copy Password*\n\n" + password
        },
        {
          quoted: msg
        }
      );

    } catch (error) {

      console.error(
        "[TOPFEROS] Copy password message error:",
        error?.stack ||
        error?.message ||
        error
      );

    }

    // --------------------------------------------------------
    // MULTI-LANGUAGE INSTRUCTIONS
    // --------------------------------------------------------

    const instructions =
`🇺🇸 *English*

To change your bot settings, please click the web link in the message above and go to the web page. Use the ownerNumber and password provided in the message above to log in and change your bot settings. After submitting your settings on the website, your bot will update the new settings within 3 minutes. ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🇫🇷 *Français*

Pour modifier les paramètres de votre bot, veuillez cliquer sur le lien web dans le message ci-dessus et accéder à la page web. Utilisez l’ownerNumber et le mot de passe indiqués dans le message ci-dessus pour vous connecter et modifier les paramètres de votre bot. Après avoir soumis les paramètres sur le site web, votre bot mettra à jour les nouveaux paramètres dans un délai de 3 minutes. ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🇪🇸 *Español*

Para cambiar la configuración de tu bot, haz clic en el enlace web del mensaje anterior y accede a la página web. Utiliza el ownerNumber y la contraseña que aparecen en el mensaje anterior para iniciar sesión y cambiar la configuración de tu bot. Después de enviar la configuración en el sitio web, tu bot actualizará los nuevos ajustes en un plazo de 3 minutos. ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🦁 *By TOPFEROS MD TECH*`;

    await sock.sendMessage(
      jid,
      {
        text: instructions
      },
      {
        quoted: msg
      }
    );

    console.log(
      `[TOPFEROS] Settings sent successfully | Session: ${sessionId} | Number: ${number}`
    );

  } catch (error) {

    console.error(
      "[TOPFEROS] SETTINGS COMMAND ERROR:",
      error?.stack ||
      error?.message ||
      error
    );

    try {

      const jid =
        msg?.key?.remoteJid ||
        msg?.from ||
        msg?.chat;

      if (jid) {

        await sock.sendMessage(
          jid,
          {
            text:
`❌ *TOPFEROS MD*

Yon erè rive pandan mwen t ap ouvri settings yo.

Tanpri eseye ankò.`
          }
        );

      }

    } catch {}

  }
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  name: "setting",
  aliases: [
    "settings"
  ],
  execute
};