"use strict";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ TOPFEROS MD — SETTINGS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Fonksyon:
//   GET  /api/settings
//   POST /api/settings
//
// Li verifye:
//   • Session panel la
//   • Bot la toujou konekte
//   • Number / session authorization
//
// Li pa ajoute okenn nouvo setting.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const fs = require("fs");
const path = require("path");

const settingsPanel =
  require("../settings/panel");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 SETTINGS FILE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const dataDir =
  path.join(
    __dirname,
    "..",
    "data"
  );

const settingsFile =
  path.join(
    dataDir,
    "bot-settings.json"
  );


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ SETTINGS KI PANEL LA GENYEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SETTING_NAMES = [
  "publicMode",
  "privateMode",

  "alwaysOnline",
  "fakeTyping",
  "fakeRecording",
  "autoReact",

  "autoStatus",
  "statusReply",
  "statusLike",
  "statusReact",

  "antiCall",
  "antiDelete",
  "antiSpam",

  "aiChat",

  "groupAntiSpam",
  "groupAntiLink",
  "groupAntiDelete",

  "adminGroup",

  "groupClose",
  "groupOpen"
];


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧱 DEFAULT SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createDefaultSettings() {

  const settings = {};

  for (
    const name of SETTING_NAMES
  ) {
    settings[name] = false;
  }

  return settings;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 CREATE DATA DIRECTORY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ensureDataDirectory() {

  if (
    !fs.existsSync(dataDir)
  ) {
    fs.mkdirSync(
      dataDir,
      {
        recursive: true
      }
    );
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📖 READ SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function readSettings() {

  ensureDataDirectory();

  if (
    !fs.existsSync(settingsFile)
  ) {

    const data = {
      bot: {
        name: "TOPFEROS MD",
        age: 24,
        prefix: "."
      },

      settings:
        createDefaultSettings()
    };

    fs.writeFileSync(
      settingsFile,
      JSON.stringify(
        data,
        null,
        2
      ),
      "utf8"
    );

    return data;
  }


  try {

    const raw =
      fs.readFileSync(
        settingsFile,
        "utf8"
      );

    const data =
      JSON.parse(raw);


    if (!data.bot) {
      data.bot = {};
    }

    if (!data.settings) {
      data.settings = {};
    }


    // Asire tout settings yo toujou
    // prezan nan fichye a.

    const defaults =
      createDefaultSettings();

    for (
      const name of SETTING_NAMES
    ) {

      if (
        typeof data.settings[name] !==
        "boolean"
      ) {

        data.settings[name] =
          defaults[name];
      }
    }


    if (
      typeof data.bot.name !==
      "string"
    ) {
      data.bot.name =
        "TOPFEROS MD";
    }

    if (
      typeof data.bot.age !==
      "number"
    ) {
      data.bot.age = 24;
    }

    if (
      typeof data.bot.prefix !==
      "string"
    ) {
      data.bot.prefix = ".";
    }


    return data;

  } catch (error) {

    console.error(
      "❌ SETTINGS READ ERROR:",
      error
    );

    return {
      bot: {
        name: "TOPFEROS MD",
        age: 24,
        prefix: "."
      },

      settings:
        createDefaultSettings()
    };
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 WRITE SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function writeSettings(data) {

  ensureDataDirectory();

  const temporaryFile =
    settingsFile + ".tmp";

  fs.writeFileSync(
    temporaryFile,
    JSON.stringify(
      data,
      null,
      2
    ),
    "utf8"
  );

  fs.renameSync(
    temporaryFile,
    settingsFile
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 CHECK SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function verifyPanelSession(
  sessionId
) {

  if (!sessionId) {
    return false;
  }

  try {

    return (
      settingsPanel.isAuthenticated(
        sessionId
      ) === true &&
      settingsPanel.isBotConnected() === true
    );

  } catch (error) {

    console.error(
      "❌ PANEL SESSION ERROR:",
      error
    );

    return false;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 APPLY SETTINGS TO BOT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Si settings/panel.js gen yon fonksyon
// pou aplike settings yo, nou itilize li.
// Sinon settings yo toujou sove nan
// bot-settings.json pou lòt listener yo li.
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function applySettings(
  data
) {

  try {

    if (
      typeof settingsPanel.applySettings ===
      "function"
    ) {

      await settingsPanel.applySettings(
        data
      );
    }

    return true;

  } catch (error) {

    console.error(
      "❌ APPLY SETTINGS ERROR:",
      error
    );

    return false;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤖 APPLY BOT INFORMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function applyBotInformation(
  bot
) {

  try {

    if (
      typeof settingsPanel.updateBotInformation ===
      "function"
    ) {

      await settingsPanel.updateBotInformation(
        bot
      );
    }

    return true;

  } catch (error) {

    console.error(
      "❌ BOT INFORMATION ERROR:",
      error
    );

    return false;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📥 GET SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function getSettings(
  sessionId
) {

  if (
    !verifyPanelSession(
      sessionId
    )
  ) {

    return {
      success: false,
      status: 401,
      message:
        "Session la pa valid oswa bot la dekonekte."
    };
  }


  const data =
    readSettings();


  return {
    success: true,

    bot: {
      name:
        data.bot.name,

      age:
        data.bot.age,

      prefix:
        data.bot.prefix
    },

    settings:
      data.settings
  };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 SAVE SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function saveSettings(
  sessionId,
  body
) {

  if (
    !verifyPanelSession(
      sessionId
    )
  ) {

    return {
      success: false,
      status: 401,
      message:
        "Session la pa valid oswa bot la dekonekte."
    };
  }


  if (
    !body ||
    typeof body !==
    "object"
  ) {

    return {
      success: false,
      status: 400,
      message:
        "Done settings yo pa valid."
    };
  }


  const current =
    readSettings();


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🤖 BOT INFORMATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const incomingBot =
    body.bot || {};


  const botName =
    typeof incomingBot.name ===
    "string"
      ? incomingBot.name.trim()
      : current.bot.name;


  const botPrefix =
    typeof incomingBot.prefix ===
    "string"
      ? incomingBot.prefix.trim()
      : current.bot.prefix;


  const botAge =
    Number(
      incomingBot.age
    );


  if (!botName) {

    return {
      success: false,
      status: 400,
      message:
        "Nom Bot pa ka vid."
    };
  }


  if (
    !botPrefix
  ) {

    return {
      success: false,
      status: 400,
      message:
        "Prefix pa ka vid."
    };
  }


  if (
    !Number.isFinite(botAge) ||
    botAge < 0
  ) {

    return {
      success: false,
      status: 400,
      message:
        "Âge Bot la pa valid."
    };
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚙️ SETTINGS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const incomingSettings =
    body.settings || {};

  const newSettings = {
    ...current.settings
  };


  for (
    const name of SETTING_NAMES
  ) {

    if (
      Object.prototype.hasOwnProperty.call(
        incomingSettings,
        name
      )
    ) {

      newSettings[name] =
        incomingSettings[name] === true;
    }
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💾 PREPARE DATA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const updatedData = {

    bot: {
      name:
        botName,

      age:
        botAge,

      prefix:
        botPrefix
    },

    settings:
      newSettings
  };


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💾 SAVE LOCAL DATA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  try {

    writeSettings(
      updatedData
    );

  } catch (error) {

    console.error(
      "❌ SETTINGS WRITE ERROR:",
      error
    );

    return {
      success: false,
      status: 500,
      message:
        "Settings yo pa kapab sove."
    };
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🤖 APPLY TO BOT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const applied =
    await applySettings(
      updatedData
    );


  const botUpdated =
    await applyBotInformation(
      updatedData.bot
    );


  if (
    !applied ||
    !botUpdated
  ) {

    console.warn(
      "⚠️ Settings yo sove, men kèk nan yo poko aplike nan runtime."
    );
  }


  return {
    success: true,

    message:
      "Settings yo sove avèk siksè.",

    bot:
      updatedData.bot,

    settings:
      updatedData.settings
  };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 REGISTER EXPRESS ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function registerSettingsRoutes(
  app
) {

  if (!app) {
    throw new Error(
      "Express app obligatwa."
    );
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 GET
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  app.get(
    "/api/settings",
    async (
      req,
      res
    ) => {

      try {

        const sessionId =
          req.query.session;

        const result =
          await getSettings(
            sessionId
          );

        return res
          .status(
            result.status ||
            (result.success
              ? 200
              : 400)
          )
          .json(
            result
          );

      } catch (error) {

        console.error(
          "❌ GET SETTINGS ERROR:",
          error
        );

        return res
          .status(500)
          .json({
            success: false,
            message:
              "Erè pandan chajman settings yo."
          });
      }
    }
  );


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💾 POST
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  app.post(
    "/api/settings",
    async (
      req,
      res
    ) => {

      try {

        const {
          sessionId
        } = req.body || {};

        const result =
          await saveSettings(
            sessionId,
            req.body
          );

        return res
          .status(
            result.status ||
            (result.success
              ? 200
              : 400)
          )
          .json(
            result
          );

      } catch (error) {

        console.error(
          "❌ POST SETTINGS ERROR:",
          error
        );

        return res
          .status(500)
          .json({
            success: false,
            message:
              "Erè pandan sauvegarde settings yo."
          });
      }
    }
  );

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {

  SETTING_NAMES,

  createDefaultSettings,

  readSettings,

  writeSettings,

  verifyPanelSession,

  getSettings,

  saveSettings,

  registerSettingsRoutes

};