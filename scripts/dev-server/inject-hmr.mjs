import { transformSync } from "@babel/core";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const distRoot = join(projectRoot, "dist");
const appRoot = join(distRoot, "docs/app");

/**
 * @param {string} directory
 * @returns {Promise<string[]>}
 */
async function getJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await getJavaScriptFiles(path)));
    } else if (entry.isFile() && path.endsWith(".js")) {
      files.push(path);
    }
  }

  return files;
}

/**
 * @param {import("@babel/core").PluginAPI} babel
 * @param {object} options
 * @returns {import("@babel/core").PluginObject}
 */
function createHmrPlugin(babel, options) {
  if (
    !("moduleId" in options) ||
    typeof options.moduleId !== "string" ||
    !("runtimeImport" in options) ||
    typeof options.runtimeImport !== "string"
  ) {
    throw new TypeError("Invalid Relement HMR plugin options.");
  }

  const { moduleId, runtimeImport } = options;
  let hasHotComponents = false;
  let hotComponentName = "__relementHotComponent";

  return {
    visitor: {
      Program: {
        enter(path) {
          hasHotComponents = false;
          hotComponentName = "__relementHotComponent";

          while (path.scope.hasBinding(hotComponentName)) {
            hotComponentName += "$";
          }
        },
        exit(path) {
          if (!hasHotComponents) return;

          path.unshiftContainer(
            "body",
            babel.types.importDeclaration(
              [
                babel.types.importSpecifier(
                  babel.types.identifier(hotComponentName),
                  babel.types.identifier("hotComponent"),
                ),
              ],
              babel.types.stringLiteral(runtimeImport),
            ),
          );
        },
      },

      FunctionDeclaration(path) {
        const { types: t } = babel;
        const parent = path.parentPath;
        const isModuleLevel =
          parent.isProgram() ||
          ((parent.isExportNamedDeclaration() ||
            parent.isExportDefaultDeclaration()) &&
            parent.parentPath?.isProgram() === true);

        const name = path.node.id?.name;

        if (!isModuleLevel || !name || !/^[A-Z]/.test(name)) return;

        const original = path.node;
        const component = t.callExpression(t.identifier(hotComponentName), [
          t.stringLiteral(`${moduleId}#${name}`),
          t.functionExpression(
            t.identifier(name),
            original.params,
            original.body,
            original.generator,
            original.async,
          ),
        ]);
        const declaration = t.variableDeclaration("const", [
          t.variableDeclarator(t.identifier(name), component),
        ]);

        hasHotComponents = true;

        if (parent.isExportNamedDeclaration()) {
          parent.replaceWith(t.exportNamedDeclaration(declaration, []));
        } else if (parent.isExportDefaultDeclaration()) {
          parent.replaceWithMultiple([
            declaration,
            t.exportDefaultDeclaration(t.identifier(name)),
          ]);
        } else {
          path.replaceWith(declaration);
        }
      },
    },
  };
}

for (const filePath of await getJavaScriptFiles(appRoot)) {
  const source = await readFile(filePath, "utf8");
  const moduleId = relative(distRoot, filePath).split(sep).join("/");
  let runtimeImport = relative(dirname(filePath), join(distRoot, "src/hmr.js"))
    .split(sep)
    .join("/");

  if (!runtimeImport.startsWith(".")) {
    runtimeImport = `./${runtimeImport}`;
  }

  const result = transformSync(source, {
    babelrc: false,
    configFile: false,
    filename: filePath,
    plugins: [[createHmrPlugin, { moduleId, runtimeImport }]],
  });

  if (!result || typeof result.code !== "string") {
    throw new Error(`Could not instrument HMR module: ${filePath}`);
  }

  await writeFile(filePath, result.code);
}
