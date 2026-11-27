import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { logSuccess } from "../logger.mjs";
import { createHttpServer } from "../dev-server/http-server.mjs";

/**
 * @param {string} projectRoot
 * @param {import("../dev-server/config.js").RelementConfig} config
 */
export async function runPreview(projectRoot, config) {
  try {
    await access(resolve(projectRoot, "dist/index.html"));
  } catch {
    throw new Error('No production build found. Run "relement build" first.');
  }

  const serverConfig = {
    ...config,
    root: ".",
    html: "dist/index.html",
  };
  const { server } = createHttpServer(projectRoot, serverConfig, {
    hmr: false,
  });
  const port = 4173;

  /** @type {Promise<void>} */
  const listening = new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen({ port, host: "127.0.0.1" }, () => resolveListen(undefined));
  });

  await listening;
  logSuccess(`Preview at http://127.0.0.1:${port}${config.base ?? "/"}`);

  /** @type {Promise<void>} */
  const stopped = new Promise((resolveStop) => {
    const shutdown = () => {
      process.off("SIGINT", shutdown);
      process.off("SIGTERM", shutdown);
      server.close(() => resolveStop(undefined));
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  });

  await stopped;
}
