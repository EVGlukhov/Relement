import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param {unknown} value
 * @returns {value is import("./config.js").RelementConfig}
 */
function isRelementConfig(value) {
  return (
    isRecord(value) &&
    typeof value.root === "string" &&
    value.root.trim() !== "" &&
    typeof value.html === "string" &&
    value.html.trim() !== "" &&
    typeof value.entry === "string" &&
    value.entry.trim() !== "" &&
    typeof value.port === "number" &&
    Number.isInteger(value.port) &&
    value.port >= 1 &&
    value.port <= 65535
  );
}

/**
 * @param {unknown} value
 * @param {string} configPath
 * @returns {import("./config.js").RelementConfig}
 */
function validateConfig(value, configPath) {
  if (!isRelementConfig(value)) {
    throw new TypeError(`Invalid config "${configPath}".`);
  }

  return Object.freeze({
    root: value.root,
    html: value.html,
    entry: value.entry,
    port: value.port,
  });
}

/** @param {string} configPath */
export async function loadConfig(configPath) {
  const absoluteConfigPath = resolve(configPath);
  const configModule = await import(pathToFileURL(absoluteConfigPath).href);

  return validateConfig(configModule.default, absoluteConfigPath);
}
