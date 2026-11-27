import { resolve } from "node:path";
import { logSuccess } from "../logger.mjs";
import { loadConfig } from "../dev-server/load-config.mjs";
import { runBuild } from "./build.mjs";
import { runDev } from "./dev.mjs";
import { createProject } from "./create.mjs";
import { runPreview } from "./preview.mjs";
import { printHelp } from "./help.mjs";

/** @param {string} projectRoot */
async function loadProjectConfig(projectRoot) {
  return loadConfig(resolve(projectRoot, "relement.config.js"));
}

async function loadCurrentProject() {
  const projectRoot = process.cwd();
  const config = await loadProjectConfig(projectRoot);
  return { projectRoot, config };
}

/** @param {string[]} commandArgs */
export async function runCli(commandArgs) {
  const [command, ...args] = commandArgs;

  switch (command) {
    case undefined:
    case "--help":
    case "-h":
      printHelp();
      return;

    case "create":
      if (args.length !== 1) {
        throw new Error("Usage: relement create <project-name>");
      }
      await createProject(args[0]);
      return;

    case "dev": {
      if (args.length > 0) {
        throw new Error("Usage: relement dev");
      }
      const { projectRoot, config } = await loadCurrentProject();
      await runDev(projectRoot, config);
      return;
    }

    case "build": {
      if (args.length > 0) {
        throw new Error("Usage: relement build");
      }
      const { projectRoot, config } = await loadCurrentProject();
      await runBuild(projectRoot, config);
      logSuccess("Production build complete in dist/.");
      return;
    }

    case "preview": {
      if (args.length > 0) {
        throw new Error("Usage: relement preview");
      }
      const { projectRoot, config } = await loadCurrentProject();
      await runPreview(projectRoot, config);
      return;
    }

    default:
      throw new Error(`Unknown command: ${command}`);
  }
}
