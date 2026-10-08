"use strict";

/*
|--------------------------------------------------------------------------
| TOPFEROS MD V2.0.0
| MEDIA DOWNLOADER
|--------------------------------------------------------------------------
|
| Downloads media from a direct, authorized URL.
|
| This service intentionally does not bypass DRM,
| authentication, paywalls, or platform restrictions.
|
|--------------------------------------------------------------------------
*/

const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const axios = require("axios");

const TEMP_DIR = path.join(
  os.tmpdir(),
  "topferos-md-media"
);

const MAX_REDIRECTS = 5;

/*
|--------------------------------------------------------------------------
| TEMP DIRECTORY
|--------------------------------------------------------------------------
*/

function ensureTempDir() {
  fs.mkdirSync(
    TEMP_DIR,
    {
      recursive: true
    }
  );

  return TEMP_DIR;
}

/*
|--------------------------------------------------------------------------
| CREATE TEMP FILE
|--------------------------------------------------------------------------
*/

function createTempFile(
  extension = "bin"
) {
  ensureTempDir();

  const id =
    crypto
      .randomBytes(12)
      .toString("hex");

  return path.join(
    TEMP_DIR,
    `${Date.now()}-${id}.${extension}`
  );
}

/*
|--------------------------------------------------------------------------
| CLEAN URL
|--------------------------------------------------------------------------
*/

function normalizeUrl(
  value
) {
  const url =
    String(value || "")
      .trim();

  if (
    !/^https?:\/\//i.test(url)
  ) {
    throw new Error(
      "A valid HTTP or HTTPS URL is required."
    );
  }

  return url;
}

/*
|--------------------------------------------------------------------------
| GET EXTENSION
|--------------------------------------------------------------------------
*/

function getExtension(
  url,
  contentType = ""
) {
  try {
    const parsed =
      new URL(url);

    const pathname =
      parsed.pathname || "";

    const extension =
      path
        .extname(pathname)
        .replace(".", "")
        .toLowerCase();

    if (
      extension &&
      extension.length <= 8
    ) {
      return extension;
    }
  } catch {
    /*
     * Fall back to content type.
     */
  }

  const type =
    String(contentType)
      .toLowerCase()
      .split(";")[0]
      .trim();

  const extensions = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/mp4": "m4a",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  };

  return (
    extensions[type] ||
    "bin"
  );
}

/*
|--------------------------------------------------------------------------
| DOWNLOAD MEDIA
|--------------------------------------------------------------------------
*/

async function downloadMedia(
  inputUrl,
  options = {}
) {
  const url =
    normalizeUrl(inputUrl);

  const response =
    await axios.get(
      url,
      {
        responseType:
          "stream",

        timeout:
          Number(
            options.timeout ||
              120000
          ),

        maxRedirects:
          Number(
            options.maxRedirects ||
              MAX_REDIRECTS
          ),

        maxContentLength:
          Infinity,

        maxBodyLength:
          Infinity,

        validateStatus:
          (status) =>
            status >= 200 &&
            status < 300,

        headers: {
          "User-Agent":
            "TOPFEROS-MD/2.0.0"
        }
      }
    );

  const contentType =
    String(
      response.headers[
        "content-type"
      ] || ""
    );

  const extension =
    options.extension ||
    getExtension(
      url,
      contentType
    );

  const output =
    options.output ||
    createTempFile(
      extension
    );

  await new Promise(
    (resolve, reject) => {
      const writer =
        fs.createWriteStream(
          output
        );

      let finished =
        false;

      const fail =
        (error) => {
          if (finished) {
            return;
          }

          finished = true;

          writer.destroy();

          try {
            if (
              fs.existsSync(
                output
              )
            ) {
              fs.unlinkSync(
                output
              );
            }
          } catch {
            /*
             * Ignore cleanup error.
             */
          }

          reject(error);
        };

      response.data.on(
        "error",
        fail
      );

      writer.on(
        "error",
        fail
      );

      writer.on(
        "finish",
        () => {
          if (finished) {
            return;
          }

          finished = true;
          resolve();
        }
      );

      response.data.pipe(
        writer
      );
    }
  );

  const stats =
    fs.statSync(output);

  return {
    success: true,

    url,

    path:
      output,

    size:
      stats.size,

    contentType,

    extension
  };
}

/*
|--------------------------------------------------------------------------
| CHECK MEDIA FILE
|--------------------------------------------------------------------------
*/

function isMediaFile(
  filePath
) {
  if (
    !filePath ||
    !fs.existsSync(filePath)
  ) {
    return false;
  }

  try {
    const stats =
      fs.statSync(filePath);

    return (
      stats.isFile() &&
      stats.size > 0
    );
  } catch {
    return false;
  }
}

/*
|--------------------------------------------------------------------------
| REMOVE FILE
|--------------------------------------------------------------------------
*/

function removeFile(
  filePath
) {
  if (!filePath) {
    return false;
  }

  try {
    if (
      fs.existsSync(filePath)
    ) {
      fs.unlinkSync(filePath);
    }

    return true;
  } catch (error) {
    console.warn(
      "[MEDIA DOWNLOADER] Cleanup failed:",
      error?.message ||
        error
    );

    return false;
  }
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  TEMP_DIR,
  ensureTempDir,
  createTempFile,
  normalizeUrl,
  getExtension,
  downloadMedia,
  isMediaFile,
  removeFile
};