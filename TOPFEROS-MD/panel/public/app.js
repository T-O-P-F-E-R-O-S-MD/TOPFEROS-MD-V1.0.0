<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <meta
    name="theme-color"
    content="#000000"
  >

  <title>TOPFEROS MD PANEL</title>

  <link
    rel="stylesheet"
    href="/style.css?v=31"
  >
</head>

<body>

  <main class="container">

    <!-- =========================
         MAIN LOGO
    ========================== -->

    <img
      src="/assets/logo.png"
      class="logo"
      alt="TOPFEROS MD"
    >

    <h1>🦁 TOPFEROS MD PANEL</h1>


    <!-- =========================
         LANGUAGE SCREEN
    ========================== -->

    <section
      id="languageScreen"
      class="screen"
    >

      <h2>🌐 Select Language</h2>

      <p class="description">
        Choose your preferred language.
      </p>

      <button
        type="button"
        onclick="selectLanguage('en')"
      >
        🇬🇧 English
      </button>

      <button
        type="button"
        onclick="selectLanguage('fr')"
      >
        🇫🇷 Français
      </button>

      <button
        type="button"
        onclick="selectLanguage('es')"
      >
        🇪🇸 Español
      </button>

    </section>


    <!-- =========================
         CONNECT BOT SCREEN
    ========================== -->

    <section
      id="connectScreen"
      class="screen hidden"
    >

      <h2>📱 CONNECT BOT</h2>

      <p class="description">
        Enter your WhatsApp number to generate
        a Pairing Code.
      </p>

      <input
        id="phoneNumber"
        type="tel"
        inputmode="numeric"
        autocomplete="tel"
        placeholder="509XXXXXXXX"
      >

      <button
        id="pairingButton"
        type="button"
        onclick="requestPairingCode()"
      >
        🔐 GET PAIRING CODE
      </button>


      <!-- =========================
           PAIRING CODE
      ========================== -->

      <div
        id="pairingBox"
        class="pairingBox hidden"
      >

        <h3>🔑 YOUR PAIRING CODE</h3>

        <div
          id="pairingCode"
          class="pairingCode"
        >
          ----
        </div>

        <button
          id="copyPairingButton"
          type="button"
          class="secondaryButton"
          onclick="copyPairingCode()"
        >
          📋 COPY CODE
        </button>

        <p class="description">
          Open WhatsApp on your phone and enter
          this code when requested.
        </p>

      </div>


      <!-- =========================
           CONNECTION STATUS
      ========================== -->

      <div
        id="connectStatus"
        class="statusBox"
      >
        ⚪ Waiting for connection...
      </div>

      <p
        id="pairingMessage"
        class="message"
      ></p>

    </section>


    <!-- =========================
         SETTINGS LOGIN
    ========================== -->

    <section
      id="loginScreen"
      class="screen hidden"
    >

      <h2>🔐 SETTINGS LOGIN</h2>

      <p class="description">
        Enter your 6-character Settings Code.
      </p>

      <input
        id="settingsCode"
        type="text"
        maxlength="6"
        minlength="6"
        autocomplete="off"
        autocapitalize="characters"
        placeholder="G7K2P9"
      >

      <button
        id="verifyButton"
        type="button"
        onclick="verifySettings()"
      >
        🔓 VERIFY / CONNECT
      </button>

      <p
        id="loginMessage"
        class="message"
      ></p>

      <button
        type="button"
        class="secondaryButton"
        onclick="backToConnect()"
      >
        ← BACK TO CONNECT
      </button>

    </section>


    <!-- =========================
         DASHBOARD
    ========================== -->

    <section
      id="dashboard"
      class="hidden"
    >

      <div class="dashboardHeader">

        <img
          src="/assets/logo.png"
          class="dashboardLogo"
          alt="TOPFEROS MD"
        >

        <h2>⚙️ BOT SETTINGS</h2>

        <p id="connectionState">
          🟢 Connected
        </p>

      </div>


      <!-- BOT INFORMATION -->

      <div class="card">

        <h3>🤖 BOT INFORMATION</h3>

        <div class="infoGrid">

          <label>
            Name

            <input
              id="botName"
              type="text"
              value="TOPFEROS MD"
              autocomplete="off"
            >
          </label>

          <label>
            Number

            <input
              id="botNumber"
              type="text"
              readonly
            >
          </label>

          <label>
            Prefix

            <input
              id="botPrefix"
              type="text"
              value="."
              maxlength="5"
              autocomplete="off"
            >
          </label>

          <label>
            Mode

            <input
              id="botMode"
              type="text"
              value="public"
              readonly
            >
          </label>

        </div>

      </div>


      <!-- GENERAL -->

      <div class="card">

        <h3>⚙️ GENERAL</h3>

        <div
          id="generalSettings"
          class="settingsList"
        ></div>

      </div>


      <!-- PROTECTION -->

      <div class="card">

        <h3>🛡️ PROTECTION</h3>

        <div
          id="protectionSettings"
          class="settingsList"
        ></div>

      </div>


      <!-- STATUS -->

      <div class="card">

        <h3>📱 STATUS</h3>

        <div
          id="statusSettings"
          class="settingsList"
        ></div>

      </div>


      <!-- GROUP -->

      <div class="card">

        <h3>👥 GROUP</h3>

        <div
          id="groupSettings"
          class="settingsList"
        ></div>

      </div>


      <!-- AI -->

      <div class="card">

        <h3>🤖 AI</h3>

        <div
          id="aiSettings"
          class="settingsList"
        ></div>

      </div>


      <!-- SAVE -->

      <button
        id="saveButton"
        class="saveButton"
        type="button"
        onclick="saveSettings()"
      >
        💾 SAVE SETTINGS
      </button>

      <p
        id="saveMessage"
        class="message"
      ></p>


      <!-- LOGOUT -->

      <button
        id="logoutButton"
        class="secondaryButton"
        type="button"
        onclick="logoutPanel()"
      >
        🚪 LOGOUT
      </button>


      <footer>
        ==========================<br>
        By TOPFEROS Tech<br>
        ==========================
      </footer>

    </section>

  </main>


  <!-- =========================
       JAVASCRIPT
  ========================== -->

  <script src="/app.js?v=31"></script>

</body>
</html>