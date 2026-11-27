import { styleText } from "node:util";

function timestamp() {
  return styleText("dim", new Date().toLocaleTimeString());
}

/** @param {string} message */
export function logInfo(message) {
  console.log(`${timestamp()} ${styleText("cyan", "●")} ${message}`);
}

/** @param {string} message */
export function logSuccess(message) {
  console.log(`${timestamp()} ${styleText("green", "✓")} ${message}`);
}

/**
 * @param {string} message
 * @param {unknown} [detail]
 */
export function logError(message, detail) {
  console.error(`${timestamp()} ${styleText("red", "✗")} ${message}`);

  if (detail !== undefined) {
    console.error(detail);
  }
}

/** @param {string} [label] */
export function logBanner(label = "dev") {
  console.log(`\n${styleText("bold", "Relement")} ${styleText("dim", label)}`);
}

/** @param {string} title @param {string[]} lines */
export function logSection(title, lines) {
  console.log(`\n${styleText("cyan", title)}`);
  for (const line of lines) {
    console.log(`  ${line}`);
  }
}
