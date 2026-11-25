import { resolve } from "node:path";
import { watch } from "node:fs";
import { performance } from "node:perf_hooks";
import { loadConfig } from "./load-config.mjs";
import { runBuild } from "./run-build.mjs";
import { createHttpServer } from "./http-server.mjs";
import { logBanner, logError, logInfo, logSuccess } from "./logger.mjs";

const projectRoot = process.cwd();
const config = await loadConfig(resolve(projectRoot, "relement.config.ts"));
const watchRoot = resolve(projectRoot, config.root);

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
        logError("Build failed", error);
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
  logError("File watcher failed", error);
  watcher.close();
  process.exitCode = 1;
});

logBanner();
logInfo(`Starting build in ${watchRoot}`);

const server = createHttpServer(projectRoot, config);

server.on("error", (error) => {
  logError("HTTP server failed", error);
  watcher.close();
  process.exitCode = 1;
});

await rebuild();

server.listen(config.port, "127.0.0.1", () => {
  logSuccess(`Ready at http://127.0.0.1:${config.port}`);
  logInfo(`Watching ${watchRoot}`);
});
