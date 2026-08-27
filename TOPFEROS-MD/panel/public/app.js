"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║             🌐 PANEL APPLICATION JS              ║
// ║          ⚙️ MULTI-SESSION + LANGUAGE              ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝

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
// 🌍 LANGUAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LANGUAGE_KEY =
"topferos_language";

const SUPPORTED_LANGUAGES = [
"en",
"fr",
"es"
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 LANGUAGE TEXT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const translations = {

en: {
title:
"TOPFEROS MD",

subtitle:
  "⚙️ Settings Panel",

number:
  "Number:",

numberPlaceholder:
  "Enter bot number",

code:
  "Code:",

codePlaceholder:
  "Enter panel code",

next:
  "NEXT",

checking:
  "Checking...",

sessionMissing:
  "❌ Panel link has no session.",

numberMissing:
  "❌ Enter the bot number.",

codeMissing:
  "❌ Enter the panel code.",

disconnected:
  "❌ Bot is disconnected. This code is no longer valid.",

loginFailed:
  "❌ Login failed.",

serverError:
  "❌ Unable to contact the panel server.",

made:
  "Made in TOPFEROS TECH"

},

fr: {
title:
"TOPFEROS MD",

subtitle:
  "⚙️ Panneau de configuration",

number:
  "Numéro :",

numberPlaceholder:
  "Entrez le numéro du bot",

code:
  "Code :",

codePlaceholder:
  "Entrez le code du panneau",

next:
  "SUIVANT",

checking:
  "Vérification...",

sessionMissing:
  "❌ Le lien du panneau ne contient aucune session.",

numberMissing:
  "❌ Entrez le numéro du bot.",

codeMissing:
  "❌ Entrez le code du panneau.",

disconnected:
  "❌ Le bot est déconnecté. Ce code n'est plus valide.",

loginFailed:
  "❌ Échec de la connexion.",

serverError:
  "❌ Impossible de contacter le serveur du panneau.",

made:
  "Made in TOPFEROS TECH"

},

es: {
title:
"TOPFEROS MD",

subtitle:
  "⚙️ Panel de configuración",

number:
  "Número:",

numberPlaceholder:
  "Introduce el número del bot",

code:
  "Código:",

codePlaceholder:
  "Introduce el código del panel",

next:
  "SIGUIENTE",

checking:
  "Verificando...",

sessionMissing:
  "❌ El enlace del panel no contiene ninguna sesión.",

numberMissing:
  "❌ Introduce el número del bot.",

codeMissing:
  "❌ Introduce el código del panel.",

disconnected:
  "❌ El bot está desconectado. Este código ya no es válido.",

loginFailed:
  "❌ Error de inicio de sesión.",

serverError:
  "❌ No se puede contactar con el servidor del panel.",

made:
  "Made in TOPFEROS TECH"

}

};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌍 GET LANGUAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getLanguage() {

const saved =
localStorage.getItem(
LANGUAGE_KEY
);

if (
SUPPORTED_LANGUAGES.includes(
saved
)
) {
return saved;
}

return "en";
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 SAVE LANGUAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function saveLanguage(
language
) {

if (
!SUPPORTED_LANGUAGES.includes(
language
)
) {
return false;
}

localStorage.setItem(
LANGUAGE_KEY,
language
);

return true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 APPLY LOGIN LANGUAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function applyLanguage(
language = getLanguage()
) {

if (
!translations[language]
) {
language = "en";
}

const t =
translations[language];

document.documentElement.lang =
language;

const title =
document.querySelector(
"#loginScreen h1"
);

if (title) {
title.textContent =
t.title;
}

const subtitle =
document.querySelector(
"#loginScreen .subtitle"
);

if (subtitle) {
subtitle.textContent =
t.subtitle;
}

const numberLabel =
document.querySelector(
'label[for="number"]'
);

if (numberLabel) {
numberLabel.textContent =
t.number;
}

const codeLabel =
document.querySelector(
'label[for="code"]'
);

if (codeLabel) {
codeLabel.textContent =
t.code;
}

if (numberInput) {
numberInput.placeholder =
t.numberPlaceholder;
}

if (codeInput) {
codeInput.placeholder =
t.codePlaceholder;
}

if (
nextButton &&
!nextButton.disabled
) {
nextButton.textContent =
t.next;
}

const footer =
document.querySelector(
"#loginScreen .footer"
);

if (footer) {
footer.innerHTML =
"${t.made}<br>========================";
}

}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📢 SHOW MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showMessage(
text
) {

if (!message) {
return;
}

message.textContent =
text || "";

}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔢 CLEAN NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function cleanNumber(
number
) {

return String(number || "")
.replace(/\D/g, "");

}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 CHECK BOT STATUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function checkStatus() {

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

return (
  result.success === true &&
  result.connected === true
);

} catch (error) {

console.error(
  "❌ STATUS ERROR:",
  error
);

return false;

}

}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 LOGIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function login() {

const language =
getLanguage();

const t =
translations[language];

showMessage("");

if (!sessionId) {

showMessage(
  t.sessionMissing
);

return;

}

const number =
cleanNumber(
numberInput?.value
);

const code =
String(
codeInput?.value || ""
)
.trim()
.toUpperCase();

if (!number) {

showMessage(
  t.numberMissing
);

numberInput?.focus();

return;

}

if (!code) {

showMessage(
  t.codeMissing
);

codeInput?.focus();

return;

}

if (nextButton) {

nextButton.disabled =
  true;

nextButton.textContent =
  t.checking;

}

try {

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🟢 CHECK CONNECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const connected =
  await checkStatus();

if (!connected) {

  showMessage(
    t.disconnected
  );

  return;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔐 VERIFY SESSION
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

  showMessage(
    result.message ||
    t.loginFailed
  );

  return;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 SAVE SELECTED LANGUAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

saveLanguage(
  language
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌍 SAVE LANGUAGE FOR SESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

} catch (languageError) {

  console.warn(
    "⚠️ LANGUAGE SAVE WARNING:",
    languageError
  );

}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 OPEN SETTINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

window.location.href =
  `/settings.html?session=${encodeURIComponent(
    sessionId
  )}&language=${encodeURIComponent(
    language
  )}`;

} catch (error) {

console.error(
  "❌ PANEL LOGIN ERROR:",
  error
);

showMessage(
  t.serverError
);

} finally {

if (nextButton) {

  nextButton.disabled =
    false;

  nextButton.textContent =
    t.next;

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
// 🔄 CONNECTION MONITOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

setInterval(
async () => {

const connected =
  await checkStatus();

if (
  !connected &&
  !document.hidden
) {

  showMessage(
    translations[
      getLanguage()
    ].disconnected
  );

}

},
5000
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 INITIALIZE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(function init() {

const language =
getLanguage();

applyLanguage(
language
);

if (!sessionId) {

showMessage(
  translations[language]
    .sessionMissing
);

}

})();

// ╔════════════════════════════════════════════════════╗
// ║                 By TOPFEROS TECH                  ║
// ╚════════════════════════════════════════════════════╝