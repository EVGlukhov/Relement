import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { logError } from "./logger.mjs";

/** @param {unknown} error */
function isMissingFile(error) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "ENOENT" || error.code === "EISDIR")
  );
}

/**
 * @param {import("node:http").IncomingMessage} request
 * @param {import("node:http").ServerResponse} response
 * @param {string} htmlPath
 * @param {string} outputRoot
 * @param {Set<import("node:http").ServerResponse>} clients
 * @returns {Promise<void>}
 */
async function handleRequest(request, response, htmlPath, outputRoot, clients) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }

  let pathname;

  try {
    pathname = decodeURIComponent(
      new URL(request.url ?? "/", "http://localhost").pathname,
    );
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  if (pathname === "/__relement/events") {
    if (request.method !== "GET") {
      response.writeHead(405, { Allow: "GET" }).end("Method not allowed");
      return;
    }

    response.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    response.write(": connected\n\n");

    clients.add(response);
    response.on("close", () => clients.delete(response));
    return;
  }

  let filePath = htmlPath;

  if (pathname !== "/") {
    filePath = resolve(outputRoot, `.${pathname}`);

    if (
      filePath !== outputRoot &&
      !filePath.startsWith(`${outputRoot}${sep}`)
    ) {
      response.writeHead(403).end("Forbidden");
      return;
    }
  }

  let content;

  try {
    content = await readFile(filePath);
  } catch (error) {
    if (isMissingFile(error)) {
      response.writeHead(404).end("Not found");
      return;
    }

    throw error;
  }

  if (pathname === "/") {
    const html = content.toString("utf8");
    const liveReloadScript = `
      <script type="module">
        const events = new EventSource("/__relement/events");
        events.addEventListener("reload", () => window.location.reload());
      </script>
    `;

    content = Buffer.from(
      html.replace("</body>", `${liveReloadScript}</body>`),
    );
  }

  const contentTypes = new Map([
    [".html", "text/html; charset=utf-8"],
    [".js", "text/javascript; charset=utf-8"],
    [".css", "text/css; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".svg", "image/svg+xml"],
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".ico", "image/x-icon"],
  ]);

  response.writeHead(200, {
    "Content-Type":
      contentTypes.get(extname(filePath)) ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  response.end(request.method === "HEAD" ? undefined : content);
}

/**
 * @param {string} projectRoot
 * @param {import("./config.js").RelementConfig} config
 */
export function createHttpServer(projectRoot, config) {
  const htmlPath = resolve(projectRoot, config.root, config.html);
  const outputRoot = resolve(projectRoot, "dist");

  /** @type {Set<import("node:http").ServerResponse>} */
  const clients = new Set();

  const server = createServer((request, response) => {
    void handleRequest(request, response, htmlPath, outputRoot, clients).catch(
      (error) => {
        logError("HTTP request failed", error);

        if (!response.headersSent) {
          response.writeHead(500, {
            "Content-Type": "text/plain; charset=utf-8",
          });
        }

        response.end("Internal server error");
      },
    );
  });

  function notifyReload() {
    for (const client of clients) {
      client.write("event: reload\ndata: reload\n\n");
    }
  }

  return { server, notifyReload };
}
