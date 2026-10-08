"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                    VV2 COMMAND                  ║
// ╚════════════════════════════════════════════════════╝

const {
  vv2Command
} = require("../services/viewOnce");

/*
|--------------------------------------------------------------------------
| COMMAND INITIALIZER
|--------------------------------------------------------------------------
*/

function init({
  logger
}) {
  const {
    registerCommand
  } =
    require("../src/messageHandler");

  registerCommand(
    "vv2",
    vv2Command,
    {
      aliases: [],

      description:
        "Decode a replied ViewOnce in the same chat.",

      usage:
        ".vv2",

      category:
        "MEDIA"
    }
  );

  if (logger) {
    logger.info(
      "👁️ VV2 command registered: .vv2"
    );
  }
}

module.exports = {
  init
};