"use strict";

/*
|--------------------------------------------------------------------------
| TOPFEROS MD V2.0.0
| GLOBAL CONFIGURATION
|--------------------------------------------------------------------------
|
| This file contains the default configuration used by the bot.
|
| Environment variables can override the important values.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function envString(
  name,
  fallback = ""
) {
  const value =
    process.env[name];

  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return String(value).trim();
}

function envBoolean(
  name,
  fallback = false
) {
  const value =
    process.env[name];

  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return [
    "true",
    "1",
    "yes",
    "on"
  ].includes(
    String(value)
      .trim()
      .toLowerCase()
  );
}

/*
|--------------------------------------------------------------------------
| BOT
|--------------------------------------------------------------------------
*/

const bot = {
  name:
    envString(
      "BOT_NAME",
      "TOPFEROS MD"
    ),

  version:
    envString(
      "BOT_VERSION",
      "2.0.0"
    ),

  prefix:
    envString(
      "BOT_PREFIX",
      "."
    ),

  mode:
    envString(
      "BOT_MODE",
      "Public"
    ),

  language:
    envString(
      "BOT_LANGUAGE",
      "English"
    ),

  location:
    envString(
      "BOT_LOCATION",
      "HAÏTI"
    ),

  age:
    Number(
      process.env.BOT_AGE ||
      14
    ),

  ownerNumber:
    envString(
      "OWNER_NUMBER",
      ""
    ),

  footer:
    envString(
      "BOT_FOOTER",
      "🦁 TECH BY TOPFEROS MD 🐑"
    ),

  logo:
    envString(
      "BOT_LOGO",
      "assets/logo.png"
    )
};

/*
|--------------------------------------------------------------------------
| AUTOMATION
|--------------------------------------------------------------------------
*/

const automation = {
  /*
   * Online / presence
   */

  alwaysOnline:
    envBoolean(
      "ALWAYS_ONLINE",
      true
    ),

  /*
   * Simulated typing
   */

  fakeTyping:
    envBoolean(
      "FAKE_TYPING",
      false
    ),

  /*
   * Simulated recording
   */

  fakeRecording:
    envBoolean(
      "FAKE_RECORDING",
      false
    ),

  /*
   * WhatsApp Status
   */

  autoStatusSeen:
    envBoolean(
      "AUTO_STATUS_SEEN",
      true
    ),

  autoStatusReply:
    envBoolean(
      "AUTO_STATUS_REPLY",
      true
    ),

  autoStatusReact:
    envBoolean(
      "AUTO_STATUS_REACT",
      true
    ),

  /*
   * Anti-delete
   */

  antiDelete:
    envBoolean(
      "ANTI_DELETE",
      true
    ),

  antiDeleteMode:
    envString(
      "ANTI_DELETE_MODE",
      "private"
    ),

  /*
   * Anti-call
   */

  antiCall:
    envBoolean(
      "ANTI_CALL",
      false
    ),

  /*
   * Anti-bug
   */

  antiBug:
    envBoolean(
      "ANTI_BUG",
      false
    ),

  /*
   * Anti-bot filter
   */

  antiBotFilter:
    envBoolean(
      "ANTI_BOT_FILTER",
      false
    ),

  antiBotAction:
    envString(
      "ANTI_BOT_ACTION",
      "Delete"
    )
};

/*
|--------------------------------------------------------------------------
| GROUP AUTOMATION
|--------------------------------------------------------------------------
*/

const groupAutomation = {
  enabled:
    envBoolean(
      "GROUP_AUTOMATION_ENABLED",
      false
    ),

  groupGid:
    envString(
      "GROUP_GID",
      ""
    ),

  timezone:
    envString(
      "GROUP_TIMEZONE",
      "Atlantic/Port-au-Prince"
    ),

  closeTime:
    envString(
      "GROUP_CLOSE_TIME",
      "15:00"
    ),

  openTime:
    envString(
      "GROUP_OPEN_TIME",
      "06:00"
    ),

  principles:
    envString(
      "GROUP_PRINCIPLES",
      ""
    ),

  warningLimit:
    3
};

/*
|--------------------------------------------------------------------------
| SECURITY
|--------------------------------------------------------------------------
*/

const security = {
  /*
   * Numbers listed here can be automatically blocked
   * when they call the bot.
   */

  antiBlockNumbers:
    [],

  /*
   * Group warning system.
   */

  groupWarningLimit:
    3
};

/*
|--------------------------------------------------------------------------
| MULTI SESSION
|--------------------------------------------------------------------------
*/

const session = {
  /*
   * Directory used by Baileys multi-file auth.
   */

  directory:
    envString(
      "SESSION_DIR",
      "sessions"
    ),

  /*
   * Keep credentials after disconnect.
   */

  keepCredentials:
    true,

  /*
   * Each session is isolated.
   */

  isolated:
    true
};

/*
|--------------------------------------------------------------------------
| PANELS
|--------------------------------------------------------------------------
*/

const panels = {
  parrainUrl:
    envString(
      "PARRAIN_PANEL_URL",
      ""
    ),

  settingsUrl:
    envString(
      "SETTINGS_PANEL_URL",
      ""
    )
};

/*
|--------------------------------------------------------------------------
| CHANNEL
|--------------------------------------------------------------------------
*/

const channel = {
  name:
    "TOPFEROS MD",

  url:
    "https://whatsapp.com/channel/0029VbDJULz30LKTYe95S91l"
};

/*
|--------------------------------------------------------------------------
| AI
|--------------------------------------------------------------------------
*/

const ai = {
  apiUrl:
    envString(
      "AI_API_URL",
      ""
    ),

  apiKey:
    envString(
      "AI_API_KEY",
      ""
    ),

  model:
    envString(
      "AI_MODEL",
      "gpt-4o-mini"
    ),

  timeout:
    Number(
      process.env.AI_TIMEOUT_MS ||
      15000
    )
};

/*
|--------------------------------------------------------------------------
| MEDIA
|--------------------------------------------------------------------------
*/

const media = {
  musicCommand:
    ".play song",

  videoCommand:
    ".play v",

  videoAlias:
    ".video"
};

/*
|--------------------------------------------------------------------------
| SUPPORTED LANGUAGES
|--------------------------------------------------------------------------
|
| English is the default/base language.
|
| More translations can be added by the
| language system without changing this config.
|
|--------------------------------------------------------------------------
*/

const languages = {
  default:
    "English",

  available: [
    "English"
  ]
};

/*
|--------------------------------------------------------------------------
| BRANDING
|--------------------------------------------------------------------------
*/

const branding = {
  header:
    "🦁 TOPFEROS MD V2.0.0 🐑",

  footer:
    "🦁 TECH BY TOPFEROS MD 🐑"
};

/*
|--------------------------------------------------------------------------
| CONNECTION
|--------------------------------------------------------------------------
*/

const connection = {
  reconnectDelay:
    Number(
      process.env.RECONNECT_DELAY_MS ||
      5000
    ),

  maxReconnectAttempts:
    Number(
      process.env.MAX_RECONNECT_ATTEMPTS ||
      0
    ),

  printQRInTerminal:
    false,

  syncFullHistory:
    false
};

/*
|--------------------------------------------------------------------------
| COMPLETE CONFIG
|--------------------------------------------------------------------------
*/

const config = {
  bot,

  automation,

  groupAutomation,

  security,

  session,

  panels,

  channel,

  ai,

  media,

  languages,

  branding,

  connection
};

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = config;