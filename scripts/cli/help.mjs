import { logBanner, logSection } from "../logger.mjs";

export function printHelp() {
  logBanner("CLI");
  logSection("Usage", ["relement <command>"]);
  logSection("Commands", [
    "create <project-name>  Create a new project",
    "dev                    Start the dev server",
    "build                  Build for production",
    "preview                Preview the production build",
  ]);
  logSection("Examples", [
    "relement create my-app",
    "cd my-app",
    "npm install",
    "npm run dev",
  ]);
  logSection("Options", ["-h, --help  Show this help"]);
}
