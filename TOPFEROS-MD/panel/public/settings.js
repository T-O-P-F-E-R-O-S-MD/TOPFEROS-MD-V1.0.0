"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║          ⚙️ SETTINGS PANEL — MULTI-SESSION       ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ LOGO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Nouvo logo:
// /assets/logo.png
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LOGO_URL = "/assets/logo.png";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 SESSION ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

const botLogo =
  document.getElementById(
    "botLogo"
  );


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ SETTINGS KI PANEL LA SIPÒTE
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
// 📢 SHOW MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showMessage(
  text = "",
  success = false
) {

  if (!settingsMessage) {
    return;
  }

  settingsMessage.textContent =
    text;

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

    showMessage(
      "❌ Session ID pa jwenn."
    );

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

    disableSave();

    return false;
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


    let result = {};

    try {
      result =
        await response.json();
    } catch {
      result = {};
    }


    if (
      !response.ok ||
      result.success !== true
    ) {

      showMessage(
        result.message ||
        "❌ Pa kapab chaje settings yo."
      );

      return false;
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🤖 BOT INFORMATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ⚙️ SETTINGS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const settings =
      result.settings || {};


    getSwitches()
      .forEach(input => {

        const name =
          input.dataset.setting;


        if (
          settingNames.includes(name) &&
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


    return true;


  } catch (error) {

    console.error(
      "❌ LOAD SETTINGS ERROR:",
      error
    );

    showMessage(
      "❌ Erè pandan chajman settings yo."
    );

    return false;
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
// 🤖 COLLECT BOT INFORMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function collectBotInformation() {

  return {

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

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 VALIDATE BOT INFORMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function validateBotInformation(bot) {

  if (!bot.name) {

    showMessage(
      "❌ Nom Bot pa ka vid."
    );

    botNameInput?.focus();

    return false;
  }


  if (
    !Number.isFinite(bot.age) ||
    bot.age < 0
  ) {

    showMessage(
      "❌ Âge Bot la pa valid."
    );

    botAgeInput?.focus();

    return false;
  }


  if (!bot.prefix) {

    showMessage(
      "❌ Prefix pa ka vid."
    );

    botPrefixInput?.focus();

    return false;
  }


  return true;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔒 DISABLE SAVE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function disableSave() {

  if (saveButton) {
    saveButton.disabled = true;
  }

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔓 ENABLE SAVE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function enableSave() {

  if (saveButton) {
    saveButton.disabled = false;
  }

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 SAVE SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function saveSettings() {

  showMessage("");


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔐 VERIFY CURRENT SESSION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const authenticated =
    await verifySession();


  if (!authenticated) {

    showMessage(
      "🔴 Bot la dekonekte oswa session la pa valid."
    );

    disableSave();

    return;
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🤖 BOT INFORMATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const bot =
    collectBotInformation();


  if (
    !validateBotInformation(bot)
  ) {

    return;
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚙️ SETTINGS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const settings =
    collectSettings();


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔒 DISABLE BUTTON
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (saveButton) {

    saveButton.disabled =
      true;

    saveButton.textContent =
      "Saving...";

  }


  try {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📡 SEND TO SERVER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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


    let result = {};

    try {
      result =
        await response.json();
    } catch {
      result = {};
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ SAVE ERROR
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ SAVE SUCCESS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
// 🖼️ SETUP LOGO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setupLogo() {

  if (!botLogo) {
    return;
  }


  botLogo.src =
    LOGO_URL;


  botLogo.alt =
    "TOPFEROS MD V1.0.0";


  botLogo.style.display =
    "block";


  botLogo.onerror =
    () => {

      console.warn(
        "⚠️ Logo pa kapab chaje:",
        LOGO_URL
      );

    };

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🦶 SETUP FOOTER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setupFooter() {

  let footer =
    document.querySelector(
      ".footer"
    );


  if (!footer) {

    footer =
      document.createElement(
        "div"
      );

    footer.className =
      "footer";


    document.body.appendChild(
      footer
    );

  }


  footer.innerHTML = `
    <div class="footer-line">
      =========================
    </div>

    <div class="footer-text">
      By TOPFEROS TECH
    </div>

    <div class="footer-line">
      =========================
    </div>
  `;


  footer.style.width =
    "100%";

  footer.style.textAlign =
    "center";

  footer.style.marginTop =
    "40px";

  footer.style.padding =
    "20px 10px";

  footer.style.boxSizing =
    "border-box";

  footer.style.fontWeight =
    "600";

  footer.style.fontSize =
    "14px";

  footer.style.lineHeight =
    "1.8";

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 MONITOR SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function monitorSettings() {

  if (!sessionId) {

    disableSave();

    return;
  }


  const authenticated =
    await verifySession();


  if (!authenticated) {

    showMessage(
      "🔴 Bot la dekonekte oswa session la ekspire."
    );

    disableSave();

    return;
  }


  enableSave();

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 INITIALIZE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function initSettings() {

  // 🖼️ Logo
  setupLogo();


  // 🦶 Footer
  setupFooter();


  // 🔐 Verify session
  const authenticated =
    await verifySession();


  if (!authenticated) {

    showMessage(
      "❌ Session panel la pa valid oswa bot la dekonekte."
    );

    disableSave();

    return;
  }


  // 📥 Load settings
  await loadSettings();

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 START
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

initSettings();


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏱️ AUTO CONNECTION CHECK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

setInterval(
  monitorSettings,
  5000
);


// ╔════════════════════════════════════════════════════╗
// ║                    By TOPFEROS TECH               ║
// ╚════════════════════════════════════════════════════╝