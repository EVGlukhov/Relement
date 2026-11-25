import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { styleText } from "node:util";
import { loadConfig } from "./load-config.mjs";
import { runBuild } from "./run-build.mjs";
import { watch } from "node:fs";

const projectRoot = process.cwd();
const config = await loadConfig(resolve(projectRoot, "relement.config.ts"));
const watchRoot = resolve(projectRoot, config.root);

function timestamp() {
  return styleText("dim", new Date().toLocaleTimeString());
}

/** @param {string} message */
function logInfo(message) {
  console.log(`${timestamp()} ${styleText("cyan", "●")} ${message}`);
}

/** @param {string} message */
function logSuccess(message) {
  console.log(`${timestamp()} ${styleText("green", "✓")} ${message}`);
}

/** @param {string} message */
function logError(message) {
  console.error(`${timestamp()} ${styleText("red", "✗")} ${message}`);
}

let building = false;
let buildQueued = false;

/** @type {NodeJS.Timeout | undefined} */
let debounceTimer;

async function rebuild() {
  if (building) {
    buildQueued = true;
    return;
  }

  building = true;

  try {
    do {
      buildQueued = false;

      try {
        const startedAt = performance.now();
        await runBuild(projectRoot);
        logSuccess(
          `Build complete in ${Math.round(performance.now() - startedAt)} ms`,
        );
      } catch (error) {
        logError("Build failed");
        console.error(error);
      }
    } while (buildQueued);
  } finally {
    building = false;
  }
}

const ignoreDirectories = new Set([".git", "dist", "node_modules"]);

const watcher = watch(watchRoot, { recursive: true }, (_event, filename) => {
  if (filename === null) return;

  const changedPath = String(filename);

  if (changedPath.split(/[\\/]/).some((part) => ignoreDirectories.has(part))) {
    return;
  }

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    logInfo(`Changed: ${changedPath}`);
    void rebuild();
  }, 120);
});

watcher.on("error", (error) => {
  logError("File watcher failed");
  console.error(error);
  watcher.close();
  process.exitCode = 1;
});

console.log(`\n${styleText("bold", "Relement")} ${styleText("dim", "dev")}`);
logInfo(`Starting build in ${watchRoot}`);
await rebuild();
logInfo(`Watching ${watchRoot}`);
