"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");

const connection = require("../src/connection");
const sessionManager = require("../src/sessionManager");
const language = require("../src/language");

/*
|--------------------------------------------------------------------------
| SETTINGS PANEL BACKEND
|--------------------------------------------------------------------------
*/

const SETTING_PANEL_FILE = path.join(
  __dirname,
  "..",
  "src",
  "settingPanel.js"
);

console.log(
  "[TOPFEROS] settingPanel path:",
  SETTING_PANEL_FILE
);

console.log(
  "[TOPFEROS] settingPanel exists:",
  fs.existsSync(SETTING_PANEL_FILE)
);

let settingsPanel = null;

try {
  settingsPanel = require("../src/settingPanel");

  console.log(
    "[TOPFEROS] ✅ settingPanel.js chaje avèk siksè."
  );
} catch (error) {
  console.error(
    "[TOPFEROS] ❌ settingPanel.js pa disponib:",
    error?.stack ||
      error?.message ||
      error
  );
}

const app = express();

const { exec } = require('child_process');

// API pou telechaje mizik ak videyo via yt-dlp
app.post('/api/download', (req, res) => {
    const { url, type } = req.body; // type ka 'audio' oswa 'video'

    if (!url) {
        return res.status(400).json({ status: false, message: "Ou dwe voye yon lyen." });
    }

    let command = '';
    if (type === 'audio') {
        // Jwenn pi bon odyo epi fòse kòd la ba li fòma mp3 nòmal
        command = `yt-dlp -f "bestaudio" -g "${url}"`;
    } else {
        // Jwenn pi bon videyo MP4 ki gen odyo ansanm
        command = `yt-dlp -f "best[ext=mp4]/best" -g "${url}"`;
    }

    exec(command, (error, stdout) => {
        if (error) {
            console.error(`yt-dlp error: ${error.message}`);
            return res.status(500).json({ status: false, message: "Sèvè a pa ka trete lyen sa a." });
        }

        const directUrl = stdout.trim();
        if (!directUrl) {
            return res.status(404).json({ status: false, message: "Pa jwenn lyen telechajman dirèk." });
        }

        return res.json({
            status: true,
            type: type || 'video',
            download_url: directUrl
        });
    });
});


/*
|--------------------------------------------------------------------------
| SERVER
|--------------------------------------------------------------------------
*/

const PORT =
  Number(process.env.PORT) || 3000;

const HOST =
  process.env.HOST || "0.0.0.0";

/*
|--------------------------------------------------------------------------
| PATHS
|--------------------------------------------------------------------------
*/

const PUBLIC_DIR =
  path.join(
    __dirname,
    "public"
  );

const BACKGROUND_FILE =
  path.join(
    __dirname,
    "background.png"
  );

const ASSETS_DIR =
  path.join(
    __dirname,
    "..",
    "assets"
  );

/*
|--------------------------------------------------------------------------
| MIDDLEWARE
|--------------------------------------------------------------------------
*/

app.disable("x-powered-by");

app.use(
  express.json({
    limit: "2mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb"
  })
);

/*
|--------------------------------------------------------------------------
| STATIC FILES
|--------------------------------------------------------------------------
*/

app.use(
  express.static(
    PUBLIC_DIR
  )
);

app.use(
  "/assets",
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
  "/background.png",
  (req, res) => {
    if (
      !fs.existsSync(
        BACKGROUND_FILE
      )
    ) {
      return res.status(404).end();
    }

    return res.sendFile(
      BACKGROUND_FILE
    );
  }
);

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanNumberValue(value) {
  return String(
    value || ""
  ).replace(
    /\D/g,
    ""
  );
}

function isValidPhoneNumber(number) {
  return /^\d{8,15}$/.test(
    number
  );
}

function makeSessionId(number) {
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

  try {
    if (
      typeof sessionManager.getSession !==
      "function"
    ) {
      return null;
    }

    return sessionManager.getSession(
      sessionId
    );
  } catch (error) {
    console.error(
      "[TOPFEROS] getSession:",
      error?.message || error
    );

    return null;
  }
}

function getPublicSessions() {
  try {
    if (
      typeof sessionManager.getPublicSessions ===
      "function"
    ) {
      return (
        sessionManager.getPublicSessions() ||
        []
      );
    }

    if (
      typeof sessionManager.getSessions ===
      "function"
    ) {
      const result =
        sessionManager.getSessions();

      if (Array.isArray(result)) {
        return result;
      }

      if (
        result &&
        typeof result === "object"
      ) {
        return Object.values(
          result
        );
      }
    }

    return [];
  } catch (error) {
    console.error(
      "[TOPFEROS] getPublicSessions:",
      error?.message || error
    );

    return [];
  }
}

function publicSession(
  session
) {
  if (!session) {
    return null;
  }

  try {
    if (
      typeof sessionManager.publicSession ===
      "function"
    ) {
      return sessionManager.publicSession(
        session
      );
    }
  } catch (error) {
    console.error(
      "[TOPFEROS] publicSession:",
      error?.message || error
    );
  }

  return session;
}

function getSessionIdFromRequest(
  req
) {
  return (
    req.query?.sessionId ||
    req.query?.session ||
    req.body?.sessionId ||
    req.body?.session ||
    null
  );
}

function isSessionConnected(
  session
) {
  return Boolean(
    session &&
      (
        session.connected === true ||
        session.status === "connected"function makeTranslationCacheKey(
  languageName,
  texts
) {
  return JSON.stringify({
    language:
      String(
        languageName ||
          "English"
      )
        .trim()
        .toLowerCase(),

    texts
  });
}

function getCachedTranslation(
  key
) {
  const cached =
    translationCache.get(
      key
    );

  if (!cached) {
    return null;
  }

  // Mete l ankò kòm dènye item cache la
  translationCache.delete(
    key
  );

  translationCache.set(
    key,
    cached
  );

  return cached;
}

function setCachedTranslation(
  key,
  value
) {
  if (
    translationCache.has(
      key
    )
  ) {
    translationCache.delete(
      key
    );
  }

  translationCache.set(
    key,
    value
  );

  while (
    translationCache.size >
    TRANSLATION_CACHE_LIMIT
  ) {
    const firstKey =
      translationCache.keys().next().value;

    translationCache.delete(
      firstKey
    );
  }

  return value;
}