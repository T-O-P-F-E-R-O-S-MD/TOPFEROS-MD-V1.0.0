"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V1.0.0               ║
// ║                 LANGUAGE SYSTEM                  ║
// ║              🚀 TOPFEROS TECH                     ║
// ╚════════════════════════════════════════════════════╝

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 SUPPORTED LANGUAGES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LANGUAGES = {
  en: {
    code: "en",
    name: "English",
    flag: "🇺🇸"
  },

  fr: {
    code: "fr",
    name: "Français",
    flag: "🇫🇷"
  },

  es: {
    code: "es",
    name: "Español",
    flag: "🇪🇸"
  }
};

// Lang default
const DEFAULT_LANGUAGE = "en";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗣️ TRANSLATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const translations = {

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🇺🇸 ENGLISH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  en: {

    botName: "🦁 TOPFEROS MD V1.0.0",

    languageTitle: "• Principal Language",

    languageDescription:
      "Choose your preferred language.",

    next: "Next ⏭️",

    continue: "Continue",

    welcome: "Welcome to TOPFEROS MD V1.0.0",

    parrainTitle: "⚙️ PARRAIN CODE",

    number: "Number",

    code: "Code",

    enterNumber:
      "Enter your WhatsApp number.",

    enterCode:
      "Enter your Parrain Code.",

    verify: "Verify",

    login: "Login",

    loginSuccess:
      "✅ Login successful.",

    invalidCode:
      "❌ Invalid code.",

    invalidNumber:
      "❌ Invalid number.",

    sessionInvalid:
      "❌ Your session is no longer valid.",

    botDisconnected:
      "🔴 Bot disconnected.",

    settingsTitle:
      "⚙️ SETTINGS PANEL",

    botInformation:
      "🤖 Bot Information",

    botSettings:
      "⚙️ Bot Settings",

    groupSettings:
      "👥 Group Settings",

    botNameLabel:
      "Bot Name",

    botAge:
      "Bot Age",

    prefix:
      "Prefix",

    publicMode:
      "Public Mode",

    privateMode:
      "Private Mode",

    alwaysOnline:
      "Always Online",

    fakeTyping:
      "Fake Typing",

    fakeRecording:
      "Fake Recording",

    autoReact:
      "Auto React",

    autoStatus:
      "Auto Status",

    statusReply:
      "Status Reply",

    statusLike:
      "Status Like",

    statusReact:
      "Status React",

    antiCall:
      "Anti Call",

    antiDelete:
      "Anti Delete",

    antiSpam:
      "Anti Spam",

    aiChat:
      "AI Chat",

    groupAntiSpam:
      "Group Anti Spam",

    groupAntiLink:
      "Group Anti Link",

    groupAntiDelete:
      "Group Anti Delete",

    adminGroup:
      "Admin Group",

    groupClose:
      "Group Close",

    groupOpen:
      "Group Open",

    save:
      "SAVE ✅",

    saving:
      "Saving...",

    saved:
      "✅ Settings saved successfully.",

    error:
      "❌ An error occurred.",

    connectionError:
      "❌ Cannot connect to the panel server.",

    sessionError:
      "❌ Session invalid or expired.",

    footer:
      "By TOPFEROS TECH"
  },


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🇫🇷 FRANÇAIS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  fr: {

    botName: "🦁 TOPFEROS MD V1.0.0",

    languageTitle: "• Langue principale",

    languageDescription:
      "Choisissez votre langue préférée.",

    next: "Suivant ⏭️",

    continue: "Continuer",

    welcome:
      "Bienvenue sur TOPFEROS MD V1.0.0",

    parrainTitle:
      "⚙️ CODE PARRAIN",

    number:
      "Numéro",

    code:
      "Code",

    enterNumber:
      "Entrez votre numéro WhatsApp.",

    enterCode:
      "Entrez votre code Parrain.",

    verify:
      "Vérifier",

    login:
      "Connexion",

    loginSuccess:
      "✅ Connexion réussie.",

    invalidCode:
      "❌ Code invalide.",

    invalidNumber:
      "❌ Numéro invalide.",

    sessionInvalid:
      "❌ Votre session n'est plus valide.",

    botDisconnected:
      "🔴 Le bot est déconnecté.",

    settingsTitle:
      "⚙️ PANNEAU DE CONFIGURATION",

    botInformation:
      "🤖 Informations du bot",

    botSettings:
      "⚙️ Paramètres du bot",

    groupSettings:
      "👥 Paramètres du groupe",

    botNameLabel:
      "Nom du bot",

    botAge:
      "Âge du bot",

    prefix:
      "Préfixe",

    publicMode:
      "Mode public",

    privateMode:
      "Mode privé",

    alwaysOnline:
      "Toujours en ligne",

    fakeTyping:
      "Fausse saisie",

    fakeRecording:
      "Faux enregistrement",

    autoReact:
      "Réaction automatique",

    autoStatus:
      "Statut automatique",

    statusReply:
      "Réponse au statut",

    statusLike:
      "J'aime automatique du statut",

    statusReact:
      "Réaction automatique au statut",

    antiCall:
      "Anti-appel",

    antiDelete:
      "Anti-suppression",

    antiSpam:
      "Anti-spam",

    aiChat:
      "Chat IA",

    groupAntiSpam:
      "Anti-spam du groupe",

    groupAntiLink:
      "Anti-lien du groupe",

    groupAntiDelete:
      "Anti-suppression du groupe",

    adminGroup:
      "Administration du groupe",

    groupClose:
      "Fermeture du groupe",

    groupOpen:
      "Ouverture du groupe",

    save:
      "ENREGISTRER ✅",

    saving:
      "Enregistrement...",

    saved:
      "✅ Paramètres enregistrés avec succès.",

    error:
      "❌ Une erreur s'est produite.",

    connectionError:
      "❌ Impossible de contacter le serveur du panneau.",

    sessionError:
      "❌ Session invalide ou expirée.",

    footer:
      "By TOPFEROS TECH"
  },


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🇪🇸 ESPAÑOL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  es: {

    botName: "🦁 TOPFEROS MD V1.0.0",

    languageTitle:
      "• Idioma principal",

    languageDescription:
      "Elige tu idioma preferido.",

    next:
      "Siguiente ⏭️",

    continue:
      "Continuar",

    welcome:
      "Bienvenido a TOPFEROS MD V1.0.0",

    parrainTitle:
      "⚙️ CÓDIGO DE REFERENCIA",

    number:
      "Número",

    code:
      "Código",

    enterNumber:
      "Introduce tu número de WhatsApp.",

    enterCode:
      "Introduce tu código de referencia.",

    verify:
      "Verificar",

    login:
      "Iniciar sesión",

    loginSuccess:
      "✅ Inicio de sesión exitoso.",

    invalidCode:
      "❌ Código inválido.",

    invalidNumber:
      "❌ Número inválido.",

    sessionInvalid:
      "❌ Tu sesión ya no es válida.",

    botDisconnected:
      "🔴 El bot está desconectado.",

    settingsTitle:
      "⚙️ PANEL DE CONFIGURACIÓN",

    botInformation:
      "🤖 Información del bot",

    botSettings:
      "⚙️ Configuración del bot",

    groupSettings:
      "👥 Configuración del grupo",

    botNameLabel:
      "Nombre del bot",

    botAge:
      "Edad del bot",

    prefix:
      "Prefijo",

    publicMode:
      "Modo público",

    privateMode:
      "Modo privado",

    alwaysOnline:
      "Siempre en línea",

    fakeTyping:
      "Escritura falsa",

    fakeRecording:
      "Grabación falsa",

    autoReact:
      "Reacción automática",

    autoStatus:
      "Estado automático",

    statusReply:
      "Respuesta al estado",

    statusLike:
      "Me gusta automático del estado",

    statusReact:
      "Reacción automática al estado",

    antiCall:
      "Anti llamadas",

    antiDelete:
      "Anti eliminación",

    antiSpam:
      "Anti spam",

    aiChat:
      "Chat IA",

    groupAntiSpam:
      "Anti spam del grupo",

    groupAntiLink:
      "Anti enlaces del grupo",

    groupAntiDelete:
      "Anti eliminación del grupo",

    adminGroup:
      "Administración del grupo",

    groupClose:
      "Cerrar grupo",

    groupOpen:
      "Abrir grupo",

    save:
      "GUARDAR ✅",

    saving:
      "Guardando...",

    saved:
      "✅ Configuración guardada correctamente.",

    error:
      "❌ Se produjo un error.",

    connectionError:
      "❌ No se puede conectar con el servidor del panel.",

    sessionError:
      "❌ La sesión no es válida o ha expirado.",

    footer:
      "By TOPFEROS TECH"
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔎 CHECK LANGUAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function isSupportedLanguage(language) {

  if (!language) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(
    LANGUAGES,
    String(language).toLowerCase()
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌐 NORMALIZE LANGUAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function normalizeLanguage(language) {

  const lang =
    String(language || "")
      .trim()
      .toLowerCase();

  if (isSupportedLanguage(lang)) {
    return lang;
  }

  return DEFAULT_LANGUAGE;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗣️ GET TRANSLATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function t(language, key, fallback = "") {

  const lang =
    normalizeLanguage(language);

  const languagePack =
    translations[lang] ||
    translations[DEFAULT_LANGUAGE];

  if (
    Object.prototype.hasOwnProperty.call(
      languagePack,
      key
    )
  ) {
    return languagePack[key];
  }

  if (
    Object.prototype.hasOwnProperty.call(
      translations[DEFAULT_LANGUAGE],
      key
    )
  ) {
    return translations[DEFAULT_LANGUAGE][key];
  }

  return fallback || key;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 GET LANGUAGE LIST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getLanguages() {

  return Object.values(
    LANGUAGES
  ).map(language => ({
    code: language.code,
    name: language.name,
    flag: language.flag
  }));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 GET LANGUAGE PACK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getLanguagePack(language) {

  const lang =
    normalizeLanguage(language);

  return {
    ...translations[lang]
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏷️ GET LANGUAGE INFORMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getLanguageInfo(language) {

  const lang =
    normalizeLanguage(language);

  return {
    ...LANGUAGES[lang]
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧠 CREATE LANGUAGE STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createLanguageState(
  language = DEFAULT_LANGUAGE
) {

  const selectedLanguage =
    normalizeLanguage(language);

  return {
    language: selectedLanguage,

    languageInfo:
      getLanguageInfo(
        selectedLanguage
      ),

    translations:
      getLanguagePack(
        selectedLanguage
      )
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {

  LANGUAGES,

  translations,

  DEFAULT_LANGUAGE,

  isSupportedLanguage,

  normalizeLanguage,

  t,

  getLanguages,

  getLanguagePack,

  getLanguageInfo,

  createLanguageState
};


// ╔════════════════════════════════════════════════════╗
// ║                    By TOPFEROS TECH               ║
// ╚════════════════════════════════════════════════════╝