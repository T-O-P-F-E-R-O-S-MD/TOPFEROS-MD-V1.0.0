"use strict";


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🦁 TOPFEROS MD — SETTINGS PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


// ============================================================
// 🔐 URL / SESSION
// ============================================================

const params =
  new URLSearchParams(
    window.location.search
  );

let sessionId =
  params.get("session") || "";


// ============================================================
// 🌐 LANGUAGE
// ============================================================

let currentLanguage =
  localStorage.getItem(
    "topferos_settings_language"
  ) || "en";


// ============================================================
// 🤖 AI TRANSLATION
// ============================================================

let translationInProgress =
  false;

const translationCache =
  new Map();


// ============================================================
// 📦 SETTINGS DATA
// ============================================================

let settings = {};

let botInformation = {};


// ============================================================
// 🖼️ LOGO
// ============================================================

const LOGO_URL =
  "/assets/logo.png";


// ============================================================
// 📦 ELEMENTS
// ============================================================

const languageScreen =
  document.getElementById(
    "languageScreen"
  );

const loginScreen =
  document.getElementById(
    "loginScreen"
  );

const settingsPanel =
  document.getElementById(
    "settingsPanel"
  );

const settingsNumberInput =
  document.getElementById(
    "settingsNumber"
  );

const settingsCodeInput =
  document.getElementById(
    "settingsCode"
  );

const verifyButton =
  document.getElementById(
    "verifyButton"
  );

const loginMessage =
  document.getElementById(
    "loginMessage"
  );

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


// ============================================================
// ⚙️ SETTINGS KI PANEL LA SIPÒTE
// ============================================================

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
  "antiDeleteSameChat",
  "antiDeleteDM",
  "antiSpam",

  "aiChat",

  "groupAntiSpam",
  "groupAntiLink",
  "groupAntiDelete",

  "adminGroup",

  "groupClose",
  "groupOpen"

];


// ============================================================
// 🖥️ SCREEN CONTROL
// ============================================================

function hideAllScreens() {

  languageScreen?.classList.add(
    "hidden"
  );

  loginScreen?.classList.add(
    "hidden"
  );

  settingsPanel?.classList.add(
    "hidden"
  );

}


function showLanguageScreen() {

  hideAllScreens();

  languageScreen?.classList.remove(
    "hidden"
  );

}


function showLoginScreen() {

  hideAllScreens();

  loginScreen?.classList.remove(
    "hidden"
  );

}


function showSettingsPanel() {

  hideAllScreens();

  settingsPanel?.classList.remove(
    "hidden"
  );

}


// ============================================================
// 🌐 SEND LANGUAGE TO SERVER
// ============================================================

async function sendLanguage(
  language
) {

  try {

    await fetch(
      "/api/language",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            sessionId,
            language
          })

      }
    );

  } catch (error) {

    console.warn(
      "⚠️ Language server sync failed:",
      error
    );

  }

}


// ============================================================
// 🤖 AI TRANSLATE PANEL
// ============================================================

function restoreOriginalUI() {

  document
    .querySelectorAll(
      "[data-topferos-original-text]"
    )
    .forEach(element => {

      const original =
        element.getAttribute(
          "data-topferos-original-text"
        );

      if (
        original !== null &&
        element.textContent !== original
      ) {

        element.textContent = original;

      }

    });


  document
    .querySelectorAll(
      "[data-topferos-original-placeholder]"
    )
    .forEach(element => {

      const original =
        element.getAttribute(
          "data-topferos-original-placeholder"
        );

      if (original !== null) {

        element.setAttribute(
          "placeholder",
          original
        );

      }

    });

}


function rememberOriginalText(element) {

  if (
    !element.hasAttribute(
      "data-topferos-original-text"
    )
  ) {

    element.setAttribute(
      "data-topferos-original-text",
      element.textContent
        ?.replace(/\s+/g, " ")
        .trim() || ""
    );

  }

}


function rememberOriginalPlaceholder(element) {

  if (
    !element.hasAttribute(
      "data-topferos-original-placeholder"
    )
  ) {

    const placeholder =
      element
        .getAttribute("placeholder")
        ?.trim() || "";

    element.setAttribute(
      "data-topferos-original-placeholder",
      placeholder
    );

  }

}


async function translatePanelUI() {

  if (
    translationInProgress
  ) {

    return;

  }


  if (
    currentLanguage === "en"
  ) {

    restoreOriginalUI();

    return;

  }


  translationInProgress =
    true;


  try {

    restoreOriginalUI();


    const elements = [];


    document
      .querySelectorAll(
        "button, label, p, h1, h2, h3, h4, h5, h6, span, small, div"
      )
      .forEach(element => {

        if (
          element.closest("script") ||
          element.closest("style") ||
          element.classList.contains("slider") ||
          element.classList.contains("hidden")
        ) {

          return;

        }


        const text =
          element.textContent
            ?.replace(/\s+/g, " ")
            .trim();


        if (
          !text ||
          text.length > 300
        ) {

          return;

        }


        const hasElementChild =
          Array.from(
            element.children || []
          ).some(child => {

            const childText =
              child.textContent
                ?.replace(/\s+/g, " ")
                .trim();

            return (
              childText &&
              text.includes(childText) &&
              childText !== text
            );

          });


        if (
          hasElementChild
        ) {

          return;

        }


        rememberOriginalText(element);


        const original =
          element.getAttribute(
            "data-topferos-original-text"
          )?.trim();


        if (!original) {

          return;

        }


        elements.push({
          element,
          text: original
        });

      });


    document
      .querySelectorAll(
        "input[placeholder], textarea[placeholder]"
      )
      .forEach(element => {

        if (
          element.closest(".hidden") ||
          element.disabled
        ) {

          return;

        }


        rememberOriginalPlaceholder(element);


        const text =
          element.getAttribute(
            "data-topferos-original-placeholder"
          )?.trim();


        if (!text) {

          return;

        }


        elements.push({
          element,
          text,
          type: "placeholder"
        });

      });


    if (
      !elements.length
    ) {

      return;

    }


    const textsToTranslate = [];
    const uniqueTexts = new Set();


    for (
      const item of elements
    ) {

      const cacheKey =
        `${currentLanguage}:${item.text}`;


      if (
        translationCache.has(cacheKey)
      ) {

        continue;

      }


      if (
        !uniqueTexts.has(item.text)
      ) {

        uniqueTexts.add(item.text);

        textsToTranslate.push(
          item.text
        );

      }

    }


    if (
      textsToTranslate.length
    ) {

      const response =
        await fetch(
          "/api/translate",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              language:
                currentLanguage,

              texts:
                textsToTranslate
            })

          }
        );


      if (
        response.ok
      ) {

        const data =
          await response.json();

        const translations =
          data.translations;


        if (
          Array.isArray(translations)
        ) {

          textsToTranslate.forEach(
            (original, index) => {

              const translated =
                translations[index];

              if (
                typeof translated === "string" &&
                translated.trim()
              ) {

                translationCache.set(
                  `${currentLanguage}:${original}`,
                  translated.trim()
                );

              }

            }
          );

        }


        else if (
          translations &&
          typeof translations === "object"
        ) {

          textsToTranslate.forEach(
            original => {

              const translated =
                translations[original];

              if (
                typeof translated === "string" &&
                translated.trim()
              ) {

                translationCache.set(
                  `${currentLanguage}:${original}`,
                  translated.trim()
                );

              }

            }
          );

        }

      }

    }


    for (
      const item of elements
    ) {

      const translated =
        translationCache.get(
          `${currentLanguage}:${item.text}`
        );


      if (!translated) {

        continue;

      }


      if (
        item.type === "placeholder"
      ) {

        item.element.setAttribute(
          "placeholder",
          translated
        );

      } else {

        item.element.textContent =
          translated;

      }

    }


  } catch (error) {

    console.warn(
      "⚠️ AI Settings translation unavailable:",
      error?.message || error
    );

  } finally {

    translationInProgress =
      false;

  }

}


// ============================================================
// 🌐 SELECT LANGUAGE
// ============================================================

async function selectSettingsLanguage(
  language
) {

  if (
    ![
      "en",
      "fr",
      "es"
    ].includes(language)
  ) {

    return;

  }


  currentLanguage =
    language;


  localStorage.setItem(
    "topferos_settings_language",
    language
  );


  await sendLanguage(
    language
  );


  showLoginScreen();


  await translatePanelUI();

}


// ============================================================
// 🔐 LOGIN MESSAGE
// ============================================================

function showLoginMessage(
  text,
  error = true
) {

  if (!loginMessage) {

    return;

  }


  loginMessage.textContent =
    text;


  loginMessage.className =
    error
      ? "message error"
      : "message success";

}


// ============================================================
// 📢 SETTINGS MESSAGE
// ============================================================

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


// ============================================================
// 🔐 VERIFY SETTINGS CODE
// ============================================================

async function verifySettings() {

  const code =
    settingsCodeInput
      ?.value
      .trim()
      .toUpperCase() || "";


  const number =
    settingsNumberInput
      ?.value
      .trim()
      .replace(
        /\D/g,
        ""
      ) || "";


  if (!number) {

    showLoginMessage(
      "❌ Mete Number la.",
      true
    );

    settingsNumberInput?.focus();

    return;

  }


  if (!code) {

    showLoginMessage(
      "❌ Mete Settings Code la.",
      true
    );

    settingsCodeInput?.focus();

    return;

  }


  if (
    !/^[A-Z0-9]{6}$/.test(
      code
    )
  ) {

    showLoginMessage(
      "❌ Settings Code la dwe gen 6 karaktè.",
      true
    );

    settingsCodeInput?.focus();

    return;

  }


  if (verifyButton) {

    verifyButton.disabled =
      true;

    verifyButton.textContent =
      "⏳ VERIFYING...";

  }


  showLoginMessage(
    "",
    false
  );


  try {

    const body = {

      number,

      code

    };


    if (
      sessionId
    ) {

      body.sessionId =
        sessionId;

    }


    const response =
      await fetch(
        "/api/verify",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(
              body
            )

        }
      );


    let data = {};

    try {

      data =
        await response.json();

    } catch {

      data = {};

    }


    if (
      !response.ok ||
      data.success !== true
    ) {

      showLoginMessage(
        data.error ||
        data.message ||
        "❌ Settings Code pa kòrèk.",
        true
      );

      return;

    }


    if (
      data.sessionId
    ) {

      sessionId =
        String(
          data.sessionId
        );

    }


    settings =
      data.settings ||
      {};

    botInformation =
      data.botInformation ||
      data.bot ||
      {};


    if (
      sessionId
    ) {

      await loadSettings();

    }


    showSettingsPanel();


    setupLogo();


    await translatePanelUI();


  } catch (error) {

    console.error(
      "❌ SETTINGS VERIFICATION ERROR:",
      error
    );


    showLoginMessage(
      "❌ Erè koneksyon ak server la.",
      true
    );


  } finally {

    if (verifyButton) {

      verifyButton.disabled =
        false;

      verifyButton.textContent =
        "🔓 VERIFY";

    }

  }

}


// ============================================================
// 📥 LOAD SETTINGS
// ============================================================

async function loadSettings() {

  if (!sessionId) {

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

      const alternateResponse =
        await fetch(
          `/api/settings?sessionId=${encodeURIComponent(
            sessionId
          )}`,
          {
            method: "GET",
            cache: "no-store"
          }
        );


      let alternate =
        {};

      try {

        alternate =
          await alternateResponse.json();

      } catch {

        alternate =
          {};

      }


      if (
        !alternateResponse.ok ||
        alternate.success !== true
      ) {

        showMessage(
          result.message ||
          "❌ Pa kapab chaje settings yo."
        );

        return false;

      }


      result =
        alternate;

    }


    // ========================================================
    // BOT INFORMATION
    // ========================================================

    const bot =
      result.bot ||
      result.botInformation ||
      {};


    botInformation =
      bot;


    if (
      botNameInput
    ) {

      botNameInput.value =
        bot.name ||
        "TOPFEROS MD";

    }


    if (
      botAgeInput
    ) {

      botAgeInput.value =
        bot.age ??
        "";

    }


    if (
      botPrefixInput
    ) {

      botPrefixInput.value =
        bot.prefix ||
        ".";

    }


    // ========================================================
    // SETTINGS
    // ========================================================

    settings =
      result.settings ||
      {};


    getSwitches()
      .forEach(
        input => {

          const name =
            input.dataset.setting;


          if (
            settingNames.includes(
              name
            ) &&
            Object.prototype.hasOwnProperty.call(
              settings,
              name
            )
          ) {

            input.checked =
              settings[name] === true;

          }

        }
      );


    enforceAntiDeleteDestination();


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


// ============================================================
// 🔎 GET SWITCHES
// ============================================================

function getSwitches() {

  return Array.from(
    document.querySelectorAll(
      "input[data-setting]"
    )
  );

}


// ============================================================
// 📤 COLLECT SETTINGS
// ============================================================

function collectSettings() {

  enforceAntiDeleteDestination();


  const collected = {};


  getSwitches()
    .forEach(
      input => {

        const name =
          input.dataset.setting;


        if (
          settingNames.includes(
            name
          )
        ) {

          collected[name] =
            input.checked;

        }

      }
    );


  return collected;

}


// ============================================================
// 🗑️ ANTI DELETE DESTINATION
// ============================================================

function enforceAntiDeleteDestination() {

  const sameChat =
    document.querySelector(
      'input[data-setting="antiDeleteSameChat"]'
    );

  const dmBot =
    document.querySelector(
      'input[data-setting="antiDeleteDM"]'
    );


  if (
    !sameChat ||
    !dmBot
  ) {

    return;

  }


  if (
    sameChat.checked &&
    dmBot.checked
  ) {

    dmBot.checked =
      false;

  }

}


// ============================================================
// 🔄 SETUP ANTI DELETE
// ============================================================

function setupAntiDeleteDestination() {

  const sameChat =
    document.querySelector(
      'input[data-setting="antiDeleteSameChat"]'
    );

  const dmBot =
    document.querySelector(
      'input[data-setting="antiDeleteDM"]'
    );


  if (
    !sameChat ||
    !dmBot
  ) {

    return;

  }


  sameChat.addEventListener(
    "change",
    () => {

      if (
        sameChat.checked
      ) {

        dmBot.checked =
          false;

      }

    }
  );


  dmBot.addEventListener(
    "change",
    () => {

      if (
        dmBot.checked
      ) {

        sameChat.checked =
          false;

      }

    }
  );

}


// ============================================================
// 🤖 BOT INFORMATION
// ============================================================

function collectBotInformation() {

  return {

    name:
      botNameInput
        ? botNameInput.value.trim()
        : "",

    location:
      document.getElementById(
        "botLocation"
      )
        ? document
            .getElementById(
              "botLocation"
            )
            .value
            .trim()
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
        : ".",

    footer:
      document.getElementById(
        "botFooter"
      )
        ? document
            .getElementById(
              "botFooter"
            )
            .value
            .trim()
        : ""

  };

}


// ============================================================
// 🔎 VALIDATE BOT INFORMATION
// ============================================================

function validateBotInformation(
  bot
) {

  if (
    !bot.name
  ) {

    showMessage(
      "❌ Nom Bot pa ka vid."
    );

    botNameInput?.focus();

    return false;

  }


  if (
    !Number.isFinite(
      bot.age
    ) ||
    bot.age < 0
  ) {

    showMessage(
      "❌ Âge Bot la pa valid."
    );

    botAgeInput?.focus();

    return false;

  }


  if (
    !bot.prefix
  ) {

    showMessage(
      "❌ Prefix pa ka vid."
    );

    botPrefixInput?.focus();

    return false;

  }


  return true;

}


// ============================================================
// 🔐 VERIFY CURRENT SESSION
// ============================================================

async function verifySession() {

  if (
    !sessionId
  ) {

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


    if (
      !response.ok
    ) {

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


// ============================================================
// 🔒 DISABLE SAVE
// ============================================================

function disableSave() {

  if (
    saveButton
  ) {

    saveButton.disabled =
      true;

  }

}


// ============================================================
// 🔓 ENABLE SAVE
// ============================================================

function enableSave() {

  if (
    saveButton
  ) {

    saveButton.disabled =
      false;

  }

}


// ============================================================
// 💾 SAVE SETTINGS
// ============================================================

async function saveSettings() {

  showMessage("");


  const authenticated =
    await verifySession();


  if (
    !authenticated
  ) {

    showMessage(
      "🔴 Bot la dekonekte oswa session la pa valid."
    );

    disableSave();

    return;

  }


  const bot =
    collectBotInformation();


  if (
    !validateBotInformation(
      bot
    )
  ) {

    return;

  }


  const collectedSettings =
    collectSettings();


  if (
    saveButton
  ) {

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

              settings:
                collectedSettings

            })

        }
      );


    let result = {};

    try {

      result =
        await response.json();

    } catch {

      result =
        {};

    }


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


    settings =
      collectedSettings;


    botInformation =
      bot;


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

    if (
      saveButton
    ) {

      saveButton.disabled =
        false;

      saveButton.textContent =
        "SAVE ✅";

    }

  }

}


// ============================================================
// 🖱️ SAVE BUTTON
// ============================================================

if (
  saveButton
) {

  saveButton.addEventListener(
    "click",
    saveSettings
  );

}


// ============================================================
// 🖼️ SETUP LOGO
// ============================================================

function setupLogo() {

  if (
    !botLogo
  ) {

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


// ============================================================
// 🦶 SETUP FOOTER
// ============================================================

function setupFooter() {

  let footer =
    document.querySelector(
      ".footer"
    );


  if (
    !footer
  ) {

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
      🦁 TECH BY TOPFEROS MD
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


// ============================================================
// 🔄 MONITOR SESSION
// ============================================================

let monitoringSettings = false;

async function monitorSettings() {

  if (monitoringSettings) {
    return;
  }

  monitoringSettings = true;

  try {

  if (
    settingsPanel?.classList.contains(
      "hidden"
    )
  ) {

    return;

  }


  if (
    !sessionId
  ) {

    disableSave();

    return;

  }


  const authenticated =
    await verifySession();


  if (
    !authenticated
  ) {

    showMessage(
      "🔴 Bot la dekonekte oswa session la ekspire."
    );

    disableSave();

    return;

  }


  enableSave();
  } finally {
    monitoringSettings = false;
  }

}


// ============================================================
// 🚀 INITIALIZE
// ============================================================

async function initSettings() {

  setupLogo();

  setupFooter();

  setupAntiDeleteDestination();


  if (
    settingsNumberInput
  ) {

    settingsNumberInput.addEventListener(
      "input",
      event => {

        event.target.value =
          event.target.value
            .replace(
              /\D/g,
              ""
            );

      }
    );

  }


  if (
    settingsCodeInput
  ) {

    settingsCodeInput.addEventListener(
      "input",
      event => {

        event.target.value =
          event.target.value
            .toUpperCase()
            .replace(
              /[^A-Z0-9]/g,
              ""
            )
            .slice(
              0,
              6
            );

      }
    );


    settingsCodeInput.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
        ) {

          verifySettings();

        }

      }
    );

  }


  if (
    localStorage.getItem(
      "topferos_settings_language"
    )
  ) {

    currentLanguage =
      localStorage.getItem(
        "topferos_settings_language"
      );

  }


  showLanguageScreen();


  await translatePanelUI();

}


// ============================================================
// 🌐 GLOBAL FUNCTIONS
// ============================================================

window.selectSettingsLanguage =
  selectSettingsLanguage;

window.verifySettings =
  verifySettings;

window.saveSettings =
  saveSettings;


// ============================================================
// 🚀 START
// ============================================================

initSettings();


// ============================================================
// ⏱️ AUTO CONNECTION CHECK
// ============================================================

setInterval(
  monitorSettings,
  5000
);


// ╔════════════════════════════════════════════════════╗
// ║             🦁 TECH BY TOPFEROS MD               ║
// ╚════════════════════════════════════════════════════╝