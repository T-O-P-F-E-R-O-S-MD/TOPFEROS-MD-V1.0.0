'use strict';

const pino = require('pino');

const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers
} = require('@whiskeysockets/baileys');

const sessionManager = require('./sessionManager');

let messageHandler = null;
try {
  messageHandler = require('./messageHandler');
} catch (error) {
  console.log('[TOPFEROS] messageHandler pa disponib pou kounye a.');
}

const sockets = new Map();
const reconnectTimers = new Map();
const startPromises = new Map();
const pairingRequests = new Map();

const logger = pino({
  level: process.env.LOG_LEVEL || 'silent'
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function normalizePhoneNumber(value) {
  return String(value || '').replace(/\D/g, '');
}

function isValidPhoneNumber(number) {
  return /^\d{8,15}$/.test(number);
}

function getSocket(sessionId) {
  return sockets.get(sessionId) || sessionManager.getSocket(sessionId) || null;
}

function clearReconnectTimer(sessionId) {
  const timer = reconnectTimers.get(sessionId);

  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(sessionId);
  }
}

async function saveCredentials(sessionId, saveCreds) {
  try {
    await saveCreds();
  } catch (error) {
    console.error(
      `[TOPFEROS] Erè pandan sauvegarde credentials ${sessionId}:`,
      error?.message || error
    );
  }
}

function getDisconnectCode(lastDisconnect) {
  return (
    lastDisconnect?.error?.output?.statusCode ||
    lastDisconnect?.error?.statusCode ||
    null
  );
}

function isLoggedOut(code) {
  return code === DisconnectReason.loggedOut;
}

function isRestartRequired(code) {
  return code === DisconnectReason.restartRequired;
}

function isConnectionClosed(code) {
  return code === DisconnectReason.connectionClosed;
}

function isBadSession(code) {
  return code === DisconnectReason.badSession;
}

function isLoggedOutOrBadSession(code) {
  return isLoggedOut(code) || isBadSession(code);
}

async function createSocket(sessionId, options = {}) {
  const {
    requestPairing = false,
    phoneNumber = null
  } = options;

  const existingSocket = sockets.get(sessionId);

  if (existingSocket && !existingSocket.ws?.isClosed) {
    return existingSocket;
  }

  const authDir = sessionManager.getAuthDir(sessionId);

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const socket = makeWASocket({
    auth: state,

    logger,

    printQRInTerminal: false,

    browser: Browsers.ubuntu('Chrome'),

    markOnlineOnConnect: false,

    syncFullHistory: false,

    shouldSyncHistoryMessage: () => false,

    generateHighQualityLinkPreview: false,

    connectTimeoutMs: 120000,

    defaultQueryTimeoutMs: 60000,

    keepAliveIntervalMs: 15000,

    retryRequestDelayMs: 2000,

    fireInitQueries: true,

    emitOwnEvents: false,

    shouldIgnoreJid: () => false
  });

  sockets.set(sessionId, socket);
  sessionManager.setSocket(sessionId, socket);

  socket.ev.on('creds.update', async () => {
    await saveCredentials(sessionId, saveCreds);
  });

  configureSocket(
    sessionId,
    socket,
    saveCreds,
    {
      requestPairing,
      phoneNumber
    }
  );

  return socket;
}

function configureSocket(
  sessionId,
  socket,
  saveCreds,
  pairingOptions = {}
) {
  const { requestPairing = false, phoneNumber = null } = pairingOptions;

  socket.ev.on('connection.update', async (update) => {
    const {
      connection,
      lastDisconnect,
      isNewLogin
    } = update;

    const currentSocket = sockets.get(sessionId);

    // Si ce socket n'est plus le socket actif, on l'ignore.
    if (currentSocket && currentSocket !== socket) {
      return;
    }

    if (connection === 'connecting') {
      console.log(
        `[TOPFEROS] ${sessionId}: connexion WhatsApp en cours...`
      );

      await sessionManager.updateSession(sessionId, {
        status: requestPairing ? 'pairing' : 'connecting',
        connected: false
      });

      return;
    }

    if (connection === 'open') {
      console.log(
        `[TOPFEROS] ${sessionId}: WhatsApp connecté avec succès.`
      );

      clearReconnectTimer(sessionId);

      let connectedNumber = null;

      try {
        connectedNumber =
          socket?.user?.id?.split(':')?.[0] ||
          socket?.user?.lid?.split(':')?.[0] ||
          null;
      } catch (_) {}

      await sessionManager.updateSession(sessionId, {
        status: 'connected',
        connected: true,
        number: connectedNumber || undefined,
        pairing: false,
        pairingCode: null,
        pairingStartedAt: null
      });

      pairingRequests.delete(sessionId);

      return;
    }

    if (connection === 'close') {
      const code = getDisconnectCode(lastDisconnect);

      console.log(
        `[TOPFEROS] ${sessionId}: connexion fermée. Code: ${code || 'inconnu'}`
      );

      if (sockets.get(sessionId) === socket) {
        sockets.delete(sessionId);
      }

      sessionManager.setSocket(sessionId, null);

      /*
       * 401 = session WhatsApp déconnectée.
       * On ne tente pas de reconnecter automatiquement.
       */
      if (isLoggedOutOrBadSession(code)) {
        console.log(
          `[TOPFEROS] ${sessionId}: session invalide/déconnectée.`
        );

        await sessionManager.updateSession(sessionId, {
          status: 'logged_out',
          connected: false,
          pairing: false,
          pairingCode: null,
          pairingStartedAt: null
        });

        pairingRequests.delete(sessionId);
        return;
      }

      /*
       * 515 = restartRequired.
       *
       * C'est important pour le pairing code :
       * WhatsApp peut fermer le socket après l'association,
       * puis demander une nouvelle connexion avec les credentials
       * déjà sauvegardés.
       */
      if (isRestartRequired(code)) {
        console.log(
          `[TOPFEROS] ${sessionId}: WhatsApp demande un redémarrage du socket.`
        );

        await sessionManager.updateSession(sessionId, {
          status: 'reconnecting',
          connected: false
        });

        scheduleReconnect(sessionId, 1500);
        return;
      }

      /*
       * 428 / connectionClosed et autres fermetures temporaires :
       * on laisse le système faire une reconnexion.
       */
      if (
        isConnectionClosed(code) ||
        code === 428 ||
        code === 408 ||
        code === 502 ||
        code === 503 ||
        code === 504
      ) {
        await sessionManager.updateSession(sessionId, {
          status: 'reconnecting',
          connected: false
        });

        scheduleReconnect(sessionId, 2500);
        return;
      }

      await sessionManager.updateSession(sessionId, {
        status: 'reconnecting',
        connected: false
      });

      scheduleReconnect(sessionId, 3000);
      return;
    }

    if (isNewLogin) {
      console.log(
        `[TOPFEROS] ${sessionId}: nouveau login WhatsApp détecté.`
      );
    }
  });

  /*
   * Certains événements de Baileys peuvent être nécessaires
   * au message handler du bot.
   */
  if (messageHandler) {
    try {
      if (typeof messageHandler === 'function') {
        socket.ev.on('messages.upsert', async (messageUpdate) => {
          try {
            await messageHandler(messageUpdate, socket, sessionId);
          } catch (error) {
            console.error(
              `[TOPFEROS] Erè message handler ${sessionId}:`,
              error?.message || error
            );
          }
        });
      } else if (typeof messageHandler.handleMessages === 'function') {
        socket.ev.on('messages.upsert', async (messageUpdate) => {
          try {
            await messageHandler.handleMessages(
              messageUpdate,
              socket,
              sessionId
            );
          } catch (error) {
            console.error(
              `[TOPFEROS] Erè message handler ${sessionId}:`,
              error?.message || error
            );
          }
        });
      }
    } catch (error) {
      console.error(
        `[TOPFEROS] Impossible d'initialiser message handler:`,
        error?.message || error
      );
    }
  }
}

function scheduleReconnect(sessionId, delay = 3000) {
  if (reconnectTimers.has(sessionId)) {
    return;
  }

  const session = sessionManager.getSession(sessionId);

  if (!session) {
    return;
  }

  /*
   * Si l'utilisateur poko fin antre nimewo a,
   * pa kreye socket ankò.
   */
  if (
    session.pairing === true &&
    !session.pairingCode &&
    session.status === 'pairing'
  ) {
    return;
  }

  const timer = setTimeout(async () => {
    reconnectTimers.delete(sessionId);

    try {
      const currentSession = sessionManager.getSession(sessionId);

      if (!currentSession) {
        return;
      }

      console.log(
        `[TOPFEROS] ${sessionId}: rekoneksyon ap kòmanse...`
      );

      await startSession(sessionId, {
        forceNew: true,
        requestPairing: false
      });
    } catch (error) {
      console.error(
        `[TOPFEROS] ${sessionId}: rekoneksyon echwe:`,
        error?.message || error
      );

      scheduleReconnect(sessionId, 5000);
    }
  }, delay);

  reconnectTimers.set(sessionId, timer);
}

async function startSession(sessionId, options = {}) {
  const {
    forceNew = false,
    requestPairing = false,
    phoneNumber = null
  } = options;

  if (!sessionId) {
    throw new Error('sessionId obligatwa.');
  }

  if (!forceNew) {
    const existingPromise = startPromises.get(sessionId);

    if (existingPromise) {
      return existingPromise;
    }
  }

  const promise = (async () => {
    if (forceNew) {
      const oldSocket = sockets.get(sessionId);

      if (oldSocket) {
        try {
          oldSocket.ev.removeAllListeners('connection.update');
        } catch (_) {}

        try {
          oldSocket.ev.removeAllListeners('creds.update');
        } catch (_) {}

        try {
          oldSocket.end(
            new Error('Restarting WhatsApp socket')
          );
        } catch (_) {}

        sockets.delete(sessionId);
        sessionManager.setSocket(sessionId, null);
      }
    }

    const socket = await createSocket(sessionId, {
      requestPairing,
      phoneNumber
    });

    return socket;
  })();

  startPromises.set(sessionId, promise);

  try {
    return await promise;
  } finally {
    startPromises.delete(sessionId);
  }
}

async function requestPairingCode(sessionId, phoneNumber) {
  const number = normalizePhoneNumber(phoneNumber);

  if (!isValidPhoneNumber(number)) {
    throw new Error(
      'Numéro WhatsApp invalide. Utilise le code pays + numéro, sans +, espaces ou tirets.'
    );
  }

  /*
   * Empêche deux demandes simultanées pour la même session.
   */
  if (pairingRequests.has(sessionId)) {
    return await pairingRequests.get(sessionId);
  }

  const requestPromise = (async () => {
    let session = sessionManager.getSession(sessionId);

    if (!session) {
      session = await sessionManager.createSession({
        sessionId,
        number
      });
    } else {
      await sessionManager.updateSession(sessionId, {
        number,
        status: 'pairing',
        connected: false,
        pairing: true,
        pairingCode: null,
        pairingStartedAt: Date.now()
      });
    }

    /*
     * Si un ancien socket existe, on le ferme.
     * Sa présence peut provoquer 428 Connection Closed.
     */
    const oldSocket = sockets.get(sessionId);

    if (oldSocket) {
      try {
        oldSocket.end(
          new Error('Preparing fresh pairing connection')
        );
      } catch (_) {}

      sockets.delete(sessionId);
      sessionManager.setSocket(sessionId, null);

      await sleep(800);
    }

    /*
     * On démarre un nouveau socket.
     *
     * IMPORTANT :
     * On ne fait PAS attendre connection === "open".
     * Le pairing code doit être demandé pendant le handshake.
     */
    const socket = await startSession(sessionId, {
      forceNew: true,
      requestPairing: true,
      phoneNumber: number
    });

    /*
     * Petit délai pour laisser le WebSocket initialiser
     * le handshake WhatsApp.
     */
    await sleep(1800);

    /*
     * Vérifie que ce socket est toujours celui utilisé.
     */
    if (sockets.get(sessionId) !== socket) {
      throw new Error(
        'La connexion WhatsApp a été remplacée avant la génération du code.'
      );
    }

    let pairingCode;

    try {
      pairingCode = await socket.requestPairingCode(number);
    } catch (error) {
      const message = error?.message || String(error);

      console.error(
        `[TOPFEROS] Erè requestPairingCode ${sessionId}:`,
        message
      );

      /*
       * Si 428 rive, on ne réutilise pas le socket cassé.
       * On le ferme et on indique clairement le problème.
       */
      try {
        socket.end(error);
      } catch (_) {}

      if (sockets.get(sessionId) === socket) {
        sockets.delete(sessionId);
      }

      sessionManager.setSocket(sessionId, null);

      await sessionManager.updateSession(sessionId, {
        status: 'pairing_error',
        connected: false,
        pairing: false,
        pairingCode: null,
        pairingStartedAt: null
      });

      throw new Error(
        `WhatsApp a fermé la connexion avant la génération du code (${message}).`
      );
    }

    if (!pairingCode) {
      throw new Error(
        'WhatsApp pa retounen okenn pairing code.'
      );
    }

    await sessionManager.updateSession(sessionId, {
      status: 'pairing',
      connected: false,
      pairing: true,
      pairingCode,
      pairingStartedAt: Date.now(),
      number
    });

    console.log(
      `[TOPFEROS] Pairing code ${sessionId}: ${pairingCode}`
    );

    return {
      sessionId,
      number,
      code: pairingCode
    };
  })();

  pairingRequests.set(sessionId, requestPromise);

  try {
    return await requestPromise;
  } finally {
    pairingRequests.delete(sessionId);
  }
}

async function stopSession(sessionId) {
  clearReconnectTimer(sessionId);

  const socket = sockets.get(sessionId);

  if (socket) {
    try {
      socket.end(
        new Error('Session stopped by user')
      );
    } catch (_) {}
  }

  sockets.delete(sessionId);
  sessionManager.setSocket(sessionId, null);

  await sessionManager.updateSession(sessionId, {
    status: 'disconnected',
    connected: false
  });
}

async function removeSession(sessionId) {
  clearReconnectTimer(sessionId);

  const socket = sockets.get(sessionId);

  if (socket) {
    try {
      socket.end(
        new Error('Session removed')
      );
    } catch (_) {}
  }

  sockets.delete(sessionId);
  pairingRequests.delete(sessionId);
  startPromises.delete(sessionId);

  sessionManager.setSocket(sessionId, null);

  await sessionManager.removeSession(sessionId);
}

async function restoreStoredSessions() {
  const sessions = sessionManager.getAllSessions();

  for (const session of sessions) {
    if (!session?.sessionId) {
      continue;
    }

    /*
     * Pa eseye restore yon session ki te nan mitan pairing
     * lè server la te fèmen.
     */
    if (session.pairing === true) {
      console.log(
        `[TOPFEROS] ${session.sessionId}: pairing abandone apre restart.`
      );

      await sessionManager.updateSession(session.sessionId, {
        status: 'disconnected',
        connected: false,
        pairing: false,
        pairingCode: null,
        pairingStartedAt: null
      });

      continue;
    }

    /*
     * Restore sèlman sessions ki te deja egziste.
     */
    try {
      await startSession(session.sessionId, {
        forceNew: true,
        requestPairing: false
      });

      console.log(
        `[TOPFEROS] Session restored: ${session.sessionId}`
      );
    } catch (error) {
      console.error(
        `[TOPFEROS] Restore failed ${session.sessionId}:`,
        error?.message || error
      );
    }

    await sleep(500);
  }
}

async function start() {
  console.log('[TOPFEROS] WhatsApp connection system started.');
}

async function stop() {
  for (const sessionId of sockets.keys()) {
    try {
      await stopSession(sessionId);
    } catch (error) {
      console.error(
        `[TOPFEROS] Erè pandan stop ${sessionId}:`,
        error?.message || error
      );
    }
  }

  for (const timer of reconnectTimers.values()) {
    clearTimeout(timer);
  }

  reconnectTimers.clear();
  sockets.clear();
  pairingRequests.clear();
  startPromises.clear();
}

module.exports = {
  start,
  stop,
  startSession,
  stopSession,
  removeSession,
  createSocket,
  requestPairingCode,
  restoreStoredSessions,
  getSocket,
  normalizePhoneNumber
};