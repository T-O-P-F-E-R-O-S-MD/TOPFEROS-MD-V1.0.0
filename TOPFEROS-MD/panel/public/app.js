"use strict";

const params = new URLSearchParams(
  window.location.search
);

const sessionId = params.get("session");

let currentLanguage = "en";
let settings = {};
let botInformation = {};

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

document.addEventListener("DOMContentLoaded", () => {
  if (!sessionId) {
    showLanguage();
    return;
  }

  showLanguage();
});

function $(id) {
  return document.getElementById(id);
}

function showLanguage() {
  $("languageScreen").classList.remove("hidden");
  $("loginScreen").classList.add("hidden");
  $("dashboard").classList.add("hidden");
}

async function selectLanguage(language) {
  currentLanguage = language;

  $("languageScreen").classList.add("hidden");
  $("loginScreen").classList.remove("hidden");

  if (!sessionId) {
    showLoginMessage(
      "Settings link la pa gen Session ID.",
      true
    );
    return;
  }

  try {
    const response = await fetch(
      `/api/session/${encodeURIComponent(sessionId)}`
    );

    const data = await response.json();

    if (!data.success) {
      showLoginMessage(
        "Settings session sa a pa egziste.",
        true
      );
      return;
    }
  } catch (error) {
    showLoginMessage(
      "Pa kapab kontakte server la.",
      true
    );
  }
}

function showLoginMessage(message, error = false) {
  const el = $("loginMessage");

  el.textContent = message;
  el.className =
    "message " + (error ? "error" : "success");
}

async function verifySettings() {
  const code = $("settingsCode")
    .value
    .trim()
    .toUpperCase();

  if (!sessionId) {
    showLoginMessage(
      "Session ID pa jwenn.",
      true
    );
    return;
  }

  if (!/^[A-Z0-9]{6}$/.test(code)) {
    showLoginMessage(
      "Settings Code la dwe gen 6 karaktè.",
      true
    );
    return;
  }

  const button = $("verifyButton");

  button.disabled = true;
  button.textContent = "⏳ VERIFYING...";

  try {
    const response = await fetch("/api/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId,
        code
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      showLoginMessage(
        "❌ Settings Code pa kòrèk.",
        true
      );
      return;
    }

    settings = data.settings || {};
    botInformation =
      data.botInformation || {};

    openDashboard();

  } catch (error) {
    showLoginMessage(
      "❌ Erè koneksyon ak server la.",
      true
    );
  } finally {
    button.disabled = false;
    button.textContent = "🔓 VERIFY / CONNECT";
  }
}

function openDashboard() {
  $("languageScreen").classList.add("hidden");
  $("loginScreen").classList.add("hidden");
  $("dashboard").classList.remove("hidden");

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

function renderBotInformation() {
  $("botName").value =
    botInformation.name ||
    "TOPFEROS MD";

  $("botNumber").value =
    botInformation.number || "";

  $("botPrefix").value =
    botInformation.prefix || ".";

  updateModeDisplay();
}

function updateModeDisplay() {
  $("botMode").value =
    settings.privateMode
      ? "Private"
      : "Public";
}

function renderSettings(containerId, list) {
  const container = $(containerId);

  container.innerHTML = "";

  for (const [key, label] of list) {
    const row = document.createElement("div");

    row.className = "setting";

    row.innerHTML = `
      <span>${label}</span>

      <label class="switch">
        <input
          type="checkbox"
          data-setting="${key}"
          ${settings[key] ? "checked" : ""}
        >

        <span class="slider"></span>
      </label>
    `;

    container.appendChild(row);
  }

  container
    .querySelectorAll("input[data-setting]")
    .forEach(input => {
      input.addEventListener(
        "change",
        () => {
          const key =
            input.dataset.setting;

          settings[key] =
            input.checked;

          if (
            key === "publicMode" &&
            input.checked
          ) {
            settings.privateMode = false;
            refreshSwitch("privateMode");
          }

          if (
            key === "privateMode" &&
            input.checked
          ) {
            settings.publicMode = false;
            refreshSwitch("publicMode");
          }

          if (
            key === "groupClose" &&
            input.checked
          ) {
            settings.groupOpen = false;
            refreshSwitch("groupOpen");
          }

          if (
            key === "groupOpen" &&
            input.checked
          ) {
            settings.groupClose = false;
            refreshSwitch("groupClose");
          }

          updateModeDisplay();
        }
      );
    });
}

function refreshSwitch(key) {
  const input =
    document.querySelector(
      `input[data-setting="${key}"]`
    );

  if (input) {
    input.checked =
      !!settings[key];
  }
}

async function saveSettings() {
  const saveButton = $("saveButton");
  const saveMessage = $("saveMessage");

  const name =
    $("botName").value.trim() ||
    "TOPFEROS MD";

  const prefix =
    $("botPrefix").value.trim() || ".";

  botInformation.name = name;
  botInformation.prefix = prefix;

  saveButton.disabled = true;
  saveButton.textContent =
    "⏳ SAVING...";

  saveMessage.textContent = "";

  try {
    const response = await fetch(
      "/api/settings",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
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
      data.settings || settings;

    botInformation =
      data.botInformation ||
      botInformation;

    renderBotInformation();

    saveMessage.textContent =
      "✅ Settings yo sove avèk siksè.";

    saveMessage.className =
      "message success";

  } catch (error) {
    saveMessage.textContent =
      "❌ Pa kapab sove settings yo.";

    saveMessage.className =
      "message error";

    console.error(error);

  } finally {
    saveButton.disabled = false;
    saveButton.textContent =
      "💾 APP SOVE";
  }
}

$("settingsCode")?.addEventListener(
  "input",
  event => {
    event.target.value =
      event.target.value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 6);
  }
);

$("settingsCode")?.addEventListener(
  "keydown",
  event => {
    if (event.key === "Enter") {
      verifySettings();
    }
  }
);