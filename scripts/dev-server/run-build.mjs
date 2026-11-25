import { spawn } from "node:child_process";

/**
 * @param {string} projectRoot
 * @returns {Promise<void>}
 */
export function runBuild(projectRoot) {
  return new Promise((resolve, reject) => {
    const command = process.platform === "win32" ? "npm.cmd" : "npm";

    const child = spawn(command, ["--silent", "run", "build"], {
      cwd: projectRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Build failed: ${signal ?? `npm exited with code ${code}`}.`,
          ),
        );
      }
    });
  });
}
