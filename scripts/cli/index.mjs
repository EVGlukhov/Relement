import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { logInfo, logSuccess } from "../logger.mjs";

const templateDirectory = fileURLToPath(
  new URL("../../templates/relement/", import.meta.url),
);

/** @param {string[]} args */
export async function runCli(args) {
  const [command, projectName] = args;

  if (command === "--help" || command === "-h" || command === undefined) {
    logInfo("Usage: relement create <project-name>");
    return;
  }

  if (command !== "create") {
    throw new Error(`Unknown command: ${command}`);
  }

  if (!projectName || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(projectName)) {
    throw new Error(
      "Provide a project name using lowercase letters, numbers and hyphens.",
    );
  }

  const destination = resolve(process.cwd(), projectName);
  await mkdir(destination);
  await cp(templateDirectory, destination, { recursive: true });

  const packagePath = resolve(destination, "package.json");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  packageJson.name = projectName;

  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  logSuccess(`Created project "${projectName}".`);
}
