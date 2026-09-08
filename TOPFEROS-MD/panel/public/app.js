"use strict";

/* =========================
   URL / SESSION
========================= */

const params = new URLSearchParams(
  window.location.search
);

let sessionId =
  params.get("session") || "";

let currentLanguage = "en";

let settings = {};
let botInformation = {};

let statusTimer = null;

let pairingInProgress = false;

let pairingCooldownTimer = null;
let pairingCooldownSeconds = 0;

const PAIRING_COOLDOWN = 90;


/* =========================
   SETTINGS GROUPS
========================= */

const groups = {

  general: [
    ["publicMode", "Public Mode"],
    ["privateMode", "Private Mode"],
    ["alwaysOnline", "Always Online"],
    ["fakeTyping", "Fake Typing"],
    ["fakeRecording", "Fake Recording"]
  ],

  protection: [
    ["antiCall", "Anti Call"],
    ["antiDelete", "Anti Delete"],
    ["antiSpam", "Anti Spam"],
    ["antiLink", "Anti Link"],
    ["antiRobot", "Anti Robot"]
  ],

  status: [
    ["autoStatus", "Auto Status"],
    ["statusReply", "Status Reply"],
    ["statusLike", "Status Like"],
    ["statusReact", "Status React"]
  ],

  group: [
    ["groupAntiSpam", "Group Anti Spam"],
    ["groupAntiLink", "Group Anti Link"],
    ["groupAntiDelete", "Group Anti Delete"],
    ["groupClose", "Group Close"],
    ["groupOpen", "Group Open"]
  ],

  ai: [
    ["aiChat", "AI Chat"]
  ]

};


/* =========================
   DOM READY
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    showLanguage();

    setupSettingsCodeInput();

    setupPhoneInput();

    checkExistingConnection();

  }
);


/* =========================
   SHORT DOM FUNCTION
========================= */

function $(id) {
  return document.getElementById(id);
}


/* =========================
   SCREEN CONTROL
========================= */

function hideAllScreens() {

  $("languageScreen")?.classList.add(
    "hidden"
  );

  $("connectScreen")?.classList.add(
    "hidden"
  );

  $("loginScreen")?.classList.add(
    "hidden"
  );

  $("dashboard")?.classList.add(
    "hidden"
  );

}


function showLanguage() {

  hideAllScreens();

  $("languageScreen")?.classList.remove(
    "hidden"
  );

}


/* =========================
   LANGUAGE
========================= */

async function selectLanguage(
  language
) {

  currentLanguage =
    language;

  hideAllScreens();

  $("connectScreen")?.classList.remove(
    "hidden"
  );

  await sendLanguage(
    language
  );

  startConnectionMonitor();

}


/* =========================
   SEND LANGUAGE
========================= */

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

        body: JSON.stringify({
          sessionId,
          language
        })

      }
    );

  } catch (error) {

    console.error(
      "Language error:",
      error
    );

  }

}


/* =========================
   PHONE INPUT
========================= */

function setupPhoneInput() {

  const input =
    $("phoneNumber");

  if (!input) {
    return;
  }


  input.addEventListener(
    "input",
    event => {

      event.target.value =
        event.target.value
          .replace(/\D/g, "");

    }
  );


  input.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Enter"
      ) {

        requestPairingCode();

      }

    }
  );

}


/* =========================
   REQUEST PAIRING CODE
========================= */

async function requestPairingCode() {

  if (
    pairingInProgress
  ) {

    return;

  }


  if (
    pairingCooldownSeconds > 0
  ) {

    updatePairingCooldownUI();

    return;

  }


  const input =
    $("phoneNumber");

  const button =
    $("pairingButton");

  const message =
    $("pairingMessage");

  const pairingBox =
    $("pairingBox");

  const codeElement =
    $("pairingCode");

  const copyButton =
    $("copyPairingButton");

  const status =
    $("connectStatus");


  const number =
    input?.value
      .trim()
      .replace(/\D/g, "") || "";


  /* =========================
     VALIDATE NUMBER
  ========================== */

  if (!number) {

    showPairingMessage(
      "❌ Mete nimewo WhatsApp ou an.",
      true
    );

    return;

  }


  if (
    number.length < 8
  ) {

    showPairingMessage(
      "❌ Nimewo WhatsApp la pa valab.",
      true
    );

    return;

  }


  /* =========================
     UI LOADING
  ========================== */

  pairingInProgress =
    true;


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "⏳ GENERATING...";

  }


  if (pairingBox) {

    pairingBox.classList.add(
      "hidden"
    );

  }


  if (codeElement) {

    codeElement.textContent =
      "----";

  }


  if (copyButton) {

    copyButton.disabled =
      true;

    copyButton.textContent =
      "📋 COPY CODE";

  }


  if (status) {

    status.textContent =
      "🟡 Generating Pairing Code...";

  }


  if (message) {

    message.textContent =
      "";

  }


  /* =========================
     REQUEST SERVER
  ========================== */

  try {

    const response =
      await fetch(
        "/api/pairing",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            number
          })

        }
      );


    let data = {};

    try {

      data =
        await response.json();

    } catch {

      data = {};

    }


    /* =========================
       SERVER ERROR
    ========================== */

    if (
      !response.ok ||
      !data.success
    ) {

      const error =
        new Error(
          data.message ||
          data.error ||
          "PAIRING_FAILED"
        );


      if (
        data.cooldownSeconds
      ) {

        startPairingCooldown(
          Number(
            data.cooldownSeconds
          )
        );

      }


      throw error;

    }


    /* =========================
       VALIDATE SERVER CODE
    ========================== */

    const rawCode =
      String(
        data.code || ""
      )
      .replace(/\s/g, "")
      .toUpperCase();


    if (
      !rawCode
    ) {

      throw new Error(
        "SERVER_RETURNED_EMPTY_PAIRING_CODE"
      );

    }


    if (
      rawCode.length !== 8
    ) {

      console.warn(
        "Unexpected pairing code length:",
        rawCode.length,
        rawCode
      );

    }


    /* =========================
       SHOW CODE
    ========================== */

    if (codeElement) {

      codeElement.textContent =
        formatPairingCode(
          rawCode
        );

    }


    if (copyButton) {

      copyButton.disabled =
        false;

      copyButton.textContent =
        "📋 COPY CODE";

    }


    if (pairingBox) {

      pairingBox.classList.remove(
        "hidden"
      );

    }


    if (status) {

      status.textContent =
        "🟡 Pairing Code generated. Waiting for WhatsApp...";

    }


    showPairingMessage(
      "✅ Pairing Code la pare. Antre li nan WhatsApp ou.",
      false
    );


    /* =========================
       COOLDOWN
    ========================== */

    startPairingCooldown(
      Number(
        data.cooldownSeconds ||
        PAIRING_COOLDOWN
      )
    );


    /* =========================
       MONITOR CONNECTION
    ========================== */

    startConnectionMonitor();

  } catch (error) {

    console.error(
      "Pairing error:",
      error
    );


    if (status) {

      status.textContent =
        "🔴 Connection failed.";

    }


    showPairingMessage(
      "❌ " +
        (
          error.message ||
          "Pa kapab kreye Pairing Code la."
        ),
      true
    );

  } finally {

    pairingInProgress =
      false;


    updatePairingCooldownUI();

  }

}


/* =========================
   FORMAT PAIRING CODE
========================= */

function formatPairingCode(
  code
) {

  if (!code) {

    return "----";

  }


  const clean =
    String(code)
      .replace(/\s/g, "")
      .toUpperCase();


  if (
    clean.length <= 4
  ) {

    return clean;

  }


  return clean
    .match(/.{1,4}/g)
    .join(" ");

}


/* =========================
   COPY PAIRING CODE
========================= */

async function copyPairingCode() {

  const codeElement =
    $("pairingCode");

  const button =
    $("copyPairingButton");


  if (!codeElement) {

    return;

  }


  const code =
    codeElement.textContent
      .trim()
      .replace(/\s/g, "")
      .toUpperCase();


  if (
    !code ||
    code === "----"
  ) {

    showPairingMessage(
      "❌ Pa gen Pairing Code pou kopye.",
      true
    );

    return;

  }


  try {

    /* =========================
       MODERN CLIPBOARD
    ========================== */

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {

      await navigator.clipboard.writeText(
        code
      );

    } else {

      /* =========================
         FALLBACK
      ========================== */

      const textarea =
        document.createElement(
          "textarea"
        );

      textarea.value =
        code;

      textarea.style.position =
        "fixed";

      textarea.style.left =
        "-9999px";

      textarea.style.top =
        "0";

      textarea.setAttribute(
        "readonly",
        ""
      );

      document.body.appendChild(
        textarea
      );

      textarea.focus();

      textarea.select();

      textarea.setSelectionRange(
        0,
        textarea.value.length
      );

      const copied =
        document.execCommand(
          "copy"
        );

      textarea.remove();

      if (!copied) {

        throw new Error(
          "COPY_FAILED"
        );

      }

    }


    if (button) {

      button.disabled =
        true;

      button.textContent =
        "✅ COPIED!";

      setTimeout(
        () => {

          button.disabled =
            false;

          button.textContent =
            "📋 COPY CODE";

        },
        2000
      );

    }


    showPairingMessage(
      "✅ Pairing Code la kopye. Ou ka kole li nan WhatsApp.",
      false
    );


  } catch (error) {

    console.error(
      "Copy pairing code error:",
      error
    );


    showPairingMessage(
      "❌ Pa kapab kopye code la. Seleksyone code la epi kopye li manyèlman.",
      true
    );

  }

}


/* =========================
   PAIRING MESSAGE
========================= */

function showPairingMessage(
  message,
  error = false
) {

  const element =
    $("pairingMessage");

  if (!element) {

    return;

  }


  element.textContent =
    message;

  element.className =
    "message " +
    (
      error
        ? "error"
        : "success"
    );

}


/* =========================
   PAIRING COOLDOWN
========================= */

function startPairingCooldown(
  seconds
) {

  stopPairingCooldown(
    false
  );


  pairingCooldownSeconds =
    Math.max(
      0,
      Number(seconds) ||
      PAIRING_COOLDOWN
    );


  updatePairingCooldownUI();


  if (
    pairingCooldownSeconds <= 0
  ) {

    return;

  }


  pairingCooldownTimer =
    setInterval(
      () => {

        pairingCooldownSeconds--;

        updatePairingCooldownUI();


        if (
          pairingCooldownSeconds <= 0
        ) {

          stopPairingCooldown();

        }

      },
      1000
    );

}


/* =========================
   UPDATE COOLDOWN UI
========================= */

function updatePairingCooldownUI() {

  const button =
    $("pairingButton");

  if (!button) {

    return;

  }


  if (
    pairingInProgress
  ) {

    button.disabled =
      true;

    button.textContent =
      "⏳ GENERATING...";

    return;

  }


  if (
    pairingCooldownSeconds > 0
  ) {

    button.disabled =
      true;

    button.textContent =
      `⏳ WAIT ${pairingCooldownSeconds}s`;

    return;

  }


  button.disabled =
    false;

  button.textContent =
    "🔐 GET PAIRING CODE";

}


/* =========================
   STOP COOLDOWN
========================= */

function stopPairingCooldown(
  updateUI = true
) {

  if (
    pairingCooldownTimer
  ) {

    clearInterval(
      pairingCooldownTimer
    );

    pairingCooldownTimer =
      null;

  }


  pairingCooldownSeconds =
    0;


  if (updateUI) {

    updatePairingCooldownUI();

  }

}


/* =========================
   CONNECTION MONITOR
========================= */

function startConnectionMonitor() {

  if (statusTimer) {

    clearInterval(
      statusTimer
    );

  }


  checkBotStatus();


  statusTimer =
    setInterval(
      checkBotStatus,
      3000
    );

}


/* =========================
   CHECK BOT STATUS
========================= */

async function checkBotStatus() {

  try {

    const response =
      await fetch(
        "/api/status",
        {
          cache: "no-store"
        }
      );


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.success
    ) {

      return;

    }


    if (
      data.connected
    ) {

      updateConnectionUI(
        true,
        data.number || ""
      );


      stopConnectionMonitor();

      stopPairingCooldown();


      await findConnectedSession(
        data.number || ""
      );


    } else {

      updateConnectionUI(
        false,
        ""
      );

    }

  } catch (error) {

    console.error(
      "Status check error:",
      error
    );

  }

}


/* =========================
   UPDATE CONNECTION UI
========================= */

function updateConnectionUI(
  connected,
  number = ""
) {

  const status =
    $("connectStatus");


  if (!status) {

    return;

  }


  if (
    connected
  ) {

    status.textContent =
      "🟢 WhatsApp Bot Connected";


    showPairingMessage(
      "✅ Bot la konekte avèk siksè.",
      false
    );


    if (
      $("botNumber")
    ) {

      $("botNumber").value =
        number;

    }


  } else {

    status.textContent =
      "⚪ Waiting for WhatsApp connection...";

  }

}


/* =========================
   STOP CONNECTION MONITOR
========================= */

function stopConnectionMonitor() {

  if (statusTimer) {

    clearInterval(
      statusTimer
    );

    statusTimer =
      null;

  }

}


/* =========================
   FIND CONNECTED SESSION
========================= */

async function findConnectedSession(
  number = ""
) {

  if (
    sessionId
  ) {

    const valid =
      await validateSession(
        sessionId
      );


    if (valid) {

      showSettingsLogin();

      return;

    }

  }


  if (
    number
  ) {

    showPairingMessage(
      "🟢 Bot la konekte. Louvri Settings Link ou a pou antre Settings Code la.",
      false
    );

  }

}


/* =========================
   CHECK EXISTING CONNECTION
========================= */

async function checkExistingConnection() {

  try {

    const response =
      await fetch(
        "/api/status",
        {
          cache: "no-store"
        }
      );


    const data =
      await response.json();


    if (
      data.success &&
      data.connected
    ) {

      updateConnectionUI(
        true,
        data.number || ""
      );

    }

  } catch (error) {

    console.error(
      "Initial status error:",
      error
    );

  }

}


/* =========================
   VALIDATE SESSION
========================= */

async function validateSession(
  id
) {

  if (!id) {

    return false;

  }


  try {

    const response =
      await fetch(
        `/api/session/${encodeURIComponent(
          id
        )}`,
        {
          cache: "no-store"
        }
      );


    const data =
      await response.json();


    return (
      response.ok &&
      data.success &&
      data.exists
    );


  } catch (error) {

    console.error(
      "Session validation error:",
      error
    );


    return false;

  }

}


/* =========================
   SETTINGS LOGIN
========================= */

function showSettingsLogin() {

  hideAllScreens();


  $("loginScreen")?.classList.remove(
    "hidden"
  );

}


/* =========================
   BACK TO CONNECT
========================= */

function backToConnect() {

  hideAllScreens();


  $("connectScreen")?.classList.remove(
    "hidden"
  );


  startConnectionMonitor();

}


/* =========================
   VERIFY SETTINGS
========================= */

async function verifySettings() {

  const code =
    $("settingsCode")
      ?.value
      .trim()
      .toUpperCase() || "";


  if (!sessionId) {

    showLoginMessage(
      "❌ Session ID pa jwenn.",
      true
    );

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

    return;

  }


  const button =
    $("verifyButton");


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "⏳ VERIFYING...";

  }


  try {

    const response =
      await fetch(
        "/api/verify",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            sessionId,
            code
          })

        }
      );


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.success
    ) {

      showLoginMessage(
        "❌ Settings Code pa kòrèk.",
        true
      );

      return;

    }


    settings =
      data.settings || {};


    botInformation =
      data.botInformation || {};


    openDashboard();


  } catch (error) {

    console.error(
      "Verification error:",
      error
    );


    showLoginMessage(
      "❌ Erè koneksyon ak server la.",
      true
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "🔓 VERIFY / CONNECT";

    }

  }

}


/* =========================
   LOGIN MESSAGE
========================= */

function showLoginMessage(
  message,
  error = false
) {

  const element =
    $("loginMessage");


  if (!element) {

    return;

  }


  element.textContent =
    message;


  element.className =
    "message " +
    (
      error
        ? "error"
        : "success"
    );

}


/* =========================
   OPEN DASHBOARD
========================= */

function openDashboard() {

  stopConnectionMonitor();


  hideAllScreens();


  $("dashboard")?.classList.remove(
    "hidden"
  );


  renderBotInformation();


  renderSettings(
    "generalSettings",
    groups.general
  );


  renderSettings(
    "protectionSettings",
    groups.protection
  );


  renderSettings(
    "statusSettings",
    groups.status
  );


  renderSettings(
    "groupSettings",
    groups.group
  );


  renderSettings(
    "aiSettings",
    groups.ai
  );

}


/* =========================
   BOT INFORMATION
========================= */

function renderBotInformation() {

  if (
    $("botName")
  ) {

    $("botName").value =
      botInformation.name ||
      "TOPFEROS MD";

  }


  if (
    $("botNumber")
  ) {

    $("botNumber").value =
      botInformation.number ||
      "";

  }


  if (
    $("botPrefix")
  ) {

    $("botPrefix").value =
      botInformation.prefix ||
      ".";

  }


  if (
    $("botMode")
  ) {

    updateModeDisplay();

  }

}


/* =========================
   MODE DISPLAY
========================= */

function updateModeDisplay() {

  if (
    !$("botMode")
  ) {

    return;

  }


  $("botMode").value =
    settings.privateMode
      ? "Private"
      : "Public";

}


/* =========================
   RENDER SETTINGS
========================= */

function renderSettings(
  containerId,
  list
) {

  const container =
    $(containerId);


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  for (
 const [key, label]
    of list
  ) {

    const row =
      document.createElement(
        "div"
      );


    row.className =
      "setting";


    const span =
      document.createElement(
        "span"
      );


    span.textContent =
      label;


    const labelElement =
      document.createElement(
        "label"
      );


    labelElement.className =
      "switch";


    const input =
      document.createElement(
        "input"
      );


    input.type =
      "checkbox";


    input.dataset.setting =
      key;


    input.checked =
      !!settings[key];


    const slider =
      document.createElement(
        "span"
      );


    slider.className =
      "slider";


    labelElement.appendChild(
      input
    );


    labelElement.appendChild(
      slider
    );


    row.appendChild(
      span
    );


    row.appendChild(
      labelElement
    );


    container.appendChild(
      row
    );


    input.addEventListener(
      "change",
      () => {

        const settingKey =
          input.dataset.setting;


        settings[settingKey] =
          input.checked;


        if (
          settingKey ===
            "publicMode" &&
          input.checked
        ) {

          settings.privateMode =
            false;

          refreshSwitch(
            "privateMode"
          );

        }


        if (
          settingKey ===
            "privateMode" &&
          input.checked
        ) {

          settings.publicMode =
            false;

          refreshSwitch(
            "publicMode"
          );

        }


        if (
          settingKey ===
            "groupClose" &&
          input.checked
        ) {

          settings.groupOpen =
            false;

          refreshSwitch(
            "groupOpen"
          );

        }


        if (
          settingKey ===
            "groupOpen" &&
          input.checked
        ) {

          settings.groupClose =
            false;

          refreshSwitch(
            "groupClose"
          );

        }


        updateModeDisplay();

      }
    );

  }

}


/* =========================
   REFRESH SWITCH
========================= */

function refreshSwitch(
  key
) {

  const input =
    document.querySelector(
      `input[data-setting="${key}"]`
    );


  if (input) {

    input.checked =
      !!settings[key];

  }

}


/* =========================
   SAVE SETTINGS
========================= */

async function saveSettings() {

  const saveButton =
    $("saveButton");


  const saveMessage =
    $("saveMessage");


  const name =
    $("botName")
      ?.value
      .trim() ||
    "TOPFEROS MD";


  const prefix =
    $("botPrefix")
      ?.value
      .trim() ||
    ".";


  botInformation.name =
    name;


  botInformation.prefix =
    prefix;


  if (saveButton) {

    saveButton.disabled =
      true;

    saveButton.textContent =
      "⏳ SAVING...";

  }


  if (saveMessage) {

    saveMessage.textContent =
      "";

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

          body: JSON.stringify({
            sessionId,
            settings,
            botInformation
          })

        }
      );


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.success
    ) {

      throw new Error(
        data.error ||
        "SAVE_FAILED"
      );

    }


    settings =
      data.settings ||
      settings;


    botInformation =
      data.botInformation ||
      botInformation;


    renderBotInformation();


    if (saveMessage) {

      saveMessage.textContent =
        "✅ Settings yo sove avèk siksè.";


      saveMessage.className =
        "message success";

    }


  } catch (error) {

    console.error(
      "Save settings error:",
      error
    );


    if (saveMessage) {

      saveMessage.textContent =
        "❌ Pa kapab sove settings yo.";


      saveMessage.className =
        "message error";

    }

  } finally {

    if (saveButton) {

      saveButton.disabled =
        false;

      saveButton.textContent =
        "💾 SAVE SETTINGS";

    }

  }

}


/* =========================
   LOGOUT
========================= */

async function logoutPanel() {

  try {

    if (
      sessionId
    ) {

      await fetch(
        "/api/logout",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            sessionId
          })

        }
      );

    }

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }


  settings = {};

  botInformation = {};

  sessionId = "";


  stopPairingCooldown();

  stopConnectionMonitor();


  window.location.href =
    window.location.pathname;

}


/* =========================
   SETTINGS CODE INPUT
========================= */

function setupSettingsCodeInput() {

  const input =
    $("settingsCode");


  if (!input) {

    return;

  }


  input.addEventListener(
    "input",
    event => {

      event.target.value =
        event.target.value
          .toUpperCase()
          .replace(
            /[^A-Z0-9]/g,
            ""
          )
          .slice(0, 6);

    }
  );


  input.addEventListener(
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


/* =========================
   GLOBAL FUNCTIONS
========================= */

window.selectLanguage =
  selectLanguage;


window.requestPairingCode =
  requestPairingCode;


window.copyPairingCode =
  copyPairingCode;


window.verifySettings =
  verifySettings;


window.saveSettings =
  saveSettings;


window.logoutPanel =
  logoutPanel;


window.backToConnect =
  backToConnect;