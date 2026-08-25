"use strict";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ TOPFEROS MD — SETTINGS PANEL APP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 SESSION ID
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

const loginScreen =
  document.getElementById(
    "loginScreen"
  );

const settingsScreen =
  document.getElementById(
    "settingsScreen"
  );

const numberInput =
  document.getElementById(
    "number"
  );

const codeInput =
  document.getElementById(
    "code"
  );

const nextButton =
  document.getElementById(
    "nextButton"
  );

const message =
  document.getElementById(
    "message"
  );

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ LOGO FALLBACK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showLogoPlaceholder() {
  const logo =
    document.getElementById(
      "botLogo"
    );

  const placeholder =
    document.getElementById(
      "logoPlaceholder"
    );

  if (logo) {
    logo.classList.add(
      "hidden"
    );
  }

  if (placeholder) {
    placeholder.classList.remove(
      "hidden"
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ❌ SHOW MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showError(text) {
  if (!message) {
    return;
  }

  message.textContent =
    text || "";
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 SHOW SETTINGS PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showSettings() {
  if (loginScreen) {
    loginScreen.classList.add(
      "hidden"
    );
  }

  if (settingsScreen) {
    settingsScreen.classList.remove(
      "hidden"
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔴 SHOW LOGIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showLogin(text) {
  if (settingsScreen) {
    settingsScreen.classList.add(
      "hidden"
    );
  }

  if (loginScreen) {
    loginScreen.classList.remove(
      "hidden"
    );
  }

  showError(text);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📡 CHECK BOT CONNECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function checkBotConnection() {
  try {
    const response =
      await fetch(
        "/api/status",
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

    return result.connected === true;

  } catch (error) {
    console.error(
      "❌ CONNECTION CHECK ERROR:",
      error
    );

    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 VERIFY CURRENT SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function checkSession() {
  if (!sessionId) {
    showLogin(
      "❌ Link panel la pa gen session."
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
      "❌ SESSION CHECK ERROR:",
      error
    );

    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 NEXT / LOGIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function login() {
  showError("");

  if (!sessionId) {
    showError(
      "❌ Link panel la pa gen session."
    );

    return;
  }

  const number =
    numberInput?.value.trim();

  const code =
    codeInput?.value.trim();

  if (!number) {
    showError(
      "❌ Mete Number bot la."
    );

    numberInput?.focus();

    return;
  }

  if (!code) {
    showError(
      "❌ Mete Code panel la."
    );

    codeInput?.focus();

    return;
  }

  if (nextButton) {
    nextButton.disabled = true;
    nextButton.textContent =
      "Checking...";
  }

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🟢 BOT CONNECTION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const connected =
      await checkBotConnection();

    if (!connected) {
      showError(
        "❌ Bot la dekonekte. Code la pa valid ankò."
      );

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔐 VERIFY NUMBER + CODE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const response =
      await fetch(
        "/api/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              sessionId,
              number,
              code
            })
        }
      );

    const result =
      await response.json();

    if (
      !response.ok ||
      result.success !== true
    ) {
      showError(
        result.message ||
        "❌ Number oswa Code pa kòrèk."
      );

      return;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ LOGIN REYISI
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    showSettings();

  } catch (error) {
    console.error(
      "❌ PANEL LOGIN ERROR:",
      error
    );

    showError(
      "❌ Pa kapab kontakte server panel la."
    );

  } finally {
    if (nextButton) {
      nextButton.disabled = false;
      nextButton.textContent =
        "NEXT";
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖱️ NEXT BUTTON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (nextButton) {
  nextButton.addEventListener(
    "click",
    login
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⌨️ ENTER KEY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (codeInput) {
  codeInput.addEventListener(
    "keydown",
    event => {
      if (
        event.key ===
        "Enter"
      ) {
        login();
      }
    }
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 MONITOR BOT CONNECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function monitorConnection() {
  const connected =
    await checkBotConnection();

  if (!connected) {
    // Si user la te deja antre nan panel,
    // fè l soti imedyatman.
    if (
      settingsScreen &&
      !settingsScreen.classList.contains(
        "hidden"
      )
    ) {
      showLogin(
        "🔴 Bot la dekonekte. Panel la fèmen."
      );
    }

    return;
  }

  // Si session lan pa valide ankò,
  // pa kite user la rete nan panel la.
  if (
    settingsScreen &&
    !settingsScreen.classList.contains(
      "hidden"
    )
  ) {
    const authenticated =
      await checkSession();

    if (!authenticated) {
      showLogin(
        "🔐 Session panel la pa valid ankò."
      );
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⏱️ AUTO CHECK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

setInterval(
  monitorConnection,
  5000
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 INITIAL CHECK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(async function init() {
  if (!sessionId) {
    showLogin(
      "❌ Louvri panel la ak link ou te resevwa nan bot la."
    );

    return;
  }

  const connected =
    await checkBotConnection();

  if (!connected) {
    showLogin(
      "🔴 Bot la pa konekte. Panel la pa disponib."
    );

    return;
  }

  // Pa antre otomatikman nan Settings.
  // User la dwe antre Number + Code epi peze NEXT.
  showLogin("");
})();