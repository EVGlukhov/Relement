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
 * @returns {Promise<void>}
 */
async function handleRequest(request, response, htmlPath, outputRoot) {
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

  return createServer((request, response) => {
    void handleRequest(request, response, htmlPath, outputRoot).catch(
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
}
