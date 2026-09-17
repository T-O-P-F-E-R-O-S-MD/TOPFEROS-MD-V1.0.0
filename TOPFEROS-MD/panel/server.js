'use strict';

const express = require('express');
const path = require('path');

const connection = require('../src/connection');
const sessionManager = require('../src/sessionManager');

let settingsPanel = null;

try {
  settingsPanel =
    require('../src/settingsPanel');
} catch (error) {
  console.log(
    '[TOPFEROS] settingsPanel pa disponib.'
  );
}

const app = express();

const PORT =
  Number(process.env.PORT) || 3000;

const HOST =
  process.env.HOST || '0.0.0.0';

/*
|--------------------------------------------------------------------------
| PANEL PATHS
|--------------------------------------------------------------------------
*/

const PUBLIC_DIR =
  path.join(__dirname, 'public');

/*
 * Background panel la.
 * Nou kenbe chemen sa paske ansyen panel
 * ou a te sèvi ak background.png ki nan panel/.
 */
const BACKGROUND_FILE =
  path.join(
    __dirname,
    'background.png'
  );

/*
 * Assets folder ki gen logo bot la.
 *
 * Nou teste plizyè chemen pou nou pa kraze
 * ansyen estrikti TOPFEROS MD la.
 */
const ASSETS_DIR =
  path.join(
    __dirname,
    '..',
    'assets'
  );

/*
|--------------------------------------------------------------------------
| MIDDLEWARE
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: '2mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '2mb'
  })
);

/*
 * Fichye panel yo.
 */
app.use(
  express.static(
    PUBLIC_DIR
  )
);

/*
 * Logo, icons, images, etc.
 *
 * Sa a te manke nan nouvo server.js la.
 */
app.use(
  '/assets',
  express.static(
    ASSETS_DIR
  )
);

/*
|--------------------------------------------------------------------------
| BACKGROUND
|--------------------------------------------------------------------------
*/

app.get(
  '/background.png',
  (req, res) => {
    res.sendFile(
      BACKGROUND_FILE,
      error => {
        if (error) {
          console.error(
            '[TOPFEROS] Background pa jwenn:',
            error?.message || error
          );

          res.status(
            error?.statusCode || 404
          ).end();
        }
      }
    );
  }
);

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanNumberValue(
  value
) {
  return String(
    value || ''
  ).replace(
    /\D/g,
    ''
  );
}

function isValidPhoneNumber(
  number
) {
  return /^\d{8,15}$/.test(
    number
  );
}

function makeSessionId(
  number
) {
  return `session_${cleanNumberValue(
    number
  )}`;
}

function getConnectionSession(
  sessionId
) {
  if (!sessionId) {
    return null;
  }

  return sessionManager.getSession(
    sessionId
  );
}

function getPublicSessions() {
  return sessionManager.getPublicSessions();
}

/*
|--------------------------------------------------------------------------
| MAIN PANEL
|--------------------------------------------------------------------------
*/

app.get(
  '/',
  (req, res) => {
    res.sendFile(
      path.join(
        PUBLIC_DIR,
        'index.html'
      )
    );
  }
);

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

app.get(
  '/api/status',
  (req, res) => {
    try {
      const sessions =
        getPublicSessions();

      const connected =
        sessions.filter(
          session =>
            session.connected === true
        );

      const pairing =
        sessions.filter(
          session =>
            session.pairing === true
        );

      res.json({
        success: true,

        status: 'online',

        totalSessions:
          sessions.length,

        connectedSessions:
          connected.length,

        pairingSessions:
          pairing.length,

        sessions
      });
    } catch (error) {
      console.error(
        '[TOPFEROS] /api/status:',
        error?.message || error
      );

      res.status(500).json({
        success: false,
        error:
          'Impossible de récupérer le statut.'
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| SESSIONS
|--------------------------------------------------------------------------
*/

app.get(
  '/api/sessions',
  (req, res) => {
    try {
      res.json({
        success: true,

        sessions:
          getPublicSessions()
      });
    } catch (error) {
      console.error(
        '[TOPFEROS] /api/sessions:',
        error?.message || error
      );

      res.status(500).json({
        success: false,
        error:
          'Impossible de récupérer les sessions.'
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| PAIRING CODE
|--------------------------------------------------------------------------
*/

app.post(
  '/api/pairing',
  async (req, res) => {
    try {
      const rawNumber =
        req.body?.number ||
        req.body?.phoneNumber ||
        req.body?.phone ||
        '';

      const number =
        cleanNumberValue(
          rawNumber
        );

      if (
        !isValidPhoneNumber(
          number
        )
      ) {
        return res.status(400).json({
          success: false,

          error:
            'Numéro invalide. Utilisez le code pays + numéro, sans +, espaces ou tirets.'
        });
      }

      const sessionId =
        cleanNumberValue(
          req.body?.sessionId
        ) ||
        makeSessionId(
          number
        );

      let session =
        getConnectionSession(
          sessionId
        );

      /*
       * Si session deja connectée,
       * pa mande nouvo code.
       */
      if (
        session &&
        session.connected === true
      ) {
        return res.status(409).json({
          success: false,

          error:
            'Ce numéro est déjà connecté.',

          sessionId
        });
      }

      /*
       * Si yon ansyen pairing te rete
       * sou disk, netwaye state la.
       */
      if (
        session &&
        session.pairing === true
      ) {
        await sessionManager.updateSession(
          sessionId,
          {
            status: 'disconnected',

            connected: false,

            pairing: false,

            pairingCode: null,

            pairingStartedAt:
              null,

            number
          }
        );
      }

      console.log(
        `[TOPFEROS] Demande pairing code: ${number}`
      );

      /*
       * connection.js jere tout socket
       * + requestPairingCode().
       */
      const result =
        await connection.requestPairingCode(
          sessionId,
          number
        );

      return res.json({
        success: true,

        sessionId:
          result.sessionId,

        number:
          result.number,

        code:
          result.code,

        pairingCode:
          result.code,

        message:
          'Pairing code généré avec succès.'
      });
    } catch (error) {
      console.error(
        '[TOPFEROS] /api/pairing:',
        error?.message || error
      );

      return res.status(500).json({
        success: false,

        error:
          error?.message ||
          'Impossible de générer le pairing code.'
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CURRENT SESSION
|--------------------------------------------------------------------------
*/

app.get(
  '/api/current-session',
  (req, res) => {
    try {
      const sessionId =
        req.query?.session ||
        req.query?.sessionId;

      if (!sessionId) {
        return res.json({
          success: true,
          session: null
        });
      }

      const session =
        getConnectionSession(
          sessionId
        );

      return res.json({
        success: true,

        session:
          sessionManager.publicSession(
            session
          )
      });
    } catch (error) {
      console.error(
        '[TOPFEROS] /api/current-session:',
        error?.message || error
      );

      res.status(500).json({
        success: false,

        error:
          'Impossible de récupérer la session.'
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| SINGLE SESSION
|--------------------------------------------------------------------------
*/

app.get(
  '/api/session/:sessionId',
  (req, res) => {
    try {
      const {
        sessionId
      } = req.params;

      const session =
        getConnectionSession(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,

          error:
            'Session introuvable.'
        });
      }

      return res.json({
        success: true,

        session:
          sessionManager.publicSession(
            session
          )
      });
    } catch (error) {
      console.error(
        '[TOPFEROS] /api/session:',
        error?.message || error
      );

      res.status(500).json({
        success: false,

        error:
          'Impossible de récupérer la session.'
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| VERIFY
|--------------------------------------------------------------------------
*/

app.post(
  '/api/verify',
  async (req, res) => {
    try {
      const sessionId =
        req.body?.sessionId ||
        req.body?.session;

      if (!sessionId) {
        return res.status(400).json({
          success: false,

          error:
            'sessionId obligatwa.'
        });
      }

      const session =
        getConnectionSession(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,

          error:
            'Session introuvable.'
        });
      }

      return res.json({
        success: true,

        verified:
          session.connected === true,

        connected:
          session.connected === true,

        session:
          sessionManager.publicSession(
            session
          )
      });
    } catch (error) {
      console.error(
        '[TOPFEROS] /api/verify:',
        error?.message || error
      );

      res.status(500).json({
        success: false,

        error:
          'Erreur de vérification.'
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| SETTINGS
|--------------------------------------------------------------------------
*/

app.get(
  '/api/settings',
  async (req, res) => {
    try {
      if (
        settingsPanel &&
        typeof settingsPanel.getSettings ===
          'function'
      ) {
        const settings =
          await settingsPanel.getSettings();

        return res.json({
          success: true,
          settings
        });
      }

      return res.json({
        success: true,
        settings: {}
      });
    } catch (error) {
      console.error(
        '[TOPFEROS] GET settings:',
        error?.message || error
      );

      res.status(500).json({
        success: false,

        error:
          'Impossible de récupérer les paramètres.'
      });
    }
  }
);

app.post(
  '/api/settings',
  async (req, res) => {
    try {
      if (
        settingsPanel &&
        typeof settingsPanel.updateSettings ===
          'function'
      ) {
        const settings =
          await settingsPanel.updateSettings(
            req.body || {}
          );

        return res.json({
          success: true,
          settings
        });
      }

      return res.json({
        success: true,

        settings:
          req.body || {}
      });
    } catch (error) {
      console.error(
        '[TOPFEROS] POST settings:',
        error?.message || error
      );

      res.status(500).json({
        success: false,

        error:
          'Impossible de sauvegarder les paramètres.'
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| LANGUAGE
|--------------------------------------------------------------------------
*/

app.post(
  '/api/language',
  async (req, res) => {
    try {
      const language =
        String(
          req.body?.language ||
          req.body?.lang ||
          'fr'
        ).toLowerCase();

      const allowedLanguages = [
        'fr',
        'en',
        'es'
      ];

      if (
        !allowedLanguages.includes(
          language
        )
      ) {
        return res.status(400).json({
          success: false,

          error:
            'Langue non supportée.'
        });
      }

      if (
        settingsPanel &&
        typeof settingsPanel.setLanguage ===
          'function'
      ) {
        await settingsPanel.setLanguage(
          language
        );
      }

      return res.json({
        success: true,

        language
      });
    } catch (error) {
      console.error(
        '[TOPFEROS] language:',
        error?.message || error
      );

      res.status(500).json({
        success: false,

        error:
          'Impossible de changer la langue.'
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| DISCONNECT
|--------------------------------------------------------------------------
*/

app.post(
  '/api/session/:sessionId/disconnect',
  async (req, res) => {
    try {
      const {
        sessionId
      } = req.params;

      const session =
        getConnectionSession(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,

          error:
            'Session introuvable.'
        });
      }

      await connection.stopSession(
        sessionId
      );

      return res.json({
        success: true,

        message:
          'Session déconnectée.',

        sessionId
      });
    } catch (error) {
      console.error(
        '[TOPFEROS] disconnect:',
        error?.message || error
      );

      res.status(500).json({
        success: false,

        error:
          error?.message ||
          'Impossible de déconnecter la session.'
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE SESSION
|--------------------------------------------------------------------------
*/

app.delete(
  '/api/session/:sessionId',
  async (req, res) => {
    try {
      const {
        sessionId
      } = req.params;

      const session =
        getConnectionSession(
          sessionId
        );

      if (!session) {
        return res.status(404).json({
          success: false,

          error:
            'Session introuvable.'
        });
      }

      await connection.removeSession(
        sessionId
      );

      return res.json({
        success: true,

        message:
          'Session supprimée.',

        sessionId
      });
    } catch (error) {
      console.error(
        '[TOPFEROS] delete session:',
        error?.message || error
      );

      res.status(500).json({
        success: false,

        error:
          error?.message ||
          'Impossible de supprimer la session.'
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| API 404
|--------------------------------------------------------------------------
*/

app.use(
  '/api',
  (req, res) => {
    res.status(404).json({
      success: false,

      error:
        'API route introuvable.'
    });
  }
);

/*
|--------------------------------------------------------------------------
| EXPRESS ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      '[TOPFEROS] Express error:',
      error?.message || error
    );

    if (
      res.headersSent
    ) {
      return next(error);
    }

    res.status(500).json({
      success: false,

      error:
        error?.message ||
        'Erreur interne du serveur.'
    });
  }
);

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

const server =
  app.listen(
    PORT,
    HOST,
    () => {
      console.log(
        `[TOPFEROS] Panel running on ${HOST}:${PORT}`
      );
    }
  );

server.on(
  'error',
  error => {
    console.error(
      '[TOPFEROS] Panel server error:',
      error?.message || error
    );
  }
);

module.exports = {
  app,
  server
};