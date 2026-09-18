"use strict";

const makeWASocket =
  require("@whiskeysockets/baileys").default;

const {
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const path = require("path");
const fs = require("fs");

const sessionManager = require("./sessionManager");
const messageHandler = require("./messageHandler");

const active = new Map();

let welcome = null;
let goodbye = null;

try {
  welcome = require("../commands/welcome");
} catch {}

try {
  goodbye = require("../commands/goodbye");
} catch {}


/* ========================================================
   CLEAN NUMBER
======================================================== */

function cleanNumber(number) {
  return String(number || "").replace(/\D/g, "");
}


/* ========================================================
   CONNECTED SUCCESS MESSAGE
======================================================== */

async function sendConnectedMessage(sock, sessionId) {
  try {
    if (!sock?.user?.id) {
      console.warn(
        `⚠️ CONNECTED MESSAGE: user.id manke [${sessionId}]`
      );

      return;
    }

    const user = sock.user;

    const username =
      user.name ||
      user.verifiedName ||
      "Unknown";

    const number =
      String(user.id || "")
        .split(":")[0]
        .split("@")[0]
        .replace(/\D/g, "") ||
      "Unknown";


    const connectedMessage = `
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃      🌟 TOPFEROS MD 🌟       ┃
┃          V1.0.0              ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭───────❖ 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 ❖───────╮
│                              │
│ 🎉 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐅𝐔𝐋𝐋𝐘 🎉
│                              │
│ ⚡ Prefix   : .
│ 🌐 Mode     : Public
│ 👤 Username : ${username}
│ 📱 Number   : ${number}
│                              │
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭──────❖ 𝐅𝐄𝐀𝐓𝐔𝐑𝐄𝐒 ❖──────╮
│                            │
│ 💞 Allways Online
│ 🔌 Fake Typing
│ 🎤 Fake Recording
│ 🖇️ Auto Status Seen & Like
│ 😋 Auto Status Reply
│ 🌈 Auto React
│ 📞 Anti Call
│ 🤖 Mode Change
│ 📥 Media Download Command
│ 🎞️ Send Song For WhatsApp Channels
│ 🤖 Smart AI Command & Auto Chat
│ 🎀 & Many More Commands...
│                            │
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭──────❖ 𝐐𝐔𝐈𝐂𝐊 𝐌𝐄𝐍𝐔 ❖──────╮
│                              │
│ 📋 Tape .menu
│    ➜ Pou jwenn tout commandes yo
│
│ ⚙️ Tape .setting
│    ➜ Pou jwenn link pòtal setting lan
│                              │
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

        🦁 By TOPFEROS MD
`;


    const logoPath = path.join(
      __dirname,
      "..",
      "assets",
      "logo.png"
    );


    if (fs.existsSync(logoPath)) {
      const logo = fs.readFileSync(logoPath);

      await sock.sendMessage(
        user.id,
        {
          image: logo,
          caption: connectedMessage
        }
      );

    } else {
      console.warn(
        `⚠️ Logo pa jwenn: ${logoPath}`
      );

      await sock.sendMessage(
        user.id,
        {
          text: connectedMessage
        }
      );
    }


    console.log(
      `✅ CONNECTED MESSAGE SENT [${sessionId}]`
    );

  } catch (error) {
    console.error(
      `❌ CONNECTED MESSAGE ERROR [${sessionId}]`,
      error?.stack ||
      error?.message ||
      error
    );
  }
}


/* ========================================================
   CREATE SOCKET
======================================================== */

async function createSocket(sessionId) {

  if (active.has(sessionId)) {
    return active.get(sessionId);
  }


  const session =
    sessionManager.getSession(sessionId) ||
    sessionManager.restoreSession(sessionId);


  if (!session) {
    throw new Error(
      `Session introuvable: ${sessionId}`
    );
  }


  const authDir = path.join(
    __dirname,
    "..",
    "auth",
    "sessions",
    sessionId
  );


  const {
    state,
    saveCreds
  } = await useMultiFileAuthState(authDir);


  let version;

  try {

    const latest =
      await fetchLatestBaileysVersion();

    version = latest.version;

  } catch {

    version = undefined;
  }


  const sock = makeWASocket({

    ...(version
      ? { version }
      : {}),

    auth: {
      creds: state.creds,

      keys:
        makeCacheableSignalKeyStore(
          state.keys,
          pino({
            level: "silent"
          })
        )
    },

    logger: pino({
      level: "silent"
    }),

    printQRInTerminal: false,

    markOnlineOnConnect: false,

    generateHighQualityLinkPreview: false
  });


  active.set(
    sessionId,
    sock
  );


  sessionManager.setSocket(
    sessionId,
    sock
  );


  sessionManager.updateSession(
    sessionId,
    {
      status: "connecting",
      pairing: false
    }
  );


  /* ======================================================
     CREDENTIALS
  ====================================================== */

  sock.ev.on(
    "creds.update",
    saveCreds
  );


  /* ======================================================
     CONNECTION UPDATE
  ====================================================== */

  sock.ev.on(
    "connection.update",
    async ({
      connection,
      lastDisconnect
    }) => {

      try {

        /* ==================================================
           CONNECTED
        ================================================== */

        if (connection === "open") {

          sessionManager.updateSession(
            sessionId,
            {
              status: "connected",
              pairing: false,
              pairingCode: null
            }
          );


          sessionManager.endPairing(
            sessionId
          );


          console.log(
            `✅ WhatsApp CONNECTED: ${sessionId}`
          );


          /*
           * SEND CONNECTED MESSAGE
           * avèk logo + username + number
           */

          await sendConnectedMessage(
            sock,
            sessionId
          );
        }


        /* ==================================================
           CONNECTION CLOSED
        ================================================== */

        if (connection === "close") {

          active.delete(
            sessionId
          );


          sessionManager.setSocket(
            sessionId,
            null
          );


          const statusCode =
            lastDisconnect?.error?.output?.statusCode ??
            lastDisconnect?.error?.statusCode;


          const shouldReconnect =
            statusCode !==
            DisconnectReason.loggedOut;


          if (shouldReconnect) {

            sessionManager.updateSession(
              sessionId,
              {
                status: "reconnecting"
              }
            );


            setTimeout(() => {

              createSocket(
                sessionId
              ).catch(
                error =>
                  console.error(
                    `❌ RECONNECT ERROR [${sessionId}]`,
                    error
                  )
              );

            }, 3000);


          } else {

            sessionManager.updateSession(
              sessionId,
              {
                status: "logged_out",
                pairing: false,
                pairingCode: null
              }
            );
          }
        }

      } catch (error) {

        console.error(
          `❌ CONNECTION UPDATE ERROR [${sessionId}]`,
          error
        );
      }
    }
  );


  /* ========================================================
     MESSAGES
  ======================================================== */

  sock.ev.on(
    "messages.upsert",
    async (upsert) => {

      try {

        if (
          upsert?.type !==
          "notify"
        ) {
          return;
        }


        for (
          const msg of
          upsert.messages || []
        ) {

          if (
            !msg?.message
          ) {
            continue;
          }


          /*
           * messageHandler.js ekspòte:
           *
           * handleMessage
           * getMessageText
           *
           */

          if (
            messageHandler &&
            typeof messageHandler.handleMessage ===
              "function"
          ) {

            await messageHandler.handleMessage(
              sock,
              msg,
              sessionId
            );

          } else {

            console.error(
              `❌ handleMessage pa jwenn nan messageHandler.js [${sessionId}]`
            );
          }
        }

      } catch (error) {

        console.error(
          `❌ MESSAGE HANDLER ERROR [${sessionId}]`,
          error?.stack ||
          error?.message ||
          error
        );
      }
    }
  );


  /* ========================================================
     GROUP PARTICIPANTS
  ======================================================== */

  sock.ev.on(
    "group-participants.update",
    async (update) => {

      try {

        if (
          update?.action === "add" &&
          welcome?.sendWelcome
        ) {

          await welcome.sendWelcome(
            sock,
            update
          );
        }


        if (
          update?.action === "remove" &&
          goodbye?.sendGoodbye
        ) {

          await goodbye.sendGoodbye(
            sock,
            update
          );
        }

      } catch (error) {

        console.error(
          `❌ GROUP EVENT ERROR [${sessionId}]`,
          error
        );
      }
    }
  );


  return sock;
}


/* ========================================================
   START SESSION
======================================================== */

async function startSession(
  sessionId
) {

  return createSocket(
    sessionId
  );
}


/* ========================================================
   REQUEST PAIRING CODE
======================================================== */

async function requestPairingCode(
  number
) {

  const clean =
    cleanNumber(number);


  if (!clean) {
    throw new Error(
      "Numéro invalide"
    );
  }


  let session =
    sessionManager.getSessionByNumber(
      clean
    );


  if (session?.pairing) {

    const err =
      new Error(
        "PAIRING_IN_PROGRESS"
      );

    err.code =
      "PAIRING_IN_PROGRESS";

    throw err;
  }


  if (!session) {

    session =
      sessionManager.createSession(
        clean
      );

  } else {

    sessionManager.setNumber(
      session.sessionId,
      clean
    );
  }


  sessionManager.startPairing(
    session.sessionId
  );


  const sock =
    await createSocket(
      session.sessionId
    );


  const code =
    await sock.requestPairingCode(
      clean
    );


  sessionManager.setPairingCode(
    session.sessionId,
    code
  );


  return {

    sessionId:
      session.sessionId,

    number:
      clean,

    code,

    socket:
      sock
  };
}


/* ========================================================
   STOP SESSION
======================================================== */

async function stopSession(
  sessionId
) {

  const sock =
    active.get(sessionId) ||
    sessionManager.getSocket(
      sessionId
    );


  active.delete(
    sessionId
  );


  if (sock) {

    try {

      sock.end(
        new Error(
          "Session stopped"
        )
      );

    } catch {}
  }


  sessionManager.setSocket(
    sessionId,
    null
  );


  sessionManager.updateSession(
    sessionId,
    {
      status: "stopped",
      pairing: false,
      pairingCode: null
    }
  );


  return true;
}


/* ========================================================
   REMOVE SESSION
======================================================== */

async function removeSession(
  sessionId
) {

  await stopSession(
    sessionId
  );


  return sessionManager.removeSession(
    sessionId
  );
}


/* ========================================================
   RESTORE STORED SESSIONS
======================================================== */

async function restoreStoredSessions() {

  const ids =
    sessionManager.getStoredSessionIds();


  const restored = [];


  for (
    const id of ids
  ) {

    try {

      await createSocket(
        id
      );


      restored.push(
        id
      );

    } catch (error) {

      console.error(
        `❌ RESTORE ERROR [${id}]`,
        error
      );
    }
  }


  return restored;
}


/* ========================================================
   ATTACH MESSAGE LISTENER
======================================================== */

async function attachMessageListener(
  sock,
  sessionId
) {

  if (!sock) {
    return;
  }


  return sock;
}


/* ========================================================
   ATTACH CONNECTION LISTENER
======================================================== */

async function attachConnectionListener(
  sock,
  sessionId
) {

  if (!sock) {
    return;
  }


  return sock;
}


/* ========================================================
   START
======================================================== */

async function start() {

  return false;
}


/* ========================================================
   STOP
======================================================== */

async function stop() {

  for (
    const id of [
      ...active.keys()
    ]
  ) {

    await stopSession(
      id
    );
  }


  return true;
}


/* ========================================================
   EXPORTS
======================================================== */

module.exports = {

  createSocket,

  startSession,

  requestPairingCode,

  stopSession,

  removeSession,

  restoreStoredSessions,

  attachMessageListener,

  attachConnectionListener,

  start,

  stop
};