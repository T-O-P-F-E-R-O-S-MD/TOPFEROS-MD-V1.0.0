<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>PANEL TOPFEROS MD SETTINGS</title>

  <link
    rel="stylesheet"
    href="/style.css"
  >
</head>

<body>

  <main class="container">

    <!-- ============================================================
         🌐 LANGUAGE
         ⚠️ PA MANYEN — EXISTING LANGUAGE SCREEN
         ============================================================ -->

    <section
      id="languageScreen"
      class="card hidden"
    >

      <div class="logo-container">

        <img
          class="logo"
          src="/assets/logo.png"
          alt="TOPFEROS MD"
          onerror="this.style.display='none';"
        >

      </div>

      <h1>🌐 LANGUAGE</h1>

      <p class="message">
        Choose your language / Choisissez votre langue
      </p>

      <div class="language-buttons">

        <button
          type="button"
          class="language-btn"
          onclick="selectSettingsLanguage('en')"
        >
          🇬🇧 English
        </button>

        <button
          type="button"
          class="language-btn"
          onclick="selectSettingsLanguage('fr')"
        >
          🇫🇷 Français
        </button>

        <button
          type="button"
          class="language-btn"
          onclick="selectSettingsLanguage('es')"
        >
          🇪🇸 Español
        </button>

      </div>

      <div class="footer">
        Made in TOPFEROS TECH
      </div>

    </section>


    <!-- ============================================================
         🔐 LOGIN
         ⚠️ PA MANYEN — EXISTING NUMBER + CODE SCREEN
         ============================================================ -->

    <section
      id="loginScreen"
      class="card hidden"
    >

      <div
        id="accessLogoContainer"
        class="logo-container"
      >

        <img
          id="accessLogo"
          class="logo"
          src="/assets/logo.png"
          alt="TOPFEROS MD"
          onerror="this.style.display='none';"
        >

      </div>

      <h1 id="settingsLoginTitle">
        🔐 SETTINGS
      </h1>

      <div class="settings-box">

        <div class="info-field">

          <label
            id="settingsNumberLabel"
            for="settingsNumber"
          >
            Number:
          </label>

          <input
            id="settingsNumber"
            type="tel"
            inputmode="numeric"
            autocomplete="off"
            placeholder="Number"
          >

        </div>


        <div class="info-field">

          <label
            id="settingsCodeLabel"
            for="settingsCode"
          >
            Settings Code:
          </label>

          <input
            id="settingsCode"
            type="text"
            maxlength="6"
            autocomplete="one-time-code"
            placeholder="6-character code"
          >

        </div>

      </div>


      <button
        id="verifyButton"
        class="next-button"
        type="button"
        onclick="verifySettings()"
      >
        🔓 VERIFY
      </button>


      <div
        id="loginMessage"
        class="message"
      ></div>


      <div class="footer">
        Made in TOPFEROS TECH
      </div>

    </section>


    <!-- ============================================================
         ⚙️ NEW TOPFEROS MD SETTINGS PANEL
         ============================================================ -->

    <section
      id="settingsPanel"
      class="card settings-screen hidden"
    >

      <div
        id="settingsLogoContainer"
        class="logo-container"
      >

        <img
          id="botLogo"
          class="logo"
          src="/assets/logo.png"
          alt="TOPFEROS MD SETTINGS"
          onerror="this.style.display='none';"
        >

      </div>


      <div class="settings-title">

        <h1 id="settingsPanelTitle">
          🦁 PANEL TOPFEROS MD SETTINGS
        </h1>

        <div
          id="connectionStatus"
          class="message success"
        >
          🟢 CONNECTED
        </div>

      </div>


      <!-- ==========================================================
           📋 BASIC INFO
           ========================================================== -->

      <div class="settings-box">

        <h2>
          ───────── BASIC INFO ─────────
        </h2>


        <div class="info-field">

          <label for="ownerNumber">
            OWNER NUMBER
          </label>

          <input
            id="ownerNumber"
            type="text"
            value=""
            readonly
            disabled
            autocomplete="off"
          >

        </div>


        <div class="info-field editable-field">

          <label for="botName">
            BOT NAME
          </label>

          <div class="editable-input">

            <input
              id="botName"
              type="text"
              value="TOPFEROS MD"
              autocomplete="off"
            >

            <button
              type="button"
              class="edit-button"
              data-edit-target="botName"
              aria-label="Edit bot name"
            >
              ✏️
            </button>

          </div>

        </div>


        <div class="info-field editable-field">

          <label for="botOrigin">
            LOCATION
          </label>

          <div class="editable-input">

            <input
              id="botOrigin"
              type="text"
              value="TOPFEROS CHINWA"
              autocomplete="off"
            >

            <button
              type="button"
              class="edit-button"
              data-edit-target="botOrigin"
              aria-label="Edit location"
            >
              ✏️
            </button>

          </div>

        </div>


        <div class="info-field editable-field">

          <label for="botAge">
            AGE
          </label>

          <div class="editable-input">

            <input
              id="botAge"
              type="number"
              value="20"
              min="0"
              autocomplete="off"
            >

            <button
              type="button"
              class="edit-button"
              data-edit-target="botAge"
              aria-label="Edit age"
            >
              ✏️
            </button>

          </div>

        </div>


        <div class="info-field editable-field">

          <label for="botPrefix">
            PREFIX
          </label>

          <div class="editable-input">

            <input
              id="botPrefix"
              type="text"
              value="."
              maxlength="5"
              autocomplete="off"
            >

            <button
              type="button"
              class="edit-button"
              data-edit-target="botPrefix"
              aria-label="Edit prefix"
            >
              ✏️
            </button>

          </div>

        </div>


        <div class="info-field editable-field">

          <label for="botFooter">
            FOOTER
          </label>

          <div class="editable-input">

            <input
              id="botFooter"
              type="text"
              value="🦁 TECH BY TOPFEROS MD 🐑"
              autocomplete="off"
            >

            <button
              type="button"
              class="edit-button"
              data-edit-target="botFooter"
              aria-label="Edit footer"
            >
              ✏️
            </button>

          </div>

        </div>


        <div class="info-field">

          <label for="botMode">
            MODE
          </label>

          <select
            id="botMode"
          >

            <option value="public">
              PUBLIC
            </option>

            <option value="private">
              PRIVATE
            </option>

          </select>

        </div>

      </div>      <!-- ==========================================================
           ⚡ SYSTEM AUTOMATION
           ========================================================== -->

      <div class="settings-box">

        <h2>
          ──────── ⚡ SYSTEM AUTOMATION ────────
        </h2>


        <!-- ALWAYS ONLINE -->

        <div class="setting-row">

          <div>
            <strong>
              Always Online
            </strong>
          </div>

          <label class="switch">

            <input
              type="checkbox"
              data-setting="alwaysOnline"
            >

            <span class="slider"></span>

          </label>

        </div>


        <!-- FAKE TYPING -->

        <div class="setting-row">

          <div>
            <strong>
              Fake Typing
            </strong>
          </div>

          <label class="switch">

            <input
              type="checkbox"
              data-setting="fakeTyping"
            >

            <span class="slider"></span>

          </label>

        </div>


        <!-- FAKE RECORDING -->

        <div class="setting-row">

          <div>
            <strong>
              Fake Recording
            </strong>
          </div>

          <label class="switch">

            <input
              type="checkbox"
              data-setting="fakeRecording"
            >

            <span class="slider"></span>

          </label>

        </div>


        <!-- AI CHAT -->

        <div class="setting-row">

          <div>
            <strong>
              AI Chat
            </strong>
          </div>

          <label class="switch">

            <input
              type="checkbox"
              data-setting="aiChat"
            >

            <span class="slider"></span>

          </label>

        </div>


        <!-- AUTO REPLY -->

        <div class="setting-row">

          <div>
            <strong>
              Auto Reply
            </strong>
          </div>

          <label class="switch">

            <input
              type="checkbox"
              data-setting="autoReply"
            >

            <span class="slider"></span>

          </label>

        </div>


        <!-- AUTO STATUS SEEN -->

        <div class="setting-row">

          <div>
            <strong>
              Auto Status Seen
            </strong>
          </div>

          <label class="switch">

            <input
              type="checkbox"
              data-setting="autoStatusSeen"
            >

            <span class="slider"></span>

          </label>

        </div>


        <!-- AUTO STATUS LIKE -->

        <div class="setting-row">

          <div>
            <strong>
              Auto Status Like
            </strong>
          </div>

          <label class="switch">

            <input
              type="checkbox"
              data-setting="statusLike"
            >

            <span class="slider"></span>

          </label>

        </div>


        <!-- ======================================================
             🛡️ ANTI DELETE
             ====================================================== -->

        <div class="setting-row">

          <div>
            <strong>
              Anti Delete
            </strong>
          </div>

          <label class="switch">

            <input
              id="antiDelete"
              type="checkbox"
              data-setting="antiDelete"
            >

            <span class="slider"></span>

          </label>

        </div>


        <div
          id="antiDeleteOptions"
          class="settings-box"
        >

          <div class="info-field">

            <label for="antiDeleteMode">
              Anti-Delete Mode
            </label>

            <select
              id="antiDeleteMode"
            >

              <option value="all">
                ALL
              </option>

              <option value="media">
                MEDIA
              </option>

              <option value="text">
                TEXT
              </option>

            </select>

          </div>


          <div class="info-field">

            <label for="antiDeleteDestination">
              Send To
            </label>

            <select
              id="antiDeleteDestination"
            >

              <option value="owner">
                OWNER
              </option>

              <option value="sameChat">
                SAME CHAT
              </option>

            </select>

          </div>

        </div>


        <!-- ANTI SPAM -->

        <div class="setting-row">

          <div>
            <strong>
              Anti Spam
            </strong>
          </div>

          <label class="switch">

            <input
              type="checkbox"
              data-setting="antiSpam"
            >

            <span class="slider"></span>

          </label>

        </div>


        <!-- ======================================================
             📞 ANTI CALL
             ====================================================== -->

        <div class="settings-box">

          <div class="setting-row">

            <div>
              <strong>
                📞 ANTI-CALL
              </strong>
            </div>

            <label class="switch">

              <input
                type="checkbox"
                data-setting="antiCall"
              >

              <span class="slider"></span>

            </label>

          </div>


          <div class="info-field">

            <label for="antiCallMode">
              Anti-Call Mode
            </label>

            <select
              id="antiCallMode"
            >

              <option value="all">
                ALL
              </option>

              <option value="unknown">
                UNKNOWN
              </option>

              <option value="nonOwner">
                NON-OWNER
              </option>

            </select>

          </div>

        </div>

      </div>


      <!-- ==========================================================
           🛡️ SECURITY
           ========================================================== -->

      <div class="settings-box">

        <h2>
          ───────── SECURITY ─────────
        </h2>


        <!-- ANTI BUG -->

        <div class="setting-row">

          <div>
            <strong>
              🐞 ANTI-BUG
            </strong>
          </div>

          <label class="switch">

            <input
              type="checkbox"
              data-setting="antiBug"
            >

            <span class="slider"></span>

          </label>

        </div>


        <!-- ANTI BOT -->

        <div class="setting-row">

          <div>
            <strong>
              🤖 ANTI-BOT
            </strong>
          </div>

          <label class="switch">

            <input
              type="checkbox"
              data-setting="antiBot"
            >

            <span class="slider"></span>

          </label>

        </div>

      </div>


      <!-- ==========================================================
           🕦 AUTOMATION GROUP
           ========================================================== -->

      <div class="settings-box">

        <h2>
          ─────── 🕦 AUTOMATION GROUP ───────
        </h2>


        <!-- GROUP JID / NUMBER -->

        <div class="info-field">

          <label for="adminGroupNumber">
            GROUP JID / ADMIN NUMBER
          </label>

          <input
            id="adminGroupNumber"
            type="text"
            autocomplete="off"
            placeholder="Number or Group JID"
          >

        </div>


        <!-- GROUP LINK -->

        <div class="info-field">

          <label for="adminGroupLink">
            GROUP LINK
          </label>

          <input
            id="adminGroupLink"
            type="url"
            autocomplete="off"
            placeholder="https://chat.whatsapp.com/..."
          >

        </div>


        <!-- TIME ZONE -->

        <div class="info-field">

          <label for="groupTimeZone">
            TIME ZONE
          </label>

          <select
            id="groupTimeZone"
          >

            <option value="America/Port-au-Prince">
              Atlantique UTC-04:00
            </option>

            <option value="UTC">
              UTC +00:00
            </option>

            <option value="America/New_York">
              Eastern UTC-04:00 / UTC-05:00
            </option>

            <option value="America/Los_Angeles">
              Pacific UTC-07:00 / UTC-08:00
            </option>

          </select>

        </div>        <div class="automation-time-grid">

          <div class="info-field">

            <label for="groupCloseTime">
              CLOSE TIME
            </label>

            <input
              id="groupCloseTime"
              type="time"
              value="12:00"
            >

          </div>


          <div class="info-field">

            <label for="groupOpenTime">
              OPEN TIME
            </label>

            <input
              id="groupOpenTime"
              type="time"
              value="06:00"
            >

          </div>

        </div>


        <!-- GROUP CLOSE -->

        <div class="setting-row">

          <div>
            <strong>
              🔒 GROUP CLOSE
            </strong>
          </div>

          <label class="switch">

            <input
              id="groupClose"
              type="checkbox"
              data-setting="groupClose"
            >

            <span class="slider"></span>

          </label>

        </div>


        <!-- GROUP OPEN -->

        <div class="setting-row">

          <div>
            <strong>
              🔓 GROUP OPEN
            </strong>
          </div>

          <label class="switch">

            <input
              id="groupOpen"
              type="checkbox"
              data-setting="groupOpen"
            >

            <span class="slider"></span>

          </label>

        </div>


        <!-- GROUP BIO -->

        <div class="info-field">

          <label for="groupBioText">
            GROUP BIO
          </label>

          <textarea
            id="groupBioText"
            rows="6"
            autocomplete="off"
            placeholder="Bio or principles"
          ></textarea>

        </div>


        <!-- GROUP BIO / PRINCIPLES -->

        <div class="setting-row">

          <div>
            <strong>
              GROUP BIO / PRINCIPLES
            </strong>
          </div>

          <label class="switch">

            <input
              id="groupBioEnabled"
              type="checkbox"
              data-setting="groupBioEnabled"
            >

            <span class="slider"></span>

          </label>

        </div>

      </div>


      <!-- ==========================================================
           🏠 MAIN PUBLIC PANEL
           ========================================================== -->

      <button
        type="button"
        class="secondaryButton"
        onclick="window.location.href='/'"
      >
        🏠 MAIN PUBLIC PANEL
      </button>


      <!-- ==========================================================
           💾 SAVE SETTINGS
           ========================================================== -->

      <button
        id="saveSettings"
        class="next-button"
        type="button"
      >
        💾 SAVE SETTINGS
      </button>


      <div
        id="settingsMessage"
        class="message"
      ></div>


      <!-- ==========================================================
           FOOTER
           ========================================================== -->

      <div class="footer">
        🦁 TECH TOPFEROS MD 🐑
      </div>

    </section>

  </main>


  <!-- ============================================================
       ⚙️ SETTINGS JAVASCRIPT
       ============================================================ -->

  <script src="/settings.js"></script>

</body>

</html>