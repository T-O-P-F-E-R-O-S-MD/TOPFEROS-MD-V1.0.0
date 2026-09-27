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


const adminGroupNumberInput =
  document.getElementById(
    "adminGroupNumber"
  );

const adminGroupLinkInput =
  document.getElementById(
    "adminGroupLink"
  );

const groupCloseTimeInput =
  document.getElementById(
    "groupCloseTime"
  );

const groupOpenTimeInput =
  document.getElementById(
    "groupOpenTime"
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

  "antiCall",
  "antiDelete",
  "antiDeleteSameChat",
  "antiDeleteDM",
  "antiSpam",

  "aiChat",

  "groupAntiSpam",
  "groupAntiLink",
  "groupAntiDelete",

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

async function translatePanelUI() {

  if (
    currentLanguage === "en"
  ) {

    return;

  }


  if (
    translationInProgress
  ) {

    return;

  }


  translationInProgress =
    true;


  try {

    const elements = [];


    // ========================================================
    // TEXT ELEMENTS
    // ========================================================

    document
      .querySelectorAll(
        "button, label, p, h1, h2, h3, h4, h5, h6, span, small, div"
      )
      .forEach(
        element => {

          if (
            element.closest("script") ||
            element.closest("style") ||
            element.classList.contains(
              "slider"
            ) ||
            element.classList.contains(
              "hidden"
            )
          ) {

            return;

          }


          const text =
            element.textContent
              ?.replace(
                /\s+/g,
                " "
              )
              .trim();


          if (
            !text ||
            text.length > 300
          ) {

            return;

          }


          /*
           * Evite tradui parent ki
           * gen lòt elements ladan l.
           */

          const hasElementChild =
            Array.from(
              element.children || []
            )
              .some(
                child => {

                  const childText =
                    child.textContent
                      ?.replace(
                        /\s+/g,
                        " "
                      )
                      .trim();


                  return (
                    childText &&
                    text.includes(
                      childText
                    ) &&
                    childText !== text
                  );

                }
              );


          if (
            hasElementChild
          ) {

            return;

          }


          elements.push({
            element,
            text
          });

        }
      );


    // ========================================================
    // PLACEHOLDERS
    // ========================================================

    document
      .querySelectorAll(
        "input[placeholder], textarea[placeholder]"
      )
      .forEach(
        element => {

          const text =
            element
              .getAttribute(
                "placeholder"
              )
              ?.trim();


          if (!text) {

            return;

          }


          elements.push({
            element,
            text,
            type: "placeholder"
          });

        }
      );


    if (
      !elements.length
    ) {

      return;

    }


    // ========================================================
    // CACHE
    // ========================================================

    const textsToTranslate = [];

    const uniqueTexts =
      new Set();


    for (
      const item of elements
    ) {

      const cacheKey =
        `${currentLanguage}:${item.text}`;


      if (
        translationCache.has(
          cacheKey
        )
      ) {

        continue;

      }


      if (
        !uniqueTexts.has(
          item.text
        )
      ) {

        uniqueTexts.add(
          item.text
        );

        textsToTranslate.push(
          item.text
        );

      }

    }


    // ========================================================
    // AI API
    // ========================================================

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

            body:
              JSON.stringify({
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


        // ====================================================
        // ARRAY RESPONSE
        // ====================================================

        if (
          Array.isArray(
            translations
          )
        ) {

          textsToTranslate.forEach(
            (
              original,
              index
            ) => {

              const translated =
                translations[index];


              if (
                typeof translated ===
                  "string" &&
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


        // ====================================================
        // OBJECT RESPONSE
        // ====================================================

        else if (
          translations &&
          typeof translations ===
            "object"
        ) {

          textsToTranslate.forEach(
            original => {

              const translated =
                translations[
                  original
                ];


              if (
                typeof translated ===
                  "string" &&
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


    // ========================================================
    // APPLY TRANSLATIONS
    // ========================================================

    for (
      const item of elements
    ) {

      const translated =
        translationCache.get(
          `${currentLanguage}:${item.text}`
        );


      if (
        !translated
      ) {

        continue;

      }


      if (
        item.type ===
        "placeholder"
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
      error?.message ||
      error
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


  /*
   * Server la konnen lang user la.
   */

  await sendLanguage(
    language
  );


  /*
   * Apre language selection,
   * montre Number + Code.
   */

  showLoginScreen();


  /*
   * AI tradui login interface la.
   */

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


    /*
     * Si URL la gen session,
     * voye l tou.
     */

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


    // ========================================================
    // SESSION ID
    // ========================================================

    if (
      data.sessionId
    ) {

      sessionId =
        String(
          data.sessionId
        );

    }


    // ========================================================
    // SETTINGS DATA
    // ========================================================

    settings =
      data.settings ||
      {};

    botInformation =
      data.botInformation ||
      data.bot ||
      {};


    /*
     * Si verification lan pa voye
     * tout settings yo, chaje yo.
     */

    if (
      sessionId
    ) {

      await loadSettings();

    }


    // ========================================================
    // OPEN SETTINGS DIRECTLY
    // ========================================================

    showSettingsPanel();


    /*
     * Logo Settings Panel la rete.
     */

    setupLogo();


    /*
     * AI tradui vrè Settings Panel la
     * nan lang user la te chwazi a.
     */

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

      /*
       * Eseye alternate query format.
       */

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

  // ========================================================
  // ⚙️ SWITCH SETTINGS
  // ========================================================

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


  // ========================================================
  // 👥 GROUP MANAGEMENT
  // ========================================================

  collected.adminGroupNumber =
    adminGroupNumberInput
      ? adminGroupNumberInput.value
          .trim()
          .replace(/\D/g, "")
      : "";


  collected.adminGroupLink =
    adminGroupLinkInput
      ? adminGroupLinkInput.value
          .trim()
      : "";


  collected.groupCloseTime =
    groupCloseTimeInput
      ? groupCloseTimeInput.value
      : "";


  collected.groupOpenTime =
    groupOpenTimeInput
      ? groupOpenTimeInput.value
      : "";


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


  /*
   * ⚠️ TAG OFFISYÈL LA
   */

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

async function monitorSettings() {

  /*
   * Pa fè monitor pandan login.
   */

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

}


// ============================================================
// 🚀 INITIALIZE
// ============================================================

async function initSettings() {

  setupLogo();

  setupFooter();

  setupAntiDeleteDestination();


  /*
   * Number input
   */

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


  /*
   * Code input
   */

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


  /*
   * ========================================================
   * SI USER DEJA CHWAZI LANG ANVAN
   * ========================================================
   */

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


  /*
   * Premye ekran an toujou
   * Language Panel la si pa gen
   * verification deja fèt.
   */

  showLanguageScreen();


  /*
   * Si yon language deja chwazi,
   * tradui Language Panel la tou.
   */

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