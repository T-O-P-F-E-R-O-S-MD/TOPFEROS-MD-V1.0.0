"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║             🌐 PANEL APPLICATION JS              ║
// ║              🚀 TOPFEROS TECH                    ║
// ╚════════════════════════════════════════════════════╝

const params = new URLSearchParams(
  window.location.search
);

const sessionId = params.get("session");
const urlLanguage = params.get("language");

const LANGUAGE_KEY = "topferos_language";

const SUPPORTED_LANGUAGES = [
  "en",
  "fr",
  "es"
];


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌍 TRANSLATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const translations = {

  en: {
    languageTitle: "• Main Language",
    languageSubtitle:
      "Choose a language to deploy the bot",

    loginTitle:
      "Generate Parrain Code",

    loginSubtitle:
      "Enter the WhatsApp number of the bot",

    number:
      "WhatsApp Number",

    numberPlaceholder:
      "Enter WhatsApp number",

    numberHelp:
      "Enter the country code and number without the + sign",

    generate:
      "Generate Parrain Code",

    generating:
      "Generating...",

    code:
      "Parrain Code",

    copy:
      "📋 Copy",

    copied:
      "✅ Copied",

    next:
      "NEXT",

    sessionMissing:
      "❌ Panel link has no session.",

    numberMissing:
      "❌ Enter the WhatsApp number.",

    invalidNumber:
      "❌ Enter a valid WhatsApp number.",

    generateFailed:
      "❌ Unable to generate Parrain Code.",

    serverError:
      "❌ Unable to contact the panel server.",

    loginFailed:
      "❌ Login failed.",

    connecting:
      "Connecting...",

    made:
      "Made in TOPFEROS TECH"
  },

  fr: {
    languageTitle:
      "• Langue principale",

    languageSubtitle:
      "Choisissez une langue pour déployer le bot",

    loginTitle:
      "Générer le Code Parrain",

    loginSubtitle:
      "Entrez le numéro WhatsApp du bot",

    number:
      "Numéro WhatsApp",

    numberPlaceholder:
      "Entrez le numéro WhatsApp",

    numberHelp:
      "Entrez l'indicatif pays et le numéro sans le signe +",

    generate:
      "Générer le Code Parrain",

    generating:
      "Génération...",

    code:
      "Code Parrain",

    copy:
      "📋 Copier",

    copied:
      "✅ Copié",

    next:
      "SUIVANT",

    sessionMissing:
      "❌ Le lien du panneau ne contient aucune session.",

    numberMissing:
      "❌ Entrez le numéro WhatsApp.",

    invalidNumber:
      "❌ Entrez un numéro WhatsApp valide.",

    generateFailed:
      "❌ Impossible de générer le Code Parrain.",

    serverError:
      "❌ Impossible de contacter le serveur du panneau.",

    loginFailed:
      "❌ Échec de la connexion.",

    connecting:
      "Connexion...",

    made:
      "Made in TOPFEROS TECH"
  },

  es: {
    languageTitle:
      "• Idioma principal",

    languageSubtitle:
      "Elige un idioma para desplegar el bot",

    loginTitle:
      "Generar Código Parrain",

    loginSubtitle:
      "Introduce el número de WhatsApp del bot",

    number:
      "Número de WhatsApp",

    numberPlaceholder:
      "Introduce el número de WhatsApp",

    numberHelp:
      "Introduce el código de país y el número sin el signo +",

    generate:
      "Generar Código Parrain",

    generating:
      "Generando...",

    code:
      "Código Parrain",

    copy:
      "📋 Copiar",

    copied:
      "✅ Copiado",

    next:
      "SIGUIENTE",

    sessionMissing:
      "❌ El enlace del panel no contiene ninguna sesión.",

    numberMissing:
      "❌ Introduce el número de WhatsApp.",

    invalidNumber:
      "❌ Introduce un número de WhatsApp válido.",

    generateFailed:
      "❌ No se pudo generar el Código Parrain.",

    serverError:
      "❌ No se puede contactar con el servidor del panel.",

    loginFailed:
      "❌ Error de inicio de sesión.",

    connecting:
      "Conectando...",

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
    SUPPORTED_LANGUAGES.includes(saved)
  ) {
    return saved;
  }

  if (
    SUPPORTED_LANGUAGES.includes(urlLanguage)
  ) {
    return urlLanguage;
  }

  return "en";
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 SAVE LANGUAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function saveLanguage(language) {

  if (
    !SUPPORTED_LANGUAGES.includes(language)
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
// 🌐 APPLY LANGUAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function applyLanguage(
  language = getLanguage()
) {

  if (!translations[language]) {
    language = "en";
  }

  const t =
    translations[language];

  document.documentElement.lang =
    language;


  const languageTitle =
    document.getElementById(
      "languageTitle"
    );

  if (languageTitle) {
    languageTitle.textContent =
      t.languageTitle;
  }


  const languageSubtitle =
    document.getElementById(
      "languageSubtitle"
    );

  if (languageSubtitle) {
    languageSubtitle.textContent =
      t.languageSubtitle;
  }


  const loginTitle =
    document.getElementById(
      "loginTitle"
    );

  if (loginTitle) {
    loginTitle.textContent =
      t.loginTitle;
  }


  const loginSubtitle =
    document.getElementById(
      "loginSubtitle"
    );

  if (loginSubtitle) {
    loginSubtitle.textContent =
      t.loginSubtitle;
  }


  const numberLabel =
    document.getElementById(
      "numberLabel"
    );

  if (numberLabel) {
    numberLabel.textContent =
      t.number;
  }


  const numberInput =
    document.getElementById(
      "number"
    );

  if (numberInput) {
    numberInput.placeholder =
      t.numberPlaceholder;
  }


  const numberHelp =
    document.getElementById(
      "numberHelp"
    );

  if (numberHelp) {
    numberHelp.textContent =
      t.numberHelp;
  }


  const generateButton =
    document.getElementById(
      "generateButton"
    );

  if (
    generateButton &&
    !generateButton.disabled
  ) {
    generateButton.textContent =
      t.generate;
  }


  const codeTitle =
    document.getElementById(
      "codeTitle"
    );

  if (codeTitle) {
    codeTitle.textContent =
      t.code;
  }


  const copyButton =
    document.getElementById(
      "copyButton"
    );

  if (copyButton) {
    copyButton.textContent =
      t.copy;
  }


  const nextButton =
    document.getElementById(
      "nextButton"
    );

  if (
    nextButton &&
    !nextButton.disabled
  ) {
    nextButton.textContent =
      t.next;
  }


  document
    .querySelectorAll(".footer")
    .forEach(footer => {

      footer.innerHTML =
        t.made;

    });
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌍 LANGUAGE SELECTOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setupLanguageSelector() {

  const buttons =
    document.querySelectorAll(
      "[data-language]"
    );

  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const language =
          button.dataset.language;

        if (
          !SUPPORTED_LANGUAGES.includes(
            language
          )
        ) {
          return;
        }

        saveLanguage(language);

        const currentUrl =
          new URL(
            window.location.href
          );

        currentUrl.searchParams.set(
          "language",
          language
        );

        window.location.href =
          currentUrl.toString();

      }
    );

  });
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📢 MESSAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function showMessage(text) {

  const message =
    document.getElementById(
      "message"
    );

  if (!message) {
    return;
  }

  message.textContent =
    text || "";
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔢 CLEAN NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function cleanNumber(number) {

  return String(number || "")
    .replace(/\D/g, "");
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔍 VALIDATE NUMBER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isValidNumber(number) {

  return (
    number.length >= 8 &&
    number.length <= 15
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔑 GENERATE PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function generateParrainCode() {

  const language =
    getLanguage();

  const t =
    translations[language];

  const numberInput =
    document.getElementById(
      "number"
    );

  const generateButton =
    document.getElementById(
      "generateButton"
    );

  const codeSection =
    document.getElementById(
      "codeSection"
    );

  const parrainCode =
    document.getElementById(
      "parrainCode"
    );

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


  if (!number) {

    showMessage(
      t.numberMissing
    );

    numberInput?.focus();

    return;
  }


  if (!isValidNumber(number)) {

    showMessage(
      t.invalidNumber
    );

    numberInput?.focus();

    return;
  }


  if (generateButton) {

    generateButton.disabled =
      true;

    generateButton.textContent =
      t.generating;
  }


  try {

    /*
     * API sa dwe resevwa:
     *
     * {
     *   sessionId,
     *   number
     * }
     *
     * epi li dwe retounen:
     *
     * {
     *   success: true,
     *   code: "XXXXXX"
     * }
     */

    const response =
      await fetch(
        "/api/auth",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              sessionId,
              number
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
        t.generateFailed
      );

      return;
    }


    const code =
      String(
        result.code ||
        result.parrainCode ||
        result.panelCode ||
        ""
      )
      .trim()
      .toUpperCase();


    if (!code) {

      showMessage(
        t.generateFailed
      );

      return;
    }


    if (parrainCode) {

      parrainCode.textContent =
        code;
    }


    if (codeSection) {

      codeSection.style.display =
        "block";
    }


    showMessage("");

    const successMessage =
      document.getElementById(
        "successMessage"
      );

    if (successMessage) {

      successMessage.textContent =
        "✓ Code Parrain généré";

    }

  } catch (error) {

    console.error(
      "❌ PARRAIN CODE ERROR:",
      error
    );

    showMessage(
      t.serverError
    );

  } finally {

    if (generateButton) {

      generateButton.disabled =
        false;

      generateButton.textContent =
        t.generate;

    }
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 COPY PARRAIN CODE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function copyParrainCode() {

  const language =
    getLanguage();

  const t =
    translations[language];

  const parrainCode =
    document.getElementById(
      "parrainCode"
    );

  if (!parrainCode) {
    return;
  }

  const code =
    parrainCode.textContent
      .trim();

  if (
    !code ||
    code === "—"
  ) {
    return;
  }


  try {

    await navigator.clipboard.writeText(
      code
    );

    const copyButton =
      document.getElementById(
        "copyButton"
      );

    if (copyButton) {

      copyButton.textContent =
        t.copied;

      setTimeout(
        () => {

          copyButton.textContent =
            t.copy;

        },
        1500
      );
    }

  } catch (error) {

    console.error(
      "❌ COPY ERROR:",
      error
    );

    showMessage(
      "❌ Copy failed"
    );
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ➡️ NEXT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function goNext() {

  const language =
    getLanguage();

  const t =
    translations[language];

  const numberInput =
    document.getElementById(
      "number"
    );

  const parrainCode =
    document.getElementById(
      "parrainCode"
    );

  const nextButton =
    document.getElementById(
      "nextButton"
    );

  const number =
    cleanNumber(
      numberInput?.value
    );

  const code =
    String(
      parrainCode?.textContent ||
      ""
    )
    .trim()
    .toUpperCase();


  if (!number) {

    showMessage(
      t.numberMissing
    );

    return;
  }


  if (!code || code === "—") {

    showMessage(
      t.generateFailed
    );

    return;
  }


  if (nextButton) {

    nextButton.disabled =
      true;

    nextButton.textContent =
      t.connecting;
  }


  try {

    /*
     * Login verify:
     *
     * sessionId
     * number
     * code
     */

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


    saveLanguage(language);


    // Save language pou session lan
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
        "⚠️ LANGUAGE SAVE WARNING:",
        error
      );

    }


    // Ale nan Settings
    window.location.href =
      `/settings.html?session=${encodeURIComponent(
        sessionId
      )}&language=${encodeURIComponent(
        language
      )}`;

  } catch (error) {

    console.error(
      "❌ NEXT ERROR:",
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
// ⌨️ ENTER KEY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setupKeyboard() {

  const numberInput =
    document.getElementById(
      "number"
    );

  if (!numberInput) {
    return;
  }

  numberInput.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        generateParrainCode();

      }

    }
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 INITIALIZE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(function init() {

  setupLanguageSelector();

  setupKeyboard();

  const generateButton =
    document.getElementById(
      "generateButton"
    );

  if (generateButton) {

    generateButton.addEventListener(
      "click",
      generateParrainCode
    );

  }


  const copyButton =
    document.getElementById(
      "copyButton"
    );

  if (copyButton) {

    copyButton.addEventListener(
      "click",
      copyParrainCode
    );

  }


  const nextButton =
    document.getElementById(
      "nextButton"
    );

  if (nextButton) {

    nextButton.addEventListener(
      "click",
      goNext
    );

  }


  applyLanguage(
    getLanguage()
  );


  // Montre ekran nimewo a apre language la
  const languageScreen =
    document.getElementById(
      "languageScreen"
    );

  const loginScreen =
    document.getElementById(
      "loginScreen"
    );


  /*
   * Si language deja chwazi,
   * pa oblije chwazi li ankò.
   */

  const savedLanguage =
    localStorage.getItem(
      LANGUAGE_KEY
    );


  if (
    SUPPORTED_LANGUAGES.includes(
      savedLanguage
    )
  ) {

    if (languageScreen) {
      languageScreen.style.display =
        "none";
    }

    if (loginScreen) {
      loginScreen.style.display =
        "block";
    }

  } else {

    if (languageScreen) {
      languageScreen.style.display =
        "block";
    }

    if (loginScreen) {
      loginScreen.style.display =
        "none";
    }

  }

})();