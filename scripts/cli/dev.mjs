import { watch } from "node:fs";
import { resolve } from "node:path";
import { logError, logSuccess } from "../logger.mjs";
import { createHttpServer } from "../dev-server/http-server.mjs";
import { runBuild } from "./build.mjs";

/**
 * @param {string} projectRoot
 * @param {import("../dev-server/config.js").RelementConfig} config
 */
export async function runDev(projectRoot, config) {
  await runBuild(projectRoot, config);

  const serverConfig = {
    ...config,
    root: ".",
    html: "dist/index.html",
  };
  const { server, notifyReload } = createHttpServer(projectRoot, serverConfig);

  /** @type {Promise<void>} */
  const listening = new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen({ port: config.port, host: "127.0.0.1" }, resolveListen);
  });

  await listening;

  const watchRoot = resolve(projectRoot, config.root);
  const watcher = watch(watchRoot, { recursive: true }, (_event, filename) => {
    if (filename === null) return;

    const changedPath = String(filename);
    if (
      changedPath
        .split(/[\\/]/)
        .some((part) => [".git", "dist", "node_modules"].includes(part))
    ) {
      return;
    }

    clearTimeout(timer);
    timer = setTimeout(() => {
      void runBuild(projectRoot, config)
        .then(() => {
          notifyReload();
          logSuccess(`Rebuilt after change: ${changedPath}`);
        })
        .catch((error) => logError("Build failed", error));
    }, 120);
  });

  /** @type {NodeJS.Timeout | undefined} */
  let timer;

  logSuccess(`Ready at http://127.0.0.1:${config.port}`);

  /** @type {Promise<void>} */
  const stopped = new Promise((resolveStop) => {
    const shutdown = () => {
      watcher.close();
      clearTimeout(timer);
      process.off("SIGINT", shutdown);
      process.off("SIGTERM", shutdown);
      server.close(() => resolveStop());
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  });

  await stopped;
}
