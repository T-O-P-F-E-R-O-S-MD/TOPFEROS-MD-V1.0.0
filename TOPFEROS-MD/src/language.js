"use strict";

/*
|--------------------------------------------------------------------------
| 🦁 TOPFEROS MD V2.0.0
| LANGUAGE SERVICE
|--------------------------------------------------------------------------
|
| Default language:
| 🇺🇸 English
|
| Supported languages:
| 🇺🇸 English
| 🇫🇷 French
| 🇪🇸 Spanish
| 🇩🇴 Dominican Spanish
| 🇵🇹 Portuguese
| 🇨🇳 Chinese
| 🇭🇹 Haitian Creole
|
|--------------------------------------------------------------------------
*/

const config = require("./config");

/*
|--------------------------------------------------------------------------
| SUPPORTED LANGUAGES
|--------------------------------------------------------------------------
*/

const LANGUAGES = Object.freeze({
  en: "English",
  fr: "French",
  es: "Spanish",
  es_do: "Dominican Spanish",
  pt: "Portuguese",
  zh: "Chinese",
  ht: "Haitian Creole"
});

const DEFAULT_LANGUAGE = "en";

/*
|--------------------------------------------------------------------------
| LANGUAGE ALIASES
|--------------------------------------------------------------------------
*/

const LANGUAGE_ALIASES = Object.freeze({
  en: "en",
  english: "en",

  fr: "fr",
  french: "fr",
  français: "fr",

  es: "es",
  spanish: "es",
  español: "es",

  es_do: "es_do",
  "es-do": "es_do",
  "dominican spanish": "es_do",
  "dominican": "es_do",

  pt: "pt",
  portuguese: "pt",
  português: "pt",

  zh: "zh",
  chinese: "zh",
  中文: "zh",

  ht: "ht",
  haitian: "ht",
  "haitian creole": "ht",
  kreyol: "ht",
  kreyòl: "ht",
  "kreyol ayisyen": "ht",
  "kreyòl ayisyen": "ht"
});

/*
|--------------------------------------------------------------------------
| LANGUAGE RESOLUTION
|--------------------------------------------------------------------------
*/

function resolveLanguage(language) {
  const value = String(language || "")
    .trim()
    .toLowerCase();

  return LANGUAGE_ALIASES[value] || null;
}

function normalizeLanguage(language) {
  return (
    resolveLanguage(language) ||
    DEFAULT_LANGUAGE
  );
}

function isSupportedLanguage(language) {
  return resolveLanguage(language) !== null;
}

/*
|--------------------------------------------------------------------------
| LANGUAGE INFORMATION
|--------------------------------------------------------------------------
*/

function getAvailableLanguages() {
  return {
    ...LANGUAGES
  };
}

function getLanguageName(language) {
  const normalized =
    normalizeLanguage(language);

  return (
    LANGUAGES[normalized] ||
    LANGUAGES[DEFAULT_LANGUAGE]
  );
}

function getDefaultLanguage() {
  return DEFAULT_LANGUAGE;
}

function getBotLanguage() {
  return normalizeLanguage(
    config?.bot?.language
  );
}

/*
|--------------------------------------------------------------------------
| TRANSLATIONS
|--------------------------------------------------------------------------
*/

const translations = Object.freeze({

  /*
  |--------------------------------------------------------------------------
  | 🇺🇸 ENGLISH
  |--------------------------------------------------------------------------
  */

  en: Object.freeze({

    bot: {
      name: "TOPFEROS MD",
      version: "V2.0.0",
      online: "ONLINE & READY",
      footer: "🦁 TECH BY TOPFEROS MD 🐑"
    },

    common: {
      success: "Success",
      error: "Error",
      enabled: "ON",
      disabled: "OFF",
      yes: "Yes",
      no: "No"
    },

    commands: {
      menu: {
        name: "Menu",
        description:
          "View all available commands."
      },

      setting: {
        name: "Settings",
        description:
          "Open the TOPFEROS MD Settings Panel."
      },

      parrain: {
        name: "Parrain",
        description:
          "Generate a TOPFEROS MD Parrain code."
      },

      ai: {
        name: "AI",
        description:
          "Ask the TOPFEROS AI assistant."
      },

      prompt: {
        name: "Prompt",
        description:
          "Generate or improve an AI prompt."
      },

      play: {
        name: "Play",
        description:
          "Play or download media."
      },

      video: {
        name: "Video",
        description:
          "Download and send a video."
      }
    },

    messages: {
      unknownCommand:
        "❌ Unknown command.",

      useMenu:
        "📖 Type .menu to see available commands.",

      missingQuestion:
        "🤖 Please provide a question.",

      missingPrompt:
        "🤖 Please provide a prompt request.",

      missingMedia:
        "🎵 Please provide what you want to play.",

      missingVideo:
        "🎬 Please provide a video URL.",

      processing:
        "⏳ Processing your request...",

      serviceUnavailable:
        "⚠️ This service is not available yet.",

      genericError:
        "❌ An error occurred while processing your request."
    },

    panel: {
      settings:
        "⚙️ TOPFEROS MD SETTINGS",

      openSettings:
        "🔗 Open the Settings Panel:",

      urlNotConfigured:
        "❌ The Settings Panel URL has not been configured yet."
    },

    parrain: {
      title:
        "PARRAIN CODE",

      number:
        "NUMBER",

      generated:
        "🟢 CODE GENERATED SUCCESSFULLY",

      copy:
        "📋 Copy this code and give it to the person you want to refer."
    }
  }),

  /*
  |--------------------------------------------------------------------------
  | 🇫🇷 FRENCH
  |--------------------------------------------------------------------------
  */

  fr: Object.freeze({

    bot: {
      name: "TOPFEROS MD",
      version: "V2.0.0",
      online: "EN LIGNE & PRÊT",
      footer: "🦁 TECH BY TOPFEROS MD 🐑"
    },

    common: {
      success: "Succès",
      error: "Erreur",
      enabled: "ACTIVÉ",
      disabled: "DÉSACTIVÉ",
      yes: "Oui",
      no: "Non"
    },

    commands: {
      menu: {
        name: "Menu",
        description:
          "Voir toutes les commandes disponibles."
      },

      setting: {
        name: "Paramètres",
        description:
          "Ouvrir le panneau des paramètres TOPFEROS MD."
      },

      parrain: {
        name: "Parrain",
        description:
          "Générer un code Parrain TOPFEROS MD."
      },

      ai: {
        name: "IA",
        description:
          "Poser une question à l'assistant IA TOPFEROS."
      },

      prompt: {
        name: "Prompt",
        description:
          "Générer ou améliorer un prompt IA."
      },

      play: {
        name: "Lecture",
        description:
          "Lire ou télécharger un média."
      },

      video: {
        name: "Vidéo",
        description:
          "Télécharger et envoyer une vidéo."
      }
    },

    messages: {
      unknownCommand:
        "❌ Commande inconnue.",

      useMenu:
        "📖 Tapez .menu pour voir les commandes disponibles.",

      missingQuestion:
        "🤖 Veuillez fournir une question.",

      missingPrompt:
        "🤖 Veuillez fournir une demande de prompt.",

      missingMedia:
        "🎵 Veuillez indiquer ce que vous voulez lire.",

      missingVideo:
        "🎬 Veuillez fournir une URL vidéo.",

      processing:
        "⏳ Traitement de votre demande...",

      serviceUnavailable:
        "⚠️ Ce service n'est pas encore disponible.",

      genericError:
        "❌ Une erreur s'est produite lors du traitement de votre demande."
    },

    panel: {
      settings:
        "⚙️ PARAMÈTRES TOPFEROS MD",

      openSettings:
        "🔗 Ouvrir le panneau des paramètres :",

      urlNotConfigured:
        "❌ L'URL du panneau des paramètres n'est pas configurée."
    },

    parrain: {
      title:
        "CODE PARRAIN",

      number:
        "NUMÉRO",

      generated:
        "🟢 CODE GÉNÉRÉ AVEC SUCCÈS",

      copy:
        "📋 Copiez ce code et donnez-le à la personne que vous souhaitez parrainer."
    }
  }),

  /*
  |--------------------------------------------------------------------------
  | 🇪🇸 SPANISH
  |--------------------------------------------------------------------------
  */

  es: Object.freeze({

    bot: {
      name: "TOPFEROS MD",
      version: "V2.0.0",
      online: "EN LÍNEA Y LISTO",
      footer: "🦁 TECH BY TOPFEROS MD 🐑"
    },

    common: {
      success: "Éxito",
      error: "Error",
      enabled: "ACTIVADO",
      disabled: "DESACTIVADO",
      yes: "Sí",
      no: "No"
    },

    commands: {
      menu: {
        name: "Menú",
        description:
          "Ver todos los comandos disponibles."
      },

      setting: {
        name: "Configuración",
        description:
          "Abrir el panel de configuración de TOPFEROS MD."
      },

      parrain: {
        name: "Padrino",
        description:
          "Generar un código de padrino TOPFEROS MD."
      },

      ai: {
        name: "IA",
        description:
          "Haz una pregunta al asistente de IA."
      },

      prompt: {
        name: "Prompt",
        description:
          "Generar o mejorar un prompt de IA."
      },

      play: {
        name: "Reproducir",
        description:
          "Reproducir o descargar contenido multimedia."
      },

      video: {
        name: "Vídeo",
        description:
          "Descargar y enviar un vídeo."
      }
    },

    messages: {
      unknownCommand:
        "❌ Comando desconocido.",

      useMenu:
        "📖 Escribe .menu para ver los comandos disponibles.",

      missingQuestion:
        "🤖 Por favor, escribe una pregunta.",

      missingPrompt:
        "🤖 Por favor, escribe una solicitud de prompt.",

      missingMedia:
        "🎵 Indica lo que quieres reproducir.",

      missingVideo:
        "🎬 Proporciona una URL de vídeo.",

      processing:
        "⏳ Procesando tu solicitud...",

      serviceUnavailable:
        "⚠️ Este servicio todavía no está disponible.",

      genericError:
        "❌ Ocurrió un error al procesar tu solicitud."
    },

    panel: {
      settings:
        "⚙️ CONFIGURACIÓN DE TOPFEROS MD",

      openSettings:
        "🔗 Abrir el panel de configuración:",

      urlNotConfigured:
        "❌ La URL del panel de configuración no está configurada."
    },

    parrain: {
      title:
        "CÓDIGO DE PADRINO",

      number:
        "NÚMERO",

      generated:
        "🟢 CÓDIGO GENERADO CORRECTAMENTE",

      copy:
        "📋 Copia este código y dáselo a la persona que quieres invitar."
    }
  }),

  /*
  |--------------------------------------------------------------------------
  | 🇩🇴 DOMINICAN SPANISH
  |--------------------------------------------------------------------------
  */

  es_do: Object.freeze({

    bot: {
      name: "TOPFEROS MD",
      version: "V2.0.0",
      online: "EN LÍNEA Y LISTO",
      footer: "🦁 TECH BY TOPFEROS MD 🐑"
    },

    common: {
      success: "Listo",
      error: "Error",
      enabled: "ACTIVADO",
      disabled: "DESACTIVADO",
      yes: "Sí",
      no: "No"
    },

    commands: {
      menu: {
        name: "Menú",
        description:
          "Mira todos los comandos disponibles."
      },

      setting: {
        name: "Ajustes",
        description:
          "Abre el panel de ajustes de TOPFEROS MD."
      },

      parrain: {
        name: "Padrino",
        description:
          "Genera un código de padrino de TOPFEROS MD."
      },

      ai: {
        name: "IA",
        description:
          "Pregúntale algo al asistente de IA."
      },

      prompt: {
        name: "Prompt",
        description:
          "Genera o mejora un prompt de IA."
      },

      play: {
        name: "Reproducir",
        description:
          "Reproduce o descarga contenido multimedia."
      },

      video: {
        name: "Video",
        description:
          "Descarga y manda un video."
      }
    },

    messages: {
      unknownCommand:
        "❌ Ese comando no existe.",

      useMenu:
        "📖 Escribe .menu para ver los comandos disponibles.",

      missingQuestion:
        "🤖 Escribe tu pregunta.",

      missingPrompt:
        "🤖 Escribe lo que necesitas para el prompt.",

      missingMedia:
        "🎵 Dime qué quieres reproducir.",

      missingVideo:
        "🎬 Pásame la URL del video.",

      processing:
        "⏳ Procesando tu solicitud...",

      serviceUnavailable:
        "⚠️ Este servicio todavía no está disponible.",

      genericError:
        "❌ Ocurrió un error procesando tu solicitud."
    },

    panel: {
      settings:
        "⚙️ AJUSTES DE TOPFEROS MD",

      openSettings:
        "🔗 Abre el panel de ajustes:",

      urlNotConfigured:
        "❌ La URL del panel de ajustes no está configurada."
    },

    parrain: {
      title:
        "CÓDIGO DE PADRINO",

      number:
        "NÚMERO",

      generated:
        "🟢 CÓDIGO GENERADO CORRECTAMENTE",

      copy:
        "📋 Copia este código y pásaselo a la persona que quieres invitar."
    }
  }),

  /*
  |--------------------------------------------------------------------------
  | 🇵🇹 PORTUGUESE
  |--------------------------------------------------------------------------
  */

  pt: Object.freeze({

    bot: {
      name: "TOPFEROS MD",
      version: "V2.0.0",
      online: "ONLINE E PRONTO",
      footer: "🦁 TECH BY TOPFEROS MD 🐑"
    },

    common: {
      success: "Sucesso",
      error: "Erro",
      enabled: "ATIVADO",
      disabled: "DESATIVADO",
      yes: "Sim",
      no: "Não"
    },

    commands: {
      menu: {
        name: "Menu",
        description:
          "Ver todos os comandos disponíveis."
      },

      setting: {
        name: "Configurações",
        description:
          "Abrir o painel de configurações do TOPFEROS MD."
      },

      parrain: {
        name: "Padrinho",
        description:
          "Gerar um código de padrinho TOPFEROS MD."
      },

      ai: {
        name: "IA",
        description:
          "Faça uma pergunta ao assistente de IA."
      },

      prompt: {
        name: "Prompt",
        description:
          "Gerar ou melhorar um prompt de IA."
      },

      play: {
        name: "Reproduzir",
        description:
          "Reproduzir ou baixar mídia."
      },

      video: {
        name: "Vídeo",
        description:
          "Baixar e enviar um vídeo."
      }
    },

    messages: {
      unknownCommand:
        "❌ Comando desconhecido.",

      useMenu:
        "📖 Digite .menu para ver os comandos disponíveis.",

      missingQuestion:
        "🤖 Por favor, envie uma pergunta.",

      missingPrompt:
        "🤖 Por favor, envie uma solicitação de prompt.",

      missingMedia:
        "🎵 Informe o que você deseja reproduzir.",

      missingVideo:
        "🎬 Envie uma URL de vídeo.",

      processing:
        "⏳ Processando sua solicitação...",

      serviceUnavailable:
        "⚠️ Este serviço ainda não está disponível.",

      genericError:
        "❌ Ocorreu um erro ao processar sua solicitação."
    },

    panel: {
      settings:
        "⚙️ CONFIGURAÇÕES TOPFEROS MD",

      openSettings:
        "🔗 Abrir o painel de configurações:",

      urlNotConfigured:
        "❌ A URL do painel de configurações não foi configurada."
    },

    parrain: {
      title:
        "CÓDIGO DE PADRINHO",

      number:
        "NÚMERO",

      generated:
        "🟢 CÓDIGO GERADO COM SUCESSO",

      copy:
        "📋 Copie este código e entregue à pessoa que você deseja convidar."
    }
  }),

  /*
  |--------------------------------------------------------------------------
  | 🇨🇳 CHINESE
  |--------------------------------------------------------------------------
  */

  zh: Object.freeze({

    bot: {
      name: "TOPFEROS MD",
      version: "V2.0.0",
      online: "在线并准备就绪",
      footer: "🦁 TECH BY TOPFEROS MD 🐑"
    },

    common: {
      success: "成功",
      error: "错误",
      enabled: "开启",
      disabled: "关闭",
      yes: "是",
      no: "否"
    },

    commands: {
      menu: {
        name: "菜单",
        description:
          "查看所有可用命令。"
      },

      setting: {
        name: "设置",
        description:
          "打开 TOPFEROS MD 设置面板。"
      },

      parrain: {
        name: "推荐码",
        description:
          "生成 TOPFEROS MD 推荐码。"
      },

      ai: {
        name: "AI",
        description:
          "向 TOPFEROS AI 助手提问。"
      },

      prompt: {
        name: "提示词",
        description:
          "生成或改进 AI 提示词。"
      },

      play: {
        name: "播放",
        description:
          "播放或下载媒体。"
      },

      video: {
        name: "视频",
        description:
          "下载并发送视频。"
      }
    },

    messages: {
      unknownCommand:
        "❌ 未知命令。",

      useMenu:
        "📖 输入 .menu 查看可用命令。",

      missingQuestion:
        "🤖 请输入你的问题。",

      missingPrompt:
        "🤖 请输入提示词请求。",

      missingMedia:
        "🎵 请告诉我你想播放什么。",

      missingVideo:
        "🎬 请提供视频链接。",

      processing:
        "⏳ 正在处理你的请求...",

      serviceUnavailable:
        "⚠️ 此服务暂时不可用。",

      genericError:
        "❌ 处理请求时发生错误。"
    },

    panel: {
      settings:
        "⚙️ TOPFEROS MD 设置",

      openSettings:
        "🔗 打开设置面板：",

      urlNotConfigured:
        "❌ 设置面板 URL 尚未配置。"
    },

    parrain: {
      title:
        "推荐码",

      number:
        "号码",

      generated:
        "🟢 推荐码生成成功",

      copy:
        "📋 复制此代码并发送给你想邀请的人。"
    }
  }),

  /*
  |--------------------------------------------------------------------------
  | 🇭🇹 HAITIAN CREOLE
  |--------------------------------------------------------------------------
  */

  ht: Object.freeze({

    bot: {
      name: "TOPFEROS MD",
      version: "V2.0.0",
      online: "ANLIY & PARE",
      footer: "🦁 TECH BY TOPFEROS MD 🐑"
    },

    common: {
      success: "Siksè",
      error: "Erè",
      enabled: "AKTIVE",
      disabled: "DEZAKTIVE",
      yes: "Wi",
      no: "Non"
    },

    commands: {
      menu: {
        name: "Meni",
        description:
          "Gade tout kòmand ki disponib yo."
      },

      setting: {
        name: "Paramèt",
        description:
          "Louvri panèl paramèt TOPFEROS MD la."
      },

      parrain: {
        name: "Parenn",
        description:
          "Jenere yon kòd Parenn TOPFEROS MD."
      },

      ai: {
        name: "AI",
        description:
          "Poze asistan AI TOPFEROS la yon kesyon."
      },

      prompt: {
        name: "Prompt",
        description:
          "Jenere oswa amelyore yon prompt AI."
      },

      play: {
        name: "Jwe",
        description:
          "Jwe oswa telechaje medya."
      },

      video: {
        name: "Videyo",
        description:
          "Telechaje epi voye yon videyo."
      }
    },

    messages: {
      unknownCommand:
        "❌ Kòmand sa a pa egziste.",

      useMenu:
        "📖 Tape .menu pou wè kòmand ki disponib yo.",

      missingQuestion:
        "🤖 Tanpri voye kesyon ou an.",

      missingPrompt:
        "🤖 Tanpri voye demann prompt ou an.",

      missingMedia:
        "🎵 Tanpri di kisa ou vle jwe.",

      missingVideo:
        "🎬 Tanpri voye URL videyo a.",

      processing:
        "⏳ N ap trete demann ou an...",

      serviceUnavailable:
        "⚠️ Sèvis sa a poko disponib.",

      genericError:
        "❌ Gen yon erè pandan n ap trete demann ou an."
    },

    panel: {
      settings:
        "⚙️ PARAMÈT TOPFEROS MD",

      openSettings:
        "🔗 Louvri panèl paramèt la:",

      urlNotConfigured:
        "❌ URL panèl paramèt la poko konfigire."
    },

    parrain: {
      title:
        "KÒD PARENN",

      number:
        "NIMEWO",

      generated:
        "🟢 KÒD LA JENERE AVÈK SIKSÈ",

      copy:
        "📋 Kopye kòd sa a epi bay moun ou vle envite a li."
    }
  })
});

/*
|--------------------------------------------------------------------------
| GET TRANSLATIONS
|--------------------------------------------------------------------------
*/

function getTranslations(
  language = DEFAULT_LANGUAGE
) {
  const normalized =
    normalizeLanguage(language);

  return (
    translations[normalized] ||
    translations[DEFAULT_LANGUAGE]
  );
}

/*
|--------------------------------------------------------------------------
| GET TEXT BY KEY
|--------------------------------------------------------------------------
*/

function getText(
  key,
  language = DEFAULT_LANGUAGE,
  fallback = ""
) {
  const dictionary =
    getTranslations(language);

  const parts = String(key || "")
    .split(".")
    .filter(Boolean);

  let value = dictionary;

  for (const part of parts) {
    if (
      value &&
      Object.prototype.hasOwnProperty.call(
        value,
        part
      )
    ) {
      value = value[part];
    } else {
      value = undefined;
      break;
    }
  }

  if (typeof value === "string") {
    return value;
  }

  return fallback;
}

/*
|--------------------------------------------------------------------------
| GET BOT TEXT
|--------------------------------------------------------------------------
*/

function getBotText(
  key,
  fallback = ""
) {
  return getText(
    key,
    getBotLanguage(),
    fallback
  );
}

/*
|--------------------------------------------------------------------------
| SET LANGUAGE
|--------------------------------------------------------------------------
*/

function setLanguage(language) {
  const resolved =
    resolveLanguage(language);

  if (!resolved) {
    return {
      success: false,
      language: DEFAULT_LANGUAGE,
      name: getLanguageName(DEFAULT_LANGUAGE)
    };
  }

  return {
    success: true,
    language: resolved,
    name: getLanguageName(resolved)
  };
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  translations,

  resolveLanguage,
  normalizeLanguage,
  isSupportedLanguage,

  getAvailableLanguages,
  getLanguageName,
  getDefaultLanguage,
  getBotLanguage,

  getTranslations,
  getText,
  getBotText,

  setLanguage
};