"use strict";

const config = require("../config");
const settingPanel = require("../src/settingPanel");

/* ======================================================
   HELPERS
====================================================== */

function getSessionId(sock, message) {
  try {
    const remoteJid = message?.key?.remoteJid;

    // Try to find the bot panel session from its socket.
    const session = settingPanel.getSessionBySocket(sock);

    if (session?.sessionId) {
      return session.sessionId;
    }

    return null;
  } catch (error) {
    console.error(
      "[TOPFEROS] Erè jwenn sessionId:",
      error?.message || error
    );

    return null;
  }
}

function onOff(value) {
  return value ? "✅ ON" : "❌ OFF";
}

function getDeleteDestination(settings) {
  if (settings?.antiDeleteSameChat) {
    return "📥 INBOX";
  }

  if (settings?.antiDeleteDM) {
    return "📩 Sender";
  }

  return "❌ OFF";
}

function getMode(info, settings) {
  if (settings?.privateMode) {
    return "🔒 Private";
  }

  if (settings?.publicMode) {
    return "🌐 Public";
  }

  return info?.mode || "Unknown";
}

function getSettingsUrl(session) {
  /*
   * IMPORTANT:
   * The session parameter is necessary so the panel
   * knows which WhatsApp bot session is being edited.
   */

  if (session?.link) {
    return session.link;
  }

  const base =
    process.env.SETTINGS_PANEL_URL ||
    process.env.PANEL_URL ||
    config?.settingsUrl ||
    config?.panelUrl ||
    "https://bot.topferos.store/settings";

  return `${base.replace(/\/+$/, "")}/?session=${encodeURIComponent(
    session.sessionId
  )}`;
}


/* ======================================================
   FIRST MESSAGE
   REAL BOT SETTINGS
====================================================== */

function buildSettingsMessage(info, settings) {
  const botName =
    info?.name ||
    config?.bot?.name ||
    "TOPFEROS MD";

  const number =
    info?.number ||
    config?.owner?.number ||
    "Not Set";

  const prefix =
    info?.prefix ||
    config?.bot?.prefix ||
    ".";

  const mode =
    getMode(info, settings);

  return `╭━━━━━━━━━━━❀━━━━━━━━━━━╮
       🦁 *BOT SETTINGS* 🐑
      🐑 *${botName}* 🦁
╰━━━━━━━━━━━❀━━━━━━━━━━━╯

┌─────── ⋆⋅☆⋅⋆ ──────────┐
       ✨ *USER INFO* ✨
└────────── ⋆⋅☆⋅⋆ ──────────┘

   🎀 *Name*   » ${botName}
   📱 *Number* » ${number}
   🎂 *Age*    » 24
   📍 *From*   » TOPFEROS TECH
   🔤 *Prefix* » ${prefix}
   🌐 *Mode*   » ${mode}

┌─────── ⋆⋅☆⋅⋆ ──────────┐
      🛡️ *PROTECTION* 🛡️
└────────── ⋆⋅☆⋅⋆ ──────────┘

   🔗 Anti Link         » ${onOff(settings?.antiLink)}
   🤬 Anti Bad Words    » ❌ OFF
   📞 Anti Call         » ${onOff(settings?.antiCall)}
   ⛔ Auto Block        » ❌ OFF
   🧭 Anti Bugs         » ❌ OFF
   🛸 Anti Bot          » ${onOff(settings?.antiRobot)}
   ⚽ Anti Bot Action   » 💥 Delete

┌─────── ⋆⋅☆⋅⋆ ──────────┐
       🗑️ *DELETE LOGS* 🗑️
└────────── ⋆⋅☆⋅⋆ ──────────┘

   👀 Anti Delete       » ${onOff(settings?.antiDelete)}
   📤 Delete Send       » ${getDeleteDestination(settings)}

┌─────── ⋆⋅☆⋅⋆ ──────────┐
      📊 *STATUS SECTION* 📊
└────────── ⋆⋅☆⋅⋆ ──────────┘

   👁️ Status Read          » ${onOff(settings?.autoStatus)}
   ❤️ Status React         » ${onOff(settings?.statusReact)}
   😉 Status Custom React  » None
   💬 Auto Save Contact    » ❌ OFF
   📝 Contact Send Msg     » 📋 Default
   📤 Status Msg Send      » ${onOff(settings?.statusReply)}

┌─────── ⋆⋅☆⋅⋆ ──────────┐
       🤖 *AUTOMATION* 🤖
└────────── ⋆⋅☆⋅⋆ ──────────┘

   🟢 Always Online      » ${onOff(settings?.alwaysOnline)}
   ⌨️ Auto Typing        » ${onOff(settings?.fakeTyping)}
   🎙️ Auto Recording     » ${onOff(settings?.fakeRecording)}
   👁️ Auto Read Msg      » ${onOff(settings?.autoStatus)}

┌─────── ⋆⋅☆⋅⋆ ──────────┐
       ⚙️ *CONFIGS* ⚙️
└────────── ⋆⋅☆⋅⋆ ──────────┘

   💭 Custom Status  » Not Set
   📵 Exclude Nums   » None

┌─────── ⋆⋅☆⋅⋆ ──────────┐
       🖼️ *MEDIA URLS* 🖼️
└────────── ⋆⋅☆⋅⋆ ──────────┘

   🎯 Alive Logo  » ${config?.bot?.logo ? "✅ Set" : "❌ Not Set"}
   🎨 Menu Logo   » ${config?.bot?.logo ? "✅ Set" : "❌ Not Set"}
   👑 Owner Logo  » ${config?.bot?.logo ? "✅ Set" : "❌ Not Set"}

╭━━━━━━━━━━━❀━━━━━━━━━━━╮
  ✨ *Owner Only Access* ✨
     🌸 *Personal Chat* 🌸
╰━━━━━━━━━━━❀━━━━━━━━━━━╯
TOPFEROS-MD`;
}


/* ======================================================
   SECOND MESSAGE
   CODE + WEB LINKS
====================================================== */

function buildAccessMessage(session) {
  const settingsUrl =
    getSettingsUrl(session);

  const contactSaveUrl =
    `${settingsUrl.split("?")[0].replace(/\/+$/, "")}/contactsave`;

  return `✧･ﾟ: *✧･ﾟ:* 🔐 *TOPFEROS MD V1.0.0* 🔐 *:･ﾟ✧*:･ﾟ✧

   🌸 *Owner Number*
   ╰┈➤ ${session.number || "Not Set"}

   🌸 *Password*
   ╰┈➤ ${session.code}

   🌐 *Web Settings*
   ╰┈➤ ${settingsUrl}

   🌐 *Web Contact Save*
   ╰┈➤ ${contactSaveUrl}
╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈╯
   💖 *Keep Safe & Don't Share* 💖

======================
TECH By TOPFEROS MD`;
}


/* ======================================================
   THIRD MESSAGE
   3 LANGUAGES
====================================================== */

function buildInstructionsMessage() {
  return `🇺🇸 *ENGLISH*

To change your bot settings, please click the web link in the message above and go to the web page. Use the ownerNumber and password provided in the message above to log in and change your bot settings. After submitting your settings on the website, your bot will update the new settings within 3 minutes. ✅


🇫🇷 *FRANÇAIS*

Pour modifier les paramètres de votre bot, veuillez cliquer sur le lien web dans le message ci-dessus et accéder à la page web. Utilisez l’ownerNumber et le mot de passe indiqués dans le message ci-dessus pour vous connecter et modifier les paramètres de votre bot. Après avoir soumis les paramètres sur le site web, votre bot mettra à jour les nouveaux paramètres dans un délai de 3 minutes. ✅


🇪🇸 *ESPAÑOL*

Para cambiar la configuración de tu bot, haz clic en el enlace web del mensaje anterior y accede a la página web. Utiliza el ownerNumber y la contraseña que aparecen en el mensaje anterior para iniciar sesión y cambiar la configuración de tu bot. Después de enviar la configuración en el sitio web, tu bot actualizará los nuevos ajustes en un plazo de 3 minutos. ✅`;
}


/* ======================================================
   COMMAND
====================================================== */

async function execute({ sock, message }) {
  try {
    const chatId =
      message?.key?.remoteJid;

    if (!chatId) {
      return;
    }

    /*
     * Find the real WhatsApp session.
     */
    const sessionId =
      getSessionId(sock, message);

    if (!sessionId) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *TOPFEROS MD*\n\nBot session pa jwenn. Tanpri verifye koneksyon bot la."
        },
        {
          quoted: message
        }
      );

      return;
    }

    /*
     * Get REAL current settings.
     */
    const loaded =
      settingPanel.loadSettings(
        sessionId
      );

    const session =
      settingPanel.getSession(
        sessionId
      );

    if (!loaded || !session) {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *TOPFEROS MD*\n\nSettings session lan pa disponib."
        },
        {
          quoted: message
        }
      );

      return;
    }

    const info =
      loaded.botInformation || {};

    const settings =
      loaded.settings || {};

    /*
     * MESSAGE 1
     * Real settings.
     */
    await sock.sendMessage(
      chatId,
      {
        text:
          buildSettingsMessage(
            info,
            settings
          )
      },
      {
        quoted: message
      }
    );

    /*
     * MESSAGE 2
     * Owner number + password + web links.
     */
    await sock.sendMessage(
      chatId,
      {
        text:
          buildAccessMessage(
            session
          )
      }
    );

    /*
     * MESSAGE 3
     * English + French + Spanish.
     */
    await sock.sendMessage(
      chatId,
      {
        text:
          buildInstructionsMessage()
      }
    );

    console.log(
      `[TOPFEROS] .setting executed successfully for ${sessionId}`
    );

  } catch (error) {
    console.error(
      "[TOPFEROS] Erè .setting:",
      error?.stack ||
      error?.message ||
      error
    );
  }
}


/* ======================================================
   EXPORT
====================================================== */

module.exports = {
  name: "setting",

  aliases: [
    "settings",
    "config",
    "configuration"
  ],

  description:
    "Montre vrè settings bot la ak Settings Panel.",

  usage:
    ".setting",

  execute
};