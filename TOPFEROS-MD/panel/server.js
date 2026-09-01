// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 CHEMEN DOSYE YO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Dosye kote index.html ak lòt paj panel yo ye.
const publicDir = path.resolve(
  __dirname,
  "public"
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ TOPFEROS MD ASSETS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// server.js:
// TOPFEROS-MD/panel/server.js
//
// Nouvo logo:
// TOPFEROS-MD/assets/logo.png

const assetsDir = path.resolve(
  __dirname,
  "..",
  "assets"
);


const logoPath = path.resolve(
  assetsDir,
  "logo.png"
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧱 EXPRESS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.disable(
  "x-powered-by"
);


app.use(
  express.json({
    limit: "1mb"
  })
);


app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb"
  })
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📂 FICHYE PUBLIC
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// CSS, JS ak lòt fichye ki nan:
// TOPFEROS-MD/panel/public/

app.use(
  express.static(
    publicDir
  )
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ TOPFEROS MD ASSETS ROUTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// URL:
// /assets/logo.png
//
// Fichye fizik:
// TOPFEROS-MD/assets/logo.png

app.use(
  "/assets",
  express.static(
    assetsDir
  )
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖼️ LOGO TOPFEROS MD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Route final pou logo a:
//
// /assets/logo.png
//
// Li sèvi ak:
// TOPFEROS-MD/assets/logo.png

app.get(
  "/assets/logo.png",
  (req, res) => {

    return res.sendFile(
      logoPath,
      error => {

        if (error) {

          console.error(
            "❌ TOPFEROS MD LOGO ERROR:",
            error.message
          );

          console.error(
            "📁 Logo path:",
            logoPath
          );

          if (
            !res.headersSent
          ) {

            return res
              .status(404)
              .send(
                "TOPFEROS MD logo not found"
              );

          }

        }

      }
    );

  }
);