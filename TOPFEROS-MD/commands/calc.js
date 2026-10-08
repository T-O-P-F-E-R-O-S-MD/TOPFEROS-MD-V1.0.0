"use strict";

// ╔════════════════════════════════════════════════════╗
// ║              🦁 TOPFEROS MD V2.0.0               ║
// ║                  CALCULATOR COMMAND              ║
// ╚════════════════════════════════════════════════════╝

const {
  registerCommand
} = require("../src/messageHandler");

function calculate(expression) {
  const cleaned =
    String(expression)
      .replace(/\s+/g, "")
      .trim();

  if (!cleaned) {
    throw new Error(
      "Empty expression."
    );
  }

  // Allow only basic mathematical characters.
  if (
    !/^[0-9+\-*/().%]+$/.test(
      cleaned
    )
  ) {
    throw new Error(
      "Invalid characters."
    );
  }

  // Prevent unsafe or malformed operators.
  if (
    /(?:\*\*|\/\/)/.test(
      cleaned
    )
  ) {
    throw new Error(
      "Unsupported operator."
    );
  }

  const result =
    Function(
      `"use strict"; return (${cleaned});`
    )();

  if (
    typeof result !== "number" ||
    !Number.isFinite(result)
  ) {
    throw new Error(
      "Invalid calculation."
    );
  }

  return result;
}

async function calcCommand(ctx) {
  const expression =
    String(ctx.text || "").trim();

  if (!expression) {
    await ctx.send(
      [
        "❌ EXPRESSION REQUIRED",
        "",
        "Use:",
        `${ctx.prefix}calc <calculation>`,
        "",
        "Examples:",
        `${ctx.prefix}calc 25 + 75`,
        `${ctx.prefix}calc 10 * 5 / 2`,
        `${ctx.prefix}calc (20 + 10) * 2`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      reason:
        "No expression provided."
    };
  }

  try {
    const result =
      calculate(
        expression
      );

    await ctx.send(
      [
        "🧮 CALCULATOR",
        "",
        `Expression: ${expression}`,
        `Result: ${result}`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: true,
      expression,
      result
    };
  } catch (error) {
    console.error(
      "[CALC] Error:",
      error?.stack ||
        error
    );

    await ctx.send(
      [
        "❌ CALCULATION FAILED",
        "",
        "Please use a valid mathematical expression.",
        "",
        "Example:",
        `${ctx.prefix}calc (20 + 10) * 2`,
        "",
        "🦁 TECH BY TOPFEROS MD 🐑"
      ].join("\n")
    );

    return {
      success: false,
      error:
        error?.message ||
        String(error)
    };
  }
}

registerCommand(
  "calc",
  calcCommand,
  {
    aliases: [
      "calculate",
      "math"
    ],
    description:
      "Calculate a basic mathematical expression.",
    usage:
      ".calc <calculation>",
    category:
      "UTILITY"
  }
);

module.exports = {
  calcCommand
};