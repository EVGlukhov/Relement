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
        notifyReload();
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

const { server, notifyReload } = createHttpServer(projectRoot, config);

/** @param {NodeJS.ErrnoException} error */
function handleServerError(error) {
  logError("HTTP server failed", error);
  watcher.close();
  process.exitCode = 1;
}
/** @param {number} port */
function listenOnAvailablePort(port) {
  const onListening = () => {
    server.off("error", onError);
    server.on("error", handleServerError);

    logSuccess(`Ready at http://127.0.0.1:${port}`);
    logInfo(`Watching ${watchRoot}`);
  };

  /** @param {NodeJS.ErrnoException} error */
  const onError = (error) => {
    server.off("listening", onListening);

    if (error.code === "EADDRINUSE" && port < 65535) {
      const nextPort = port + 1;
      logInfo(`Port ${port} is in use; trying ${nextPort}`);
      listenOnAvailablePort(nextPort);
      return;
    }

    handleServerError(error);
  };

  server.once("error", onError);
  server.once("listening", onListening);
  server.listen(port, "127.0.0.1");
}

await rebuild();

listenOnAvailablePort(config.port);
