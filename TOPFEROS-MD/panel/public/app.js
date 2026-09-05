"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🤖 TOPFEROS MD V1.0.0               ║
// ║             🌐 PANEL APPLICATION JS              ║
// ║              🚀 TOPFEROS TECH                    ║
// ╚════════════════════════════════════════════════════╝


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔗 URL PARAMETERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const params = new URLSearchParams(
    window.location.search
);

let sessionId =
    params.get("session") || "";

const urlLanguage =
    params.get("language") || "";

const LANGUAGE_KEY =
    "topferos_language";


const SUPPORTED_LANGUAGES = [
    "en",
    "fr",
    "es"
];


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🌍 TRANSLATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const translations = {

    en: {

        languageTitle:
            "Main Language",

        languageSubtitle:
            "Choose your preferred language",

        panelCodeTitle:
            "Panel Code",

        panelCodeSubtitle:
            "Enter your WhatsApp number and Panel Code",

        number:
            "Number User",

        numberPlaceholder:
            "509XXXXXXXX",

        panelCode:
            "Panel Code",

        panelCodePlaceholder:
            "Enter Panel Code",

        login:
            "LOGIN",

        parrainTitle:
            "Parrain Code",

        parrainSubtitle:
            "Generate your Parrain Code",

        parrainNumber:
            "Parrain number",

        generate:
            "GENERATE PARRAIN CODE",

        generating:
            "GENERATING...",

        code:
            "PARRAIN CODE",

        copy:
            "📋 COPY",

        copied:
            "✅ COPIED",

        next:
            "NEXT →",

        connecting:
            "CONNECTING...",

        numberMissing:
            "❌ Enter the WhatsApp number.",

        invalidNumber:
            "❌ Enter a valid WhatsApp number.",

        panelCodeMissing:
            "❌ Enter the Panel Code.",

        loginFailed:
            "❌ Invalid Panel Code or login failed.",

        generateFailed:
            "❌ Unable to generate Parrain Code.",

        serverError:
            "❌ Unable to contact the panel server.",

        parrainMissing:
            "❌ Generate the Parrain Code first.",

        copyFailed:
            "❌ Unable to copy the code.",

        success:
            "✅ Parrain Code generated successfully.",

        made:
            "Made in TOPFEROS TECH"

    },


    fr: {

        languageTitle:
            "Langue principale",

        languageSubtitle:
            "Choisissez votre langue préférée",

        panelCodeTitle:
            "Code Panel",

        panelCodeSubtitle:
            "Entrez votre numéro WhatsApp et le Code Panel",

        number:
            "Numéro User",

        numberPlaceholder:
            "509XXXXXXXX",

        panelCode:
            "Code Panel",

        panelCodePlaceholder:
            "Entrez le Code Panel",

        login:
            "CONNEXION",

        parrainTitle:
            "Code Parrain",

        parrainSubtitle:
            "Générez votre Code Parrain",

        parrainNumber:
            "Numéro Parrain",

        generate:
            "GÉNÉRER LE CODE PARRAIN",

        generating:
            "GÉNÉRATION...",

        code:
            "CODE PARRAIN",

        copy:
            "📋 COPIER",

        copied:
            "✅ COPIÉ",

        next:
            "SUIVANT →",

        connecting:
            "CONNEXION...",

        numberMissing:
            "❌ Entrez le numéro WhatsApp.",

        invalidNumber:
            "❌ Entrez un numéro WhatsApp valide.",

        panelCodeMissing:
            "❌ Entrez le Code Panel.",

        loginFailed:
            "❌ Code Panel invalide ou échec de connexion.",

        generateFailed:
            "❌ Impossible de générer le Code Parrain.",

        serverError:
            "❌ Impossible de contacter le serveur du panneau.",

        parrainMissing:
            "❌ Générez d'abord le Code Parrain.",

        copyFailed:
            "❌ Impossible de copier le code.",

        success:
            "✅ Code Parrain généré avec succès.",

        made:
            "Made in TOPFEROS TECH"

    },


    es: {

        languageTitle:
            "Idioma principal",

        languageSubtitle:
            "Elige tu idioma preferido",

        panelCodeTitle:
            "Código del Panel",

        panelCodeSubtitle:
            "Introduce tu número de WhatsApp y el Código del Panel",

        number:
            "Número User",

        numberPlaceholder:
            "509XXXXXXXX",

        panelCode:
            "Código del Panel",

        panelCodePlaceholder:
            "Introduce el Código del Panel",

        login:
            "INICIAR SESIÓN",

        parrainTitle:
            "Código Parrain",

        parrainSubtitle:
            "Genera tu Código Parrain",

        parrainNumber:
            "Número Parrain",

        generate:
            "GENERAR CÓDIGO PARRAIN",

        generating:
            "GENERANDO...",

        code:
            "CÓDIGO PARRAIN",

        copy:
            "📋 COPIAR",

        copied:
            "✅ COPIADO",

        next:
            "SIGUIENTE →",

        connecting:
            "CONECTANDO...",

        numberMissing:
            "❌ Introduce el número de WhatsApp.",

        invalidNumber:
            "❌ Introduce un número de WhatsApp válido.",

        panelCodeMissing:
            "❌ Introduce el Código del Panel.",

        loginFailed:
            "❌ Código del Panel inválido o error de conexión.",

        generateFailed:
            "❌ No se pudo generar el Código Parrain.",

        serverError:
            "❌ No se puede contactar con el servidor del panel.",

        parrainMissing:
            "❌ Genera primero el Código Parrain.",

        copyFailed:
            "❌ No se pudo copiar el código.",

        success:
            "✅ Código Parrain generado correctamente.",

        made:
            "Made in TOPFEROS TECH"

    }

};


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🌍 GET LANGUAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

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


    if (
        SUPPORTED_LANGUAGES.includes(
            urlLanguage
        )
    ) {
        return urlLanguage;
    }


    return "en";
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   💾 SAVE LANGUAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function saveLanguage(language) {

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


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🌐 APPLY LANGUAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

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


    /* LANGUAGE */

    const languageTitle =
        document.querySelector(
            "#languageScreen h2"
        );

    if (languageTitle) {

        languageTitle.textContent =
            t.languageTitle;
    }


    const languageSubtitle =
        document.querySelector(
            "#languageScreen .subtitle"
        );

    if (languageSubtitle) {

        languageSubtitle.textContent =
            t.languageSubtitle;
    }


    /* PANEL CODE */

    const panelCodeTitle =
        document.getElementById(
            "panelCodeTitle"
        );

    if (panelCodeTitle) {

        panelCodeTitle.textContent =
            t.panelCodeTitle;
    }


    const panelCodeSubtitle =
        document.getElementById(
            "panelCodeSubtitle"
        );

    if (panelCodeSubtitle) {

        panelCodeSubtitle.textContent =
            t.panelCodeSubtitle;
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


    const panelCodeLabel =
        document.getElementById(
            "panelCodeLabel"
        );

    if (panelCodeLabel) {

        panelCodeLabel.textContent =
            t.panelCode;
    }


    const panelCodeInput =
        document.getElementById(
            "panelCode"
        );

    if (panelCodeInput) {

        panelCodeInput.placeholder =
            t.panelCodePlaceholder;
    }


    const panelLoginButton =
        document.getElementById(
            "panelLoginButton"
        );

    if (
        panelLoginButton &&
        !panelLoginButton.disabled
    ) {

        panelLoginButton.textContent =
            t.login;
    }


    /* PARRAIN */

    const parrainTitle =
        document.getElementById(
            "parrainTitle"
        );

    if (parrainTitle) {

        parrainTitle.textContent =
            t.parrainTitle;
    }


    const parrainSubtitle =
        document.getElementById(
            "parrainSubtitle"
        );

    if (parrainSubtitle) {

        parrainSubtitle.textContent =
            t.parrainSubtitle;
    }


    const parrainNumberLabel =
        document.getElementById(
            "parrainNumberLabel"
        );

    if (parrainNumberLabel) {

        parrainNumberLabel.textContent =
            t.parrainNumber;
    }


    const generateParrainButton =
        document.getElementById(
            "generateParrainButton"
        );

    if (
        generateParrainButton &&
        !generateParrainButton.disabled
    ) {

        generateParrainButton.textContent =
            t.generate;
    }


    const parrainCodeLabel =
        document.getElementById(
            "parrainCodeLabel"
        );

    if (parrainCodeLabel) {

        parrainCodeLabel.textContent =
            t.code;
    }


    const copyParrainButton =
        document.getElementById(
            "copyParrainButton"
        );

    if (
        copyParrainButton &&
        !copyParrainButton.disabled
    ) {

        copyParrainButton.textContent =
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


    /* FOOTER */

    document
        .querySelectorAll(
            ".panel-footer"
        )
        .forEach(
            footer => {

                footer.innerHTML =
                    `<span>By</span> <strong>${t.made.replace(
                        "Made in ",
                        ""
                    )}</strong>`;

            }
        );
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🌍 LANGUAGE SELECTOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function setupLanguageSelector() {

    const buttons =
        document.querySelectorAll(
            "[data-language]"
        );


    buttons.forEach(
        button => {

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


                    saveLanguage(
                        language
                    );


                    applyLanguage(
                        language
                    );


                    showScreen(
                        "panelCodeScreen"
                    );


                    const url =
                        new URL(
                            window.location.href
                        );


                    url.searchParams.set(
                        "language",
                        language
                    );


                    if (sessionId) {

                        url.searchParams.set(
                            "session",
                            sessionId
                        );
                    }


                    window.history.replaceState(
                        {},
                        "",
                        url.toString()
                    );

                }
            );

        }
    );
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📺 SHOW SCREEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function showScreen(
    screenId
) {

    const screens =
        document.querySelectorAll(
            ".screen"
        );


    screens.forEach(
        screen => {

            screen.classList.remove(
                "active"
            );

            screen.style.display =
                "none";
        }
    );


    const screen =
        document.getElementById(
            screenId
        );


    if (!screen) {
        return;
    }


    screen.classList.add(
        "active"
    );

    screen.style.display =
        "block";
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📢 SHOW MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function showPanelMessage(
    text
) {

    const message =
        document.getElementById(
            "panelMessage"
        );


    if (message) {

        message.textContent =
            text || "";
    }
}


function showParrainMessage(
    text
) {

    const message =
        document.getElementById(
            "parrainMessage"
        );


    if (message) {

        message.textContent =
            text || "";
    }
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔢 CLEAN NUMBER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function cleanNumber(
    number
) {

    return String(
        number || ""
    ).replace(
        /\D/g,
        ""
    );
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔍 VALIDATE NUMBER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function isValidNumber(
    number
) {

    return (
        number.length >= 8 &&
        number.length <= 15
    );
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔐 PANEL CODE LOGIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

async function loginWithPanelCode(
    event
) {

    if (event) {

        event.preventDefault();
    }


    const language =
        getLanguage();

    const t =
        translations[language];


    const numberInput =
        document.getElementById(
            "number"
        );


    const panelCodeInput =
        document.getElementById(
            "panelCode"
        );


    const loginButton =
        document.getElementById(
            "panelLoginButton"
        );


    showPanelMessage("");


    const number =
        cleanNumber(
            numberInput?.value
        );


    const panelCode =
        String(
            panelCodeInput?.value ||
            ""
        )
        .trim()
        .toUpperCase();


    if (!number) {

        showPanelMessage(
            t.numberMissing
        );

        numberInput?.focus();

        return;
    }


    if (
        !isValidNumber(
            number
        )
    ) {

        showPanelMessage(
            t.invalidNumber
        );

        numberInput?.focus();

        return;
    }


    if (!panelCode) {

        showPanelMessage(
            t.panelCodeMissing
        );

        panelCodeInput?.focus();

        return;
    }


    if (loginButton) {

        loginButton.disabled =
            true;

        loginButton.textContent =
            t.connecting;
    }


    try {

        const response =
            await fetch(
                "/api/login",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            sessionId,

                            number,

                            code:
                                panelCode

                        })
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            result.success !== true
        ) {

            showPanelMessage(
                result.message ||
                t.loginFailed
            );

            return;
        }


        /*
         * Backend ka ka retounen
         * yon nouvo sessionId.
         */

        if (
            result.sessionId
        ) {

            sessionId =
                result.sessionId;


            const url =
                new URL(
                    window.location.href
                );


            url.searchParams.set(
                "session",
                sessionId
            );


            url.searchParams.set(
                "language",
                language
            );


            window.history.replaceState(
                {},
                "",
                url.toString()
            );
        }


        /*
         * Apre Panel Code la valide,
         * nou ale dirèkteman sou
         * Parrain Code.
         */

        const parrainNumber =
            document.getElementById(
                "parrainNumber"
            );


        if (parrainNumber) {

            parrainNumber.textContent =
                number;
        }


        showPanelMessage("");


        showScreen(
            "parrainCodeScreen"
        );


    } catch (error) {

        console.error(
            "❌ PANEL LOGIN ERROR:",
            error
        );


        showPanelMessage(
            t.serverError
        );

    } finally {

        if (loginButton) {

            loginButton.disabled =
                false;

            loginButton.textContent =
                t.login;
        }
    }
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔑 GENERATE PARRAIN CODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

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
            "generateParrainButton"
        );


    const codeSection =
        document.getElementById(
            "parrainCodeSection"
        );


    const parrainCode =
        document.getElementById(
            "parrainCode"
        );


    const number =
        cleanNumber(
            numberInput?.value
        );


    showParrainMessage("");


    if (!number) {

        showParrainMessage(
            t.numberMissing
        );

        showScreen(
            "panelCodeScreen"
        );

        return;
    }


    if (
        !isValidNumber(
            number
        )
    ) {

        showParrainMessage(
            t.invalidNumber
        );

        return;
    }


    if (!sessionId) {

        showParrainMessage(
            t.serverError
        );

        return;
    }


    if (generateButton) {

        generateButton.disabled =
            true;

        generateButton.textConte