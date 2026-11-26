import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./dev-server/load-config.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const config = await loadConfig(join(projectRoot, "relement.config.ts"));
const distRoot = join(projectRoot, "dist");
const siteRoot = join(distRoot, "site");

await rm(siteRoot, { recursive: true, force: true });
await mkdir(siteRoot, { recursive: true });

const sourceHtml = await readFile(
  join(projectRoot, "docs/app/index.html"),
  "utf8",
);
const htmlWithBase = sourceHtml.replace(
  "<head>",
  `<head>\n    <base href="${config.base}" />`,
);

if (htmlWithBase === sourceHtml) {
  throw new Error("Could not add base URL: <head> was not found in docs HTML.");
}

await writeFile(join(siteRoot, "index.html"), htmlWithBase);

await cp(join(distRoot, "docs/app"), join(siteRoot, "docs/app"), {
  recursive: true,
});
await cp(join(distRoot, "src"), join(siteRoot, "src"), {
  recursive: true,
});
