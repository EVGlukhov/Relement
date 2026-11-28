import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "dotenv";

/**
 * @param {string} projectRoot
 * @param {"development" | "production"} mode
 * @param {string} baseUrl
 */
export async function loadClientEnv(projectRoot, mode, baseUrl) {
  const values = {};
  const files = [".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`];

  for (const file of files) {
    let source;

    try {
      source = await readFile(resolve(projectRoot, file), "utf8");
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        continue;
      }

      throw error;
    }

    Object.assign(values, parse(source));
  }

  const merged = { ...values, ...process.env };
  const exposed = Object.fromEntries(
    Object.entries(merged).filter(
      ([key, value]) => key.startsWith("RELEMENT_") && value !== undefined,
    ),
  );

  return {
    ...exposed,
    MODE: mode,
    DEV: mode === "development",
    PROD: mode === "production",
    BASE_URL: baseUrl,
  };
}
