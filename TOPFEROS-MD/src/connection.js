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
  console.log('[TOPFEROS] messageHandler pa disponib.');
}

const sockets = new Map();
const reconnectTimers = new Map();
const startPromises = new Map();
const pairingRequests = new Map();

const logger = pino({
  level: process.env.LOG_LEVEL || 'silent'
});

const sleep = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

function normalizePhoneNumber(value) {
  return String(value || '').replace(/\D/g, '');
}

function isValidPhoneNumber(number) {
  return /^\d{8,15}$/.test(number);
}

function getSocket(sessionId) {
  return (
    sockets.get(sessionId) ||
    sessionManager.getSocket(sessionId) ||
    null
  );
}

function clearReconnectTimer(sessionId) {
  const timer = reconnectTimers.get(sessionId);

  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(sessionId);
  }
}

function getDisconnectCode(lastDisconnect) {
  return (
    lastDisconnect?.error?.output?.statusCode ||
    lastDisconnect?.error?.statusCode ||
    null
  );
}

function isTemporaryDisconnect(code) {
  return [
    DisconnectReason.connectionClosed,
    DisconnectReason.connectionLost,
    DisconnectReason.timedOut,
    408,
    428,
    502,
    503,
    504
  ].includes(code);
}

async function createSocket(sessionId, options = {}) {
  const {
    requestPairing = false
  } = options;

  const existingSocket = sockets.get(sessionId);

  /*
   * Pa kreye 2 socket pou menm session nan.
   */
  if (existingSocket) {
    return existingSocket;
  }

  const authDir =
    sessionManager.getAuthDir(sessionId);

  const {
    state,
    saveCreds
  } = await useMultiFileAuthState(authDir);

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

    retryRequestDelayMs: 2000
  });

  sockets.set(sessionId, socket);

  sessionManager.setSocket(
    sessionId,
    socket
  );

  socket.ev.on(
    'creds.update',
    async () => {
      try {
        await saveCreds();
      } catch (error) {
        console.error(
          `[TOPFEROS] Erè sauvegarde credentials ${sessionId}:`,
          error?.message || error
        );
      }
    }
  );

  configureSocket(
    sessionId,
    socket,
    {
      requestPairing
    }
  );

  return socket;
}

function configureSocket(
  sessionId,
  socket,
  options = {}
) {
  const {
    requestPairing = false
  } = options;

  socket.ev.on(
    'connection.update',
    async update => {
      const {
        connection,
        lastDisconnect,
        isNewLogin
      } = update;

      /*
       * Si yon lòt socket vin aktif pou session sa,
       * cet ancien socket pa dwe manyen nouvo socket la.
       */
      if (sockets.get(sessionId) !== socket) {
        return;
      }

      if (connection === 'connecting') {
        console.log(
          `[TOPFEROS] ${sessionId}: connexion en cours...`
        );

        await sessionManager.updateSession(
          sessionId,
          {
            status: requestPairing
              ? 'pairing'
              : 'connecting',

            connected: false
          }
        );

        return;
      }

      if (connection === 'open') {
        console.log(
          `[TOPFEROS] ${sessionId}: WhatsApp connecté.`
        );

        clearReconnectTimer(sessionId);

        let connectedNumber = null;

        try {
          connectedNumber =
            socket?.user?.id
              ?.split(':')[0] ||
            socket?.user?.lid
              ?.split(':')[0] ||
            null;
        } catch (_) {}

        await sessionManager.updateSession(
          sessionId,
          {
            status: 'connected',

            connected: true,

            number:
              connectedNumber || undefined,

            pairing: false,

            pairingCode: null,

            pairingStartedAt: null
          }
        );

        pairingRequests.delete(
          sessionId
        );

        return;
      }

      if (connection === 'close') {
        const code =
          getDisconnectCode(
            lastDisconnect
          );

        console.log(
          `[TOPFEROS] ${sessionId}: connexion fermée. Code: ${code || 'inconnu'}`
        );

        /*
         * Retire socket la sèlman si se socket aktyèl la.
         */
        if (
          sockets.get(sessionId) === socket
        ) {
          sockets.delete(sessionId);

          sessionManager.setSocket(
            sessionId,
            null
          );
        }

        const session =
          sessionManager.getSession(
            sessionId
          );

        /*
         * ======================================================
         * IMPORTANT:
         * Si pairing code a poko fini ap mande,
         * PA kreye yon nouvo socket.
         *
         * Se sa ki te lakòz:
         * "La connexion WhatsApp a été remplacée..."
         * ======================================================
         */
        if (
          pairingRequests.has(sessionId)
        ) {
          console.log(
            `[TOPFEROS] ${sessionId}: pairing request aktif, pa lanse reconnect.`
          );

          await sessionManager.updateSession(
            sessionId,
            {
              status: 'pairing',
              connected: false
            }
          );

          return;
        }

        /*
         * Logged out / bad session.
         */
        if (
          code ===
            DisconnectReason.loggedOut ||
          code ===
            DisconnectReason.badSession
        ) {
          await sessionManager.updateSession(
            sessionId,
            {
              status: 'logged_out',

              connected: false,

              pairing: false,

              pairingCode: null,

              pairingStartedAt: null
            }
          );

          return;
        }

        /*
         * 515 = restartRequired.
         *
         * Lè pairing fin fèt, WhatsApp ka mande
         * socket la rekòmanse ak credentials yo.
         */
        if (
          code ===
          DisconnectReason.restartRequired
        ) {
          console.log(
            `[TOPFEROS] ${sessionId}: WhatsApp mande restart socket.`
          );

          await sessionManager.updateSession(
            sessionId,
            {
              status: 'reconnecting',
              connected: false
            }
          );

          scheduleReconnect(
            sessionId,
            1500
          );

          return;
        }

        /*
         * Erè koneksyon tanporè.
         */
        if (
          isTemporaryDisconnect(code)
        ) {
          await sessionManager.updateSession(
            sessionId,
            {
              status: 'reconnecting',
              connected: false
            }
          );

          scheduleReconnect(
            sessionId,
            3000
          );

          return;
        }

        /*
         * Lòt fermeture.
         */
        await sessionManager.updateSession(
          sessionId,
          {
            status: 'reconnecting',
            connected: false
          }
        );

        scheduleReconnect(
          sessionId,
          4000
        );

        return;
      }

      if (isNewLogin) {
        console.log(
          `[TOPFEROS] ${sessionId}: nouveau login détecté.`
        );
      }
    }
  );

  /*
   * Message handler
   */
  if (messageHandler) {
    try {
      if (
        typeof messageHandler ===
        'function'
      ) {
        socket.ev.on(
          'messages.upsert',
          async messageUpdate => {
            try {
              await messageHandler(
                messageUpdate,
                socket,
                sessionId
              );
            } catch (error) {
              console.error(
                `[TOPFEROS] messageHandler ${sessionId}:`,
                error?.message || error
              );
            }
          }
        );
      }

      else if (
        typeof messageHandler.handleMessages ===
        'function'
      ) {
        socket.ev.on(
          'messages.upsert',
          async messageUpdate => {
            try {
              await messageHandler.handleMessages(
                messageUpdate,
                socket,
                sessionId
              );
            } catch (error) {
              console.error(
                `[TOPFEROS] messageHandler ${sessionId}:`,
                error?.message || error
              );
            }
          }
        );
      }
    } catch (error) {
      console.error(
        '[TOPFEROS] Erè initialisation message handler:',
        error?.message || error
      );
    }
  }
}

function scheduleReconnect(
  sessionId,
  delay = 3000
) {
  if (
    reconnectTimers.has(sessionId)
  ) {
    return;
  }

  const session =
    sessionManager.getSession(
      sessionId
    );

  if (!session) {
    return;
  }

  /*
   * Si yon pairing request ap mande kòd la,
   * PA ranplase socket la.
   */
  if (
    pairingRequests.has(sessionId)
  ) {
    return;
  }

  /*
   * Si pairing ap tann nimewo/code,
   * pa reconnect.
   */
  if (
    session.pairing === true &&
    !session.pairingCode
  ) {
    return;
  }

  const timer = setTimeout(
    async () => {
      reconnectTimers.delete(
        sessionId
      );

      /*
       * Verifye ankò anvan reconnect.
       */
      if (
        pairingRequests.has(
          sessionId
        )
      ) {
        return;
      }

      try {
        console.log(
          `[TOPFEROS] ${sessionId}: reconnexion...`
        );

        await startSession(
          sessionId,
          {
            forceNew: true,
            requestPairing: false
          }
        );
      } catch (error) {
        console.error(
          `[TOPFEROS] ${sessionId}: reconnexion échouée:`,
          error?.message || error
        );

        scheduleReconnect(
          sessionId,
          5000
        );
      }
    },
    delay
  );

  reconnectTimers.set(
    sessionId,
    timer
  );
}

async function startSession(
  sessionId,
  options = {}
) {
  const {
    forceNew = false,
    requestPairing = false
  } = options;

  if (!sessionId) {
    throw new Error(
      'sessionId obligatwa.'
    );
  }

  /*
   * Si gen yon start deja an cours,
   * reutilize menm promise la.
   *
   * Sa evite 2 socket an menm tan.
   */
  const existingPromise =
    startPromises.get(
      sessionId
    );

  if (existingPromise) {
    return existingPromise;
  }

  const promise =
    (async () => {
      /*
       * Pou pairing, nou pa fè yon
       * forceNew destriktif si pa gen
       * ansyen socket.
       */
      if (forceNew) {
        const oldSocket =
          sockets.get(
            sessionId
          );

        if (oldSocket) {
          try {
            oldSocket.end(
              new Error(
                'Preparing new WhatsApp socket'
              )
            );
          } catch (_) {}

          /*
           * Pa efase map la si se yon
           * lòt socket ki deja ranplase li.
           */
          if (
            sockets.get(
              sessionId
            ) === oldSocket
          ) {
            sockets.delete(
              sessionId
            );

            sessionManager.setSocket(
              sessionId,
              null
            );
          }

          await sleep(500);
        }
      }

      return await createSocket(
        sessionId,
        {
          requestPairing
        }
      );
    })();

  startPromises.set(
    sessionId,
    promise
  );

  try {
    return await promise;
  } finally {
    /*
     * Retire promise la sèlman si
     * se menm promise la.
     */
    if (
      startPromises.get(
        sessionId
      ) === promise
    ) {
      startPromises.delete(
        sessionId
      );
    }
  }
}

async function requestPairingCode(
  sessionId,
  phoneNumber
) {
  const number =
    normalizePhoneNumber(
      phoneNumber
    );

  if (
    !isValidPhoneNumber(number)
  ) {
    throw new Error(
      'Numéro WhatsApp invalide. Utilise le code pays + numéro, sans +, espaces ou tirets.'
    );
  }

  /*
   * Yon sèl request pairing pou yon session.
   */
  const existingRequest =
    pairingRequests.get(
      sessionId
    );

  if (existingRequest) {
    return await existingRequest;
  }

  const request =
    (async () => {
      let session =
        sessionManager.getSession(
          sessionId
        );

      if (!session) {
        session =
          await sessionManager.createSession(
            {
              sessionId,
              number
            }
          );
      }

      /*
       * Mark pairing BEFORE creating socket.
       * Sa anpeche connection.update close
       * lan lanse reconnect.
       */
      await sessionManager.updateSession(
        sessionId,
        {
          number,

          status: 'pairing',

          connected: false,

          pairing: true,

          pairingCode: null,

          pairingStartedAt:
            Date.now()
        }
      );

      /*
       * Si gen yon ansyen socket,
       * fèmen li sèlman si li pa itil ankò.
       */
      const oldSocket =
        sockets.get(
          sessionId
        );

      if (oldSocket) {
        try {
          oldSocket.end(
            new Error(
              'Preparing pairing connection'
            )
          );
        } catch (_) {}

        if (
          sockets.get(
            sessionId
          ) === oldSocket
        ) {
          sockets.delete(
            sessionId
          );

          sessionManager.setSocket(
            sessionId,
            null
          );
        }

        await sleep(700);
      }

      /*
       * Kreye YON SÈL socket pairing.
       */
      const socket =
        await startSession(
          sessionId,
          {
            forceNew: false,
            requestPairing: true
          }
        );

      /*
       * Kite handshake WhatsApp la
       * kòmanse anvan requestPairingCode.
       */
      await sleep(1800);

      /*
       * Pa kite yon reconnect oswa
       * yon lòt socket ranplase li.
       */
      if (
        sockets.get(
          sessionId
        ) !== socket
      ) {
        throw new Error(
          'Le socket WhatsApp a été remplacé avant la génération du code.'
        );
      }

      let code;

      try {
        code =
          await socket.requestPairingCode(
            number
          );
      } catch (error) {
        const message =
          error?.message ||
          String(error);

        console.error(
          `[TOPFEROS] requestPairingCode ${sessionId}:`,
          message
        );

        /*
         * Retire socket ki echwe a.
         */
        if (
          sockets.get(
            sessionId
          ) === socket
        ) {
          sockets.delete(
            sessionId
          );

          sessionManager.setSocket(
            sessionId,
            null
          );
        }

        try {
          socket.end(error);
        } catch (_) {}

        await sessionManager.updateSession(
          sessionId,
          {
            status: 'pairing_error',

            connected: false,

            pairing: false,

            pairingCode: null,

            pairingStartedAt: null
          }
        );

        throw new Error(
          `Impossible de générer le pairing code WhatsApp: ${message}`
        );
      }

      if (!code) {
        throw new Error(
          'WhatsApp pa retounen pairing code la.'
        );
      }

      /*
       * Sere code la sèlman apre WhatsApp
       * fin retounen li.
       */
      await sessionManager.updateSession(
        sessionId,
        {
          number,

          status: 'pairing',

          connected: false,

          pairing: true,

          pairingCode: code,

          pairingStartedAt:
            Date.now()
        }
      );

      console.log(
        `[TOPFEROS] Pairing code ${sessionId}: ${code}`
      );

      return {
        sessionId,

        number,

        code
      };
    })();

  pairingRequests.set(
    sessionId,
    request
  );

  try {
    return await request;
  } finally {
    /*
     * Pa efase yon nouvo request
     * ki ta rive kreye apre sa.
     */
    if (
      pairingRequests.get(
        sessionId
      ) === request
    ) {
      pairingRequests.delete(
        sessionId
      );
    }
  }
}

async function stopSession(
  sessionId
) {
  clearReconnectTimer(
    sessionId
  );

  pairingRequests.delete(
    sessionId
  );

  const socket =
    sockets.get(
      sessionId
    );

  if (socket) {
    try {
      socket.end(
        new Error(
          'Session stopped by user'
        )
      );
    } catch (_) {}
  }

  sockets.delete(
    sessionId
  );

  sessionManager.setSocket(
    sessionId,
    null
  );

  await sessionManager.updateSession(
    sessionId,
    {
      status: 'disconnected',

      connected: false,

      pairing: false,

      pairingCode: null,

      pairingStartedAt: null
    }
  );
}

async function removeSession(
  sessionId
) {
  clearReconnectTimer(
    sessionId
  );

  pairingRequests.delete(
    sessionId
  );

  startPromises.delete(
    sessionId
  );

  const socket =
    sockets.get(
      sessionId
    );

  if (socket) {
    try {
      socket.end(
        new Error(
          'Session removed'
        )
      );
    } catch (_) {}
  }

  sockets.delete(
    sessionId
  );

  sessionManager.setSocket(
    sessionId,
    null
  );

  await sessionManager.removeSession(
    sessionId
  );
}

async function restoreStoredSessions() {
  const sessions =
    sessionManager.getAllSessions();

  for (const session of sessions) {
    if (!session?.sessionId) {
      continue;
    }

    /*
     * Si server la te tonbe pandan pairing,
     * pa restore pairing lan otomatikman.
     */
    if (
      session.pairing === true
    ) {
      await sessionManager.updateSession(
        session.sessionId,
        {
          status: 'disconnected',

          connected: false,

          pairing: false,

          pairingCode: null,

          pairingStartedAt: null
        }
      );

      continue;
    }

    try {
      await startSession(
        session.sessionId,
        {
          forceNew: false,
          requestPairing: false
        }
      );

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
  console.log(
    '[TOPFEROS] WhatsApp connection system started.'
  );
}

async function stop() {
  for (
    const sessionId of sockets.keys()
  ) {
    try {
      await stopSession(
        sessionId
      );
    } catch (error) {
      console.error(
        `[TOPFEROS] Stop ${sessionId}:`,
        error?.message || error
      );
    }
  }

  for (
    const timer of reconnectTimers.values()
  ) {
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