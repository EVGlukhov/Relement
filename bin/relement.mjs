#!/usr/bin/env node
import { runCli } from "../scripts/cli/index.mjs";
import { logError } from "../scripts/logger.mjs";

try {
  await runCli(process.argv.slice(2));
} catch (error) {
  logError("Command failed", error);
  process.exitCode = 1;
}
