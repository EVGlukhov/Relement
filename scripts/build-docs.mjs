import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const distRoot = join(projectRoot, "dist");
const siteRoot = join(distRoot, "site");

await rm(siteRoot, { recursive: true, force: true });
await mkdir(siteRoot, { recursive: true });

await copyFile(
  join(projectRoot, "docs/app/index.html"),
  join(siteRoot, "index.html"),
);
await cp(join(distRoot, "docs/app"), join(siteRoot, "docs/app"), {
  recursive: true,
});
await cp(join(distRoot, "src"), join(siteRoot, "src"), {
  recursive: true,
});
