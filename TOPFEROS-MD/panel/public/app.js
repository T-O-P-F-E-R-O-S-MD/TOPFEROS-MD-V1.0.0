"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║                 PANEL APPLICATION JS             ║
// ║                 🚀 TOPFEROS TECH                 ║
// ╚════════════════════════════════════════════════════╝


// ======================================================
// 🌍 LANGUAGE
// ======================================================

const LANGUAGE_KEY = "topferos_language";

const SUPPORTED_LANGUAGES = [
  "en",
  "fr",
  "es"
];


// ======================================================
// 🌐 TRANSLATIONS
// ======================================================

const translations = {

  en: {
    language: "Language",

    parrainNumber: "Parrain Number",

    generateParrain:
      "Generate Parrain Code",

    parrainCode:
      "Parrain Code",

    copy:
      "Copy",

    copied:
      "Copied!",

    generating:
      "Generating...",

    loading:
      "Loading...",

    error:
      "Unable to generate Parrain Code.",

    serverError:
      "Unable to contact the panel server.",

    numberError:
      "Parrain number was not returned by the server.",

    madeBy:
      "By TOPFEROS TECH"
  },


  fr: {
    language: "Langue",

    parrainNumber: "Numéro Parrain",

    generateParrain:
      "Générer le code Parrain",

    parrainCode:
      "Code Parrain",

    copy:
      "Copier",

    copied:
      "Copié !",

    generating:
      "Génération...",

    loading:
      "Chargement...",

    error:
      "Impossible de générer le code Parrain.",

    serverError:
      "Impossible de contacter le serveur du panneau.",

    numberError:
      "Le numéro Parrain n'a pas été reçu du serveur.",

    madeBy:
      "By TOPFEROS TECH"
  },


  es: {
    language: "Idioma",

    parrainNumber: "Número Parrain",

    generateParrain:
      "Generar código Parrain",

    parrainCode:
      "Código Parrain",

    copy:
      "Copiar",

    copied:
      "¡Copiado!",

    generating:
      "Generando...",

    loading:
      "Cargando...",

    error:
      "No se pudo generar el código Parrain.",

    serverError:
      "No se puede contactar con el servidor del panel.",

    numberError:
      "El número Parrain no fue recibido del servidor.",

    madeBy:
      "By TOPFEROS TECH"
  }

};


// ======================================================
// 💾 LANGUAGE FUNCTIONS
// ======================================================

function getLanguage() {

  const saved =
    localStorage.getItem(
      LANGUAGE_KEY
    );

  if (
    saved &&
    SUPPORTED_LANGUAGES.includes(saved)
  ) {
    return saved;
  }

  return "fr";
}


function setLanguage(language) {

  if (
    !SUPPORTED_LANGUAGES.includes(language)
  ) {
    language = "fr";
  }

  localStorage.setItem(
    LANGUAGE_KEY,
    language
  );

  applyLanguage(language);
}


// ======================================================
// 📝 APPLY LANGUAGE
// ======================================================

function applyLanguage(language) {

  const t =
    translations[language] ||
    translations.fr;


  document.documentElement.lang =
    language;


  // Language title

  const languageTitle =
    document.getElementById(
      "languageTitle"
    );

  if (languageTitle) {
    languageTitle.textContent =
      t.language;
  }


  // Parrain title

  const parrainTitle =
    document.getElementById(
      "parrainTitle"
    );

  if (parrainTitle) {
    parrainTitle.textContent =
      t.parrainNumber;
  }


  // Generate button

  const generateButton =
    document.getElementById(
      "generateParrainButton"
    );

  if (generateButton) {

    if (
      !generateButton.disabled
    ) {
      generateButton.textContent =
        t.generateParrain;
    }
  }


  // Parrain Code title

  const parrainCodeTitle =
    document.getElementById(
      "parrainCodeTitle"
    );

  if (parrainCodeTitle) {
    parrainCodeTitle.textContent =
      t.parrainCode;
  }


  // Copy button

  const copyButton =
    document.getElementById(
      "copyParrainButton"
    );

  if (copyButton) {
    copyButton.textContent =
      t.copy;
  }


  // Footer

  const footerText =
    document.getElementById(
      "footerText"
    );

  if (footerText) {
    footerText.textContent =
      t.madeBy;
  }

}


// ======================================================
// 🌐 LANGUAGE SELECTOR
// ======================================================

function setupLanguageSelector() {

  const buttons =
    document.querySelectorAll(
      ".language-button"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      async () => {

        const language =
          button.dataset.language;

        if (
          !SUPPORTED_LANGUAGES.includes(
            language
          )
        ) {
          return;
        }


        setLanguage(language);


        // Hide language screen

        const languageScreen =
          document.getElementById(
            "languageScreen"
          );

        if (languageScreen) {
          languageScreen.hidden = true;
          languageScreen.classList.remove(
            "active"
          );
        }


        // Show Parrain screen

        const parrainScreen =
          document.getElementById(
            "parrainScreen"
          );

        if (parrainScreen) {
          parrainScreen.hidden = false;
          parrainScreen.classList.add(
            "active"
          );
        }


        // Get/generate Parrain information

        await loadParrainData();

      }
    );

  });

}


// ======================================================
// 🔗 API REQUEST
// ======================================================

async function requestParrainData() {

  const language =
    getLanguage();


  const response =
    await fetch(
      "/api/auth",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          language
        })
      }
    );


  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }


  if (!response.ok) {

    throw new Error(
      "API_ERROR"
    );

  }


  return data;
}


// ======================================================
// 📱 LOAD PARRAIN DATA
// ======================================================

async function loadParrainData() {

  const language =
    getLanguage();

  const t =
    translations[language] ||
    translations.fr;


  const numberElement =
    document.getElementById(
      "parrainNumber"
    );

  const codeSection =
    document.getElementById(
      "parrainCodeSection"
    );

  const codeElement =
    document.getElementById(
      "parrainCode"
    );

  const generateButton =
    document.getElementById(
      "generateParrainButton"
    );

  const message =
    document.getElementById(
      "parrainMessage"
    );


  if (message) {
    message.textContent =
      t.loading;
  }


  try {

    const data =
      await requestParrainData();


    if (
      !data ||
      data.success === false
    ) {

      throw new Error(
        "API_ERROR"
      );

    }


    // ==============================================
    // 📱 PARRAIN NUMBER
    // ==============================================

    const number =
      data.number ||
      data.parrainNumber;


    if (number) {

      if (numberElement) {

        // Remove "+" if backend sends it

        numberElement.textContent =
          String(number)
            .replace(/^\+/, "");

      }

    } else {

      if (message) {
        message.textContent =
          t.numberError;
      }

      return;

    }


    // ==============================================
    // 🔑 PARRAIN CODE
    // ==============================================

    const code =
      data.parrainCode ||
      data.code;


    if (code) {

      if (codeElement) {
        codeElement.value =
          code;
      }

      if (codeSection) {
        codeSection.hidden =
          false;
      }

      if (generateButton) {
        generateButton.textContent =
          t.generateParrain;
      }

      if (message) {
        message.textContent =
          "";
      }

    } else {

      if (message) {
        message.textContent =
          "";
      }

    }


  } catch (error) {

    console.error(
      "TOPFEROS MD API ERROR:",
      error
    );


    if (message) {

      if (
        error.message ===
        "API_ERROR"
      ) {

        message.textContent =
          t.error;

      } else {

        message.textContent =
          t.serverError;

      }

    }

  }

}


// ======================================================
// 🔑 GENERATE PARRAIN CODE
// ======================================================

async function generateParrainCode() {

  const language =
    getLanguage();

  const t =
    translations[language] ||
    translations.fr;


  const generateButton =
    document.getElementById(
      "generateParrainButton"
    );

  const message =
    document.getElementById(
      "parrainMessage"
    );

  const codeSection =
    document.getElementById(
      "parrainCodeSection"
    );

  const codeElement =
    document.getElementById(
      "parrainCode"
    );


  if (generateButton) {

    generateButton.disabled =
      true;

    generateButton.textContent =
      t.generating;
  }


  if (message) {
    message.textContent =
      "";
  }


  try {

    const data =
      await requestParrainData();


    if (
      !data ||
      data.success === false
    ) {
      throw new Error(
        "API_ERROR"
      );
    }


    const code =
      data.parrainCode ||
      data.code;


    if (!code) {
      throw new Error(
        "NO_CODE"
      );
    }


    if (codeElement) {
      codeElement.value =
        code;
    }


    if (codeSection) {
      codeSection.hidden =
        false;
    }


    if (generateButton) {

      generateButton.disabled =
        false;

      generateButton.textContent =
        t.generateParrain;
    }


  } catch (error) {

    console.error(
      "TOPFEROS MD CODE ERROR:",
      error
    );


    if (message) {

      message.textContent =
        error.message ===
        "NO_CODE"
          ? t.error
          : t.serverError;

    }


    if (generateButton) {

      generateButton.disabled =
        false;

      generateButton.textContent =
        t.generateParrain;

    }

  }

}


// ======================================================
// 📋 COPY PARRAIN CODE
// ======================================================

async function copyParrainCode() {

  const language =
    getLanguage();

  const t =
    translations[language] ||
    translations.fr;


  const codeElement =
    document.getElementById(
      "parrainCode"
    );

  const copyButton =
    document.getElementById(
      "copyParrainButton"
    );


  if (
    !codeElement ||
    !codeElement.value
  ) {
    return;
  }


  const code =
    codeElement.value;


  try {

    await navigator.clipboard.writeText(
      code
    );


    if (copyButton) {

      const oldText =
        copyButton.textContent;

      copyButton.textContent =
        t.copied;


      setTimeout(
        () => {

          copyButton.textContent =
            oldText ||
            t.copy;

        },
        1500
      );

    }


  } catch (error) {

    // Fallback for browsers where
    // Clipboard API is unavailable.

    try {

      codeElement.select();

      codeElement.setSelectionRange(
        0,
        codeElement.value.length
      );

      document.execCommand(
        "copy"
      );


      if (copyButton) {

        const oldText =
          copyButton.textContent;

        copyButton.textContent =
          t.copied;


        setTimeout(
          () => {

            copyButton.textContent =
              oldText ||
              t.copy;

          },
          1500
        );

      }

    } catch (fallbackError) {

      console.error(
        "COPY ERROR:",
        fallbackError
      );

    }

  }

}


// ======================================================
// 🎯 BUTTON EVENTS
// ======================================================

function setupButtons() {

  const generateButton =
    document.getElementById(
      "generateParrainButton"
    );

  if (generateButton) {

    generateButton.addEventListener(
      "click",
      generateParrainCode
    );

  }


  const copyButton =
    document.getElementById(
      "copyParrainButton"
    );

  if (copyButton) {

    copyButton.addEventListener(
      "click",
      copyParrainCode
    );

  }

}


// ======================================================
// 🚀 INITIALIZATION
// ======================================================

(function init() {

  const language =
    getLanguage();


  applyLanguage(language);

  setupLanguageSelector();

  setupButtons();

})();