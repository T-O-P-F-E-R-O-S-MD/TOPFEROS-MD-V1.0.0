"use strict";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ TOPFEROS MD — SETTINGS PANEL LOGIC
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Session panel la soti nan URL la
const params =
  new URLSearchParams(
    window.location.search
  );

const sessionId =
  params.get("session");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 ELEMENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const saveButton =
  document.getElementById(
    "saveSettings"
  );

const settingsMessage =
  document.getElementById(
    "settingsMessage"
  );

const botNameInput =
  document.getElementById(
    "botName"
  );

const botAgeInput =
  document.getElementById(
    "botAge"
  );

const botPrefixInput =
  document.getElementById(
    "botPrefix"
  );


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ SETTINGS KI DISPONIB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const settingNames = [
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
// 🔎 JWENN SWITCH YO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSwitches() {

  return Array.from(
    document.querySelectorAll(
      "input[data-setting]"
    )
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📢 MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showMessage(
  text,
  success = false
) {

  if (!settingsMessage) {
    return;
  }

  settingsMessage.textContent =
    text || "";

  settingsMessage.style.color =
    success
      ? "#72ffad"
      : "#ff7777";
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 VERIFY SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function verifySession() {

  if (!sessionId) {
    return false;
  }

  try {

    const response =
      await fetch(
        `/api/auth?session=${encodeURIComponent(
          sessionId
        )}`,
        {
          method: "GET",
          cache: "no-store"
        }
      );

    if (!response.ok) {
      return false;
    }

    const result =
      await response.json();

    return (
      result.success === true &&
      result.connected === true
    );

  } catch (error) {

    console.error(
      "❌ SETTINGS AUTH ERROR:",
      error
    );

    return false;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📥 LOAD SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function loadSettings() {

  if (!sessionId) {

    showMessage(
      "❌ Session panel la pa jwenn."
    );

    return;
  }

  try {

    const response =
      await fetch(
        `/api/settings?session=${encodeURIComponent(
          sessionId
        )}`,
        {
          method: "GET",
          cache: "no-store"
        }
      );

    const result =
      await response.json();

    if (
      !response.ok ||
      result.success !== true
    ) {

      showMessage(
        result.message ||
        "❌ Pa kapab chaje settings yo."
      );

      return;
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🤖 BOT INFORMATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      result.bot &&
      botNameInput
    ) {
      botNameInput.value =
        result.bot.name || "";
    }

    if (
      result.bot &&
      botAgeInput
    ) {
      botAgeInput.value =
        result.bot.age ?? "";
    }

    if (
      result.bot &&
      botPrefixInput
    ) {
      botPrefixInput.value =
        result.bot.prefix || ".";
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⚙️ ON / OFF
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const settings =
      result.settings || {};

    getSwitches()
      .forEach(input => {

        const name =
          input.dataset.setting;

        if (
          Object.prototype.hasOwnProperty.call(
            settings,
            name
          )
        ) {

          input.checked =
            settings[name] === true;
        }

      });


    showMessage(
      "",
      true
    );

  } catch (error) {

    console.error(
      "❌ LOAD SETTINGS ERROR:",
      error
    );

    showMessage(
      "❌ Erè pandan chajman settings yo."
    );
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 COLLECT SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function collectSettings() {

  const settings = {};

  getSwitches()
    .forEach(input => {

      const name =
        input.dataset.setting;

      if (
        settingNames.includes(name)
      ) {

        settings[name] =
          input.checked;
      }

    });

  return settings;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 SAVE SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function saveSettings() {

  showMessage("");

  const authenticated =
    await verifySession();

  if (!authenticated) {

    showMessage(
      "🔴 Bot la dekonekte oswa session la pa valid."
    );

    return;
  }


  const bot = {

    name:
      botNameInput
        ? botNameInput.value.trim()
        : "",

    age:
      botAgeInput
        ? Number(
            botAgeInput.value
          )
        : 0,

    prefix:
      botPrefixInput
        ? botPrefixInput.value.trim()
        : "."
  };


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔎 VALIDATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!bot.name) {

    showMessage(
      "❌ Nom Bot pa ka vid."
    );

    botNameInput?.focus();

    return;
  }

  if (
    !Number.isFinite(bot.age) ||
    bot.age < 0
  ) {

    showMessage(
      "❌ Âge Bot la pa valid."
    );

    botAgeInput?.focus();

    return;
  }

  if (!bot.prefix) {

    showMessage(
      "❌ Prefix pa ka vid."
    );

    botPrefixInput?.focus();

    return;
  }


  const settings =
    collectSettings();


  if (saveButton) {

    saveButton.disabled =
      true;

    saveButton.textContent =
      "Saving...";
  }


  try {

    const response =
      await fetch(
        "/api/settings",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              sessionId,
              bot,
              settings
            })
        }
      );

    const result =
      await response.json();


    if (
      !response.ok ||
      result.success !== true
    ) {

      showMessage(
        result.message ||
        "❌ Settings yo pa t sove."
      );

      return;
    }


    showMessage(
      "✅ Settings yo sove avèk siksè.",
      true
    );

  } catch (error) {

    console.error(
      "❌ SAVE SETTINGS ERROR:",
      error
    );

    showMessage(
      "❌ Pa kapab kontakte server panel la."
    );

  } finally {

    if (saveButton) {

      saveButton.disabled =
        false;

      saveButton.textContent =
        "SAVE ✅";
    }
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖱️ SAVE BUTTON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (saveButton) {

  saveButton.addEventListener(
    "click",
    saveSettings
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 CHECK CONNECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function monitorSettings() {

  const authenticated =
    await verifySession();

  if (!authenticated) {

    showMessage(
      "🔴 Bot la dekonekte oswa session la ekspire."
    );

    if (saveButton) {
      saveButton.disabled = true;
    }

    return;
  }

  if (saveButton) {
    saveButton.disabled = false;
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 INITIALIZE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(async function initSettings() {

  const authenticated =
    await verifySession();

  if (!authenticated) {

    showMessage(
      "❌ Session panel la pa valid oswa bot la dekonekte."
    );

    if (saveButton) {
      saveButton.disabled = true;
    }

    return;
  }

  await loadSettings();

})();


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏱️ AUTO CONNECTION CHECK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

setInterval(
  monitorSettings,
  5000
);