// ╔══════════════════════════════════════════════╗
// ║            🤖 TOPFEROS MD V1.0.0            ║
// ║              🚀 TOPFEROS TECH               ║
// ╚══════════════════════════════════════════════╝

require("dotenv").config();

const config = {

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🤖 BOT INFORMATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  bot: {
    name: "TOPFEROS MD",
    version: "V1.0.0",
    prefix: ".",
    developer: "TOPFEROS TECH",

    // 🖼️ Logo prensipal bot la
    logo: "assets/1785077175499.png",

    // Public / Private
    mode: "public"
  },


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👑 OWNER / ADMIN BOT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  owner: {
    name: process.env.OWNER_NAME || "TOPFEROS MD",
    number: process.env.OWNER_NUMBER || ""
  },


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔗 OFFICIAL LINKS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  links: {

    // 📢 WhatsApp Channel
    channel:
      "https://whatsapp.com/channel/0029Vb8mtECL7UVSGYQOdm13",

    // 👥 WhatsApp Group
    group:
      "https://chat.whatsapp.com/COEEHvkaiu33hXwWfiO0Pq?s=cl&p=a&mlu=4",

    // 🌐 Web Bot
    // Nou pral mete sa apre deployment portal la.
    web:
      process.env.WEB_BOT_LINK || ""
  },


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚙️ BOT FEATURES
  // Tout ON/OFF sa yo pral kontwole
  // nan Web Settings Portal la.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  features: {

    // 💬 Message
    alwaysOnline: true,
    fakeTyping: true,
    fakeRecording: false,
    autoReact: true,

    // 👁️ Status
    autoStatusSeen: true,
    statusLike: true,
    statusReply: false,
    statusReact: true,

    // 🛡️ Security
    antiCall: true,
    antiDelete: true,
    antiSpam: true,

    // 🤖 AI
    aiChat: true,
    autoAIReply: false
  },


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👥 GROUP MANAGEMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  group: {

    // 👋 Welcome / Goodbye
    welcome: true,
    goodbye: false,

    // 🛡️ Group Security
    antiSpam: true,
    antiLink: false,
    antiDelete: true,
    groupSecurity: true,

    // 👑 Admin Bot
    adminNumber:
      process.env.ADMIN_BOT_NUMBER || "",

    adminName:
      process.env.ADMIN_BOT_NAME || "TOPFEROS MD",


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔒 GROUP SCHEDULE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    schedule: {

      enabled: false,

      // 🔒 Fèmen group
      close: {
        enabled: false,
        time: "22:00"
      },

      // 🔓 Louvri group
      open: {
        enabled: false,
        time: "06:00"
      },

      // 🇭🇹 Haiti timezone
      timezone: "America/Port-au-Prince"
    }
  },


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🌐 WEB SETTINGS PORTAL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  portal: {

    enabled: true,

    // Port Web Portal la
    port:
      Number(process.env.PORTAL_PORT) || 3000,

    // Session secret
    sessionSecret:
      process.env.SESSION_SECRET ||
      "CHANGE_THIS_SECRET",

    // Longè setting code la
    settingCodeLength: 12
  },


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🗄️ DATABASE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  database: {

    type: "sqlite",

    path:
      process.env.DATABASE_PATH ||
      "./database/topferos.db"
  },


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🤖 AI CONFIGURATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ai: {

    enabled: true,

    provider:
      process.env.AI_PROVIDER || "",

    apiKey:
      process.env.AI_API_KEY || "",

    model:
      process.env.AI_MODEL || "",

    autoReply: false
  },


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 MEDIA DOWNLOADER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  downloader: {

    enabled: true,

    youtube: true,
    tiktok: true,
    instagram: true,
    facebook: true
  },


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👋 WELCOME MESSAGE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  welcome: {

    enabled: true,

    // 🖼️ Montre logo a
    showLogo: true,

    // 🔗 Montre Channel / Group / Web
    showLinks: true,

    // ✨ Montre kapasite bot la
    showFeatures: true
  },


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🛡️ SECURITY CONFIGURATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  security: {

    // Konbyen warning anvan aksyon
    maxWarnings: 3,

    antiSpam: {

      enabled: true,

      // Maksimòm mesaj
      maxMessages: 5,

      // 10 segonn
      interval: 10000
    }
  }

};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📤 EXPORT CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = config;