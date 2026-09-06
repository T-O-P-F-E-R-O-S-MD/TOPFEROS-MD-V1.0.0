'use strict';

/*
 * ==========================================
 * TOPFEROS MD V1.0.0
 * Parrain Code Panel
 * ==========================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // ELEMENTS
  // ==========================================

  const languageScreen = document.getElementById('languageScreen');
  const parrainScreen = document.getElementById('parrainScreen');

  const languageTitle = document.getElementById('languageTitle');
  const parrainTitle = document.getElementById('parrainTitle');

  const numberLabel = document.getElementById('numberLabel');
  const numberInput = document.getElementById('parrainNumberInput');
  const numberHint = document.getElementById('numberHint');

  const generateButton = document.getElementById(
    'generateParrainButton'
  );

  const message = document.getElementById(
    'parrainMessage'
  );

  const codeSection = document.getElementById(
    'parrainCodeSection'
  );

  const codeTitle = document.getElementById(
    'parrainCodeTitle'
  );

  const codeInput = document.getElementById(
    'parrainCode'
  );

  const copyButton = document.getElementById(
    'copyParrainButton'
  );

  const footerText = document.getElementById(
    'footerText'
  );


  // ==========================================
  // LANGUAGE
  // ==========================================

  const translations = {

    en: {
      language: 'Language',
      parrainNumber: 'Parrain Number',
      whatsappNumber: 'WhatsApp Number',
      numberHint: 'Do not use +, spaces or -',
      generate: 'Generate Parrain Code',
      parrainCode: 'Parrain Code',
      copy: 'Copy',
      copied: 'Copied!',
      enterNumber: 'Please enter your WhatsApp number.',
      invalidNumber: 'Please enter a valid WhatsApp number.',
      generating: 'Generating Parrain Code...',
      generated: 'Parrain Code generated successfully.',
      serverError: 'Unable to generate Parrain Code.',
      connectionError: 'Connection error. Please try again.',
      footer: 'By TOPFEROS TECH'
    },

    fr: {
      language: 'Langue',
      parrainNumber: 'Numéro Parrain',
      whatsappNumber: 'Numéro WhatsApp',
      numberHint: "N'utilisez pas +, espaces ou -",
      generate: 'Générer le code Parrain',
      parrainCode: 'Code Parrain',
      copy: 'Copier',
      copied: 'Copié !',
      enterNumber: 'Veuillez entrer votre numéro WhatsApp.',
      invalidNumber: 'Veuillez entrer un numéro WhatsApp valide.',
      generating: 'Génération du code Parrain...',
      generated: 'Code Parrain généré avec succès.',
      serverError: 'Impossible de générer le code Parrain.',
      connectionError: 'Erreur de connexion. Veuillez réessayer.',
      footer: 'By TOPFEROS TECH'
    },

    es: {
      language: 'Idioma',
      parrainNumber: 'Número Parrain',
      whatsappNumber: 'Número de WhatsApp',
      numberHint: 'No utilice +, espacios ni -',
      generate: 'Generar código Parrain',
      parrainCode: 'Código Parrain',
      copy: 'Copiar',
      copied: '¡Copiado!',
      enterNumber: 'Por favor, introduzca su número de WhatsApp.',
      invalidNumber: 'Introduzca un número de WhatsApp válido.',
      generating: 'Generando código Parrain...',
      generated: 'Código Parrain generado correctamente.',
      serverError: 'No se pudo generar el código Parrain.',
      connectionError: 'Error de conexión. Inténtalo de nuevo.',
      footer: 'By TOPFEROS TECH'
    }

  };


  // ==========================================
  // CURRENT LANGUAGE
  // ==========================================

  let currentLanguage =
    localStorage.getItem('topferos_language') || 'en';

  if (!translations[currentLanguage]) {
    currentLanguage = 'en';
  }


  // ==========================================
  // SESSION
  // ==========================================

  let sessionId =
    localStorage.getItem('topferos_session_id') || '';


  // ==========================================
  // HELPERS
  // ==========================================

  function t(key) {
    return translations[currentLanguage][key] || key;
  }


  function showMessage(text, type = '') {

    message.textContent = text;

    message.className = 'message';

    if (type) {
      message.classList.add(type);
    }
  }


  function cleanNumber(value) {

    return String(value || '')
      .replace(/\D/g, '');

  }


  function setLoading(loading) {

    generateButton.disabled = loading;

    generateButton.textContent =
      loading ? t('generating') : t('generate');

  }


  // ==========================================
  // APPLY LANGUAGE
  // ==========================================

  function applyLanguage() {

    languageTitle.textContent = t('language');

    parrainTitle.textContent = t('parrainNumber');

    numberLabel.textContent = t('whatsappNumber');

    numberHint.textContent = t('numberHint');

    generateButton.textContent = t('generate');

    codeTitle.textContent = t('parrainCode');

    copyButton.textContent = t('copy');

    footerText.textContent = t('footer');

  }


  // ==========================================
  // SHOW PARRAIN SCREEN
  // ==========================================

  function showParrainScreen() {

    languageScreen.hidden = true;

    parrainScreen.hidden = false;

    numberInput.focus();

  }


  // ==========================================
  // LANGUAGE BUTTONS
  // ==========================================

  const languageButtons =
    document.querySelectorAll('.language-button');


  languageButtons.forEach(button => {

    button.addEventListener('click', () => {

      const selectedLanguage =
        button.dataset.language;

      if (!translations[selectedLanguage]) {
        return;
      }

      currentLanguage =
        selectedLanguage;

      localStorage.setItem(
        'topferos_language',
        currentLanguage
      );

      applyLanguage();

      showParrainScreen();

    });

  });


  // ==========================================
  // NUMBER INPUT
  // ==========================================

  numberInput.addEventListener('input', () => {

    const cleaned =
      cleanNumber(numberInput.value);

    numberInput.value = cleaned;

  });


  numberInput.addEventListener('paste', () => {

    setTimeout(() => {

      numberInput.value =
        cleanNumber(numberInput.value);

    }, 0);

  });


  // ==========================================
  // GENERATE PARRAIN CODE
  // ==========================================

  generateButton.addEventListener('click', async () => {

    const number =
      cleanNumber(numberInput.value);


    // ------------------------------------------
    // VALIDATE NUMBER
    // ------------------------------------------

    if (!number) {

      showMessage(
        t('enterNumber'),
        'error'
      );

      numberInput.focus();

      return;
    }


    if (number.length < 8) {

      showMessage(
        t('invalidNumber'),
        'error'
      );

      numberInput.focus();

      return;
    }


    // ------------------------------------------
    // RESET OLD CODE
    // ------------------------------------------

    codeSection.hidden = true;

    codeInput.value = '';

    showMessage(
      t('generating')
    );

    setLoading(true);


    try {

      // ----------------------------------------
      // SEND NUMBER TO SERVER
      // ----------------------------------------

      const response =
        await fetch('/api/auth', {

          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({

            sessionId: sessionId || '',

            number: number

          })

        });


      let data = null;

      try {

        data = await response.json();

      } catch (jsonError) {

        data = null;

      }


      // ----------------------------------------
      // SERVER ERROR
      // ----------------------------------------

      if (!response.ok || !data || !data.success) {

        const serverMessage =
          data && data.message
            ? data.message
            : t('serverError');

        throw new Error(serverMessage);

      }


      // ----------------------------------------
      // SAVE SESSION ID
      // ----------------------------------------

      if (data.sessionId) {

        sessionId =
          data.sessionId;

        localStorage.setItem(
          'topferos_session_id',
          sessionId
        );

      }


      // ----------------------------------------
      // GET PARRAIN CODE
      // ----------------------------------------

      const parrainCode =
        data.parrainCode || data.code;


      if (!parrainCode) {

        throw new Error(
          t('serverError')
        );

      }


      // ----------------------------------------
      // DISPLAY CODE
      // ----------------------------------------

      codeInput.value =
        String(parrainCode);


      codeSection.hidden = false;


      showMessage(
        t('generated'),
        'success'
      );


    } catch (error) {

      console.error(
        'TOPFEROS MD Parrain Error:',
        error
      );


      showMessage(
        error.message || t('connectionError'),
        'error'
      );


    } finally {

      setLoading(false);

    }

  });


  // ==========================================
  // COPY PARRAIN CODE
  // ==========================================

  copyButton.addEventListener('click', async () => {

    const code =
      codeInput.value.trim();


    if (!code) {
      return;
    }


    try {

      if (
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {

        await navigator.clipboard.writeText(code);

      } else {

        codeInput.select();

        codeInput.setSelectionRange(
          0,
          codeInput.value.length
        );

        document.execCommand('copy');

      }


      const oldText =
        copyButton.textContent;

      copyButton.textContent =
        t('copied');


      setTimeout(() => {

        copyButton.textContent =
          oldText || t('copy');

      }, 1500);


    } catch (error) {

      console.error(
        'Copy error:',
        error
      );

      codeInput.select();

    }

  });


  // ==========================================
  // ENTER KEY
  // ==========================================

  numberInput.addEventListener('keydown', event => {

    if (event.key === 'Enter') {

      event.preventDefault();

      generateButton.click();

    }

  });


  // ==========================================
  // INITIALIZE
  // ==========================================

  applyLanguage();

});