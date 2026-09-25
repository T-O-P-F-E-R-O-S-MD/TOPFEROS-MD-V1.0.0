"use strict";

const config = require("../config");
const settingPanel = require("../src/settingPanel");

/* ======================================================
   HELPERS
====================================================== */

function cleanNumber(value) {
  return String(value || "")
    .split(":")[0]
    .split("@")[0]
    .replace(/\D/g, "");
}

/*
 * Jwenn vrè session bot la.
 *
 * Nou eseye:
 * 1. Socket la dirèkteman
 * 2. Number WhatsApp bot la
 */
function getRealSession(sock) {
  try {
    // --------------------------------------------------
    // 1. Try socket
    // --------------------------------------------------

    if (
      typeof settingPanel.getSessionBySocket === "function"
    ) {
      const session =
        settingPanel.getSessionBySocket(sock);

      if (session?.sessionId) {
        return session;
      }
    }

    // --------------------------------------------------
    // 2. Try WhatsApp number
    // --------------------------------------------------

    const socketNumber =
      cleanNumber(sock?.user?.id);

    if (
      socketNumber &&
      typeof settingPanel.getSessionByNumber === "function"
    ) {
      const session =
        settingPanel.getSessionByNumber(
          socketNumber
        );

      if (session?.sessionId) {
        return session;
      }
    }

    return null;

  } catch (error) {
    console.error(
      "[TOPFEROS] Erè jwenn session:",
      error?.stack ||
      error?.message ||
      error
    );

    return null;
  }
}

function onOff(value) {
  return value
    ? "✅ ON"
    : "❌ OFF";
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

/* ======================================================
   REAL PANEL LINK
====================================================== */

function getPanelLink(session) {
  /*
   * PRIORITY:
   * session.link = vrè link ki te kreye pou
   * session bot sa a.
   */

  if (
    session?.link &&
    /^https?:\/\//i.test(session.link)
  ) {
    return session.link;
  }

  /*
   * Fallback sèlman si session.link pa egziste.
   */

  const base =
    process.env.SETTINGS_PANEL_URL ||
    process.env.PANEL_URL ||
    config?.settingsUrl ||
    config?.panelUrl;

  if (!base || !session?.sessionId) {
    return "";
  }

  const cleanBase =
    String(base)
      .replace(/\/+$/, "");

  return (
    `${cleanBase}/?session=` +
    encodeURIComponent(
      session.sessionId
    )
  );
}

/* ======================================================
   MESSAGE 1
   BOT SETTINGS
====================================================== */

function buildSettingsMessage(
  info,
  settings
) {
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
    getMode(
      info,
      settings
    );

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
   MESSAGE 2
   ACCESS + PANEL LINK
====================================================== */

function buildAccessMessage(session) {
  const panelLink =
    getPanelLink(session);

  return `✧･ﾟ: *✧･ﾟ:* 🔐 *TOPFEROS MD V1.0.0* 🔐 *:･ﾟ✧*:･ﾟ✧

   🌸 *Owner Number*
   ╰┈➤ ${session?.number || "Not Set"}

   🌸 *Password*
   ╰┈➤ ${session?.code || "Not Set"}

   🌐 *Web Settings*
   ╰┈➤ ${panelLink || "Panel link unavailable"}

   🌐 *Web Contact Save*
   ╰┈➤ ${panelLink || "Panel link unavailable"}
╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈╯
   💖 *Keep Safe & Don't Share* 💖

======================
TECH By TOPFEROS MD`;
}

/* ======================================================
   COPY PASSWORD BUTTON
====================================================== */

async function sendCopyPassword(
  sock,
  chatId,
  session
) {
  const code =
    String(
      session?.code || ""
    ).trim();

  if (!code) {
    return;
  }

  try {
    /*
     * WhatsApp Native Flow:
     *
     * cta_copy
     *
     * Lè itilizatè a peze bouton an,
     * WhatsApp bay opsyon pou kopye code la.
     */

    await sock.sendMessage(
      chatId,
      {
        interactiveMessage: {
          body: {
            text:
              "🔐 *PASSWORD / SETTINGS CODE*\n\n" +
              "Peze bouton ki anba a pou kopye kòd panel lan."
          },
          footer: {
            text:
              "TOPFEROS MD • TOPFEROS TECH"
          },
          nativeFlowMessage: {
            buttons: [
              {
                name: "cta_copy",
                buttonParamsJson:
                  JSON.stringify({
                    display_text:
                      "📋 Copy Password",
                    id:
                      "copy_settings_password",
                    copy_code:
                      code
                  })
              }
            ]
          }
        }
      }
    );

    console.log(
      "[TOPFEROS] Copy Password button sent."
    );

    return true;

  } catch (error) {
    /*
     * Si vèsyon Baileys la pa sipòte
     * nativeFlowMessage la, pa fè .setting
     * kraze. Nou voye yon fallback.
     */

    console.warn(
      "[TOPFEROS] Copy button pa disponib:",
      error?.message || error
    );

    try {
      await sock.sendMessage(
        chatId,
        {
          text:
            `📋 *Password pou kopye:*\n\n` +
            `\`${code}\``
        }
      );
    } catch (fallbackError) {
      console.error(
        "[TOPFEROS] Copy fallback error:",
        fallbackError?.message ||
        fallbackError
      );
    }

    return false;
  }
}

/* ======================================================
   MESSAGE 3
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

async function execute({
  sock,
  message
}) {
  const chatId =
    message?.key?.remoteJid;

  if (!chatId) {
    return;
  }

  try {
    /* -----------------------------------------------
       GET REAL SESSION
    ----------------------------------------------- */

    const session =
      getRealSession(sock);

    if (!session?.sessionId) {
      console.error(
        "[TOPFEROS] .setting: session pa jwenn."
      );

      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *TOPFEROS MD*\n\nBot session lan pa jwenn. Tanpri verifye koneksyon bot la."
        },
        {
          quoted: message
        }
      );

      return;
    }

    /* -----------------------------------------------
       LOAD REAL SETTINGS
    ----------------------------------------------- */

    const loaded =
      settingPanel.loadSettings(
        session.sessionId
      );

    if (!loaded) {
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

    /* -----------------------------------------------
       MESSAGE 1
    ----------------------------------------------- */

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
     * Ti delay pou evite WhatsApp resevwa
     * tout mesaj yo egzakteman menm moman.
     */

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          350
        )
    );

    /* -----------------------------------------------
       MESSAGE 2
    ----------------------------------------------- */

    await sock.sendMessage(
      chatId,
      {
        text:
          buildAccessMessage(
            session
          )
      }
    );

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          350
        )
    );

    /* -----------------------------------------------
       COPY PASSWORD BUTTON
    ----------------------------------------------- */

    await sendCopyPassword(
      sock,
      chatId,
      session
    );

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          350
        )
    );

    /* -----------------------------------------------
       MESSAGE 3
    ----------------------------------------------- */

    await sock.sendMessage(
      chatId,
      {
        text:
          buildInstructionsMessage()
      }
    );

    console.log(
      `[TOPFEROS] .setting OK | session=${session.sessionId} | number=${session.number}`
    );

  } catch (error) {
    console.error(
      "[TOPFEROS] ERÈ .setting:",
      error?.stack ||
      error?.message ||
      error
    );

    /*
     * Si yon pati echwe, itilizatè a toujou
     * resevwa yon mesaj olye command lan san repons.
     */

    try {
      await sock.sendMessage(
        chatId,
        {
          text:
            "❌ *TOPFEROS MD*\n\nGen yon erè pandan m ap prepare Settings Panel la. Verifye logs Render yo."
        }
      );
    } catch {}
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