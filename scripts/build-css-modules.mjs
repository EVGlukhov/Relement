import {
  readdir,
  readFile,
  mkdir,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import postcssModules from "postcss-modules";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const distRoot = join(projectRoot, "dist");
const generatedCSSModules = new Set();

/**
 * @param {string} directory
 * @returns {Promise<string[]>}
 */
async function getFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await getFiles(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

const sourceFiles = [];

for (const directory of ["src", "examples", "test", "docs/app"]) {
  sourceFiles.push(...(await getFiles(join(projectRoot, directory))));
}

for (const sourcePath of sourceFiles.filter((path) =>
  path.endsWith(".module.css"),
)) {
  let classes = {};
  const source = await readFile(sourcePath, "utf8");

  const result = await postcss([
    postcssModules({
      generateScopedName: "[name]__[local]__[hash:base64:5]",
      getJSON(_cssPath, json) {
        classes = json;
      },
    }),
  ]).process(source, { from: sourcePath });

  const outputPath = join(distRoot, `${relative(projectRoot, sourcePath)}.js`);

  const runtimePath = relative(
    dirname(outputPath),
    join(distRoot, "src/css-modules.js"),
  )
    .split(sep)
    .join("/");

  const runtimeImport = runtimePath.startsWith(".")
    ? runtimePath
    : `./${runtimePath}`;

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `import { registerCSSModule } from ${JSON.stringify(runtimeImport)};\n` +
      `export default registerCSSModule(${JSON.stringify(classes)}, ` +
      `${JSON.stringify(result.css)});\n`,
  );
  generatedCSSModules.add(outputPath);
}

/**
 * @param {string} directory
 * @returns {Promise<void>}
 */
async function rewriteImports(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      await rewriteImports(path);
    } else if (entry.isFile() && path.endsWith(".js")) {
      const source = await readFile(path, "utf8");
      const updated = source.replace(
        /(\bfrom\s+|\bimport\s*)(["'])([^"']+\.module\.css)(["'])/g,
        (match, keyword, openingQuote, modulePath, closingQuote) =>
          generatedCSSModules.has(
            resolve(dirname(path), `${modulePath}.js`),
          )
            ? `${keyword}${openingQuote}${modulePath}.js${closingQuote}`
            : match,
      );

      if (updated !== source) {
        await writeFile(path, updated);
      }
    }
  }
}

await rewriteImports(distRoot);
