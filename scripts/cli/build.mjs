import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { build, transform } from "esbuild";
import postcss from "postcss";
import postcssModules from "postcss-modules";

/** @param {{ minify: boolean }} options */
function cssModulesPlugin({ minify }) {
  return {
    name: "relement-css-modules",
    /** @param {import("esbuild").PluginBuild} builder */
    setup(builder) {
      builder.onLoad({ filter: /\.module\.css$/ }, async ({ path }) => {
        let classes = {};
        const source = await readFile(path, "utf8");

        const result = await postcss([
          postcssModules({
            generateScopedName: "[name]__[local]__[hash:base64:5]",
            getJSON(_cssPath, json) {
              classes = json;
            },
          }),
        ]).process(source, { from: path });
        const css = minify
          ? (await transform(result.css, { loader: "css", minify: true })).code
          : result.css;

        return {
          contents:
            `import { registerCSSModule } from "@jgluhov/relement/internal/css-modules";\n` +
            `export default registerCSSModule(${JSON.stringify(classes)}, ` +
            `${JSON.stringify(css)});`,
          loader: "js",
          resolveDir: dirname(path),
        };
      });
    },
  };
}

/**
 * @param {string} projectRoot
 * @param {import("../dev-server/config.js").RelementConfig} config
 * @param {{ mode?: "development" | "production" }} [options]
 */
export async function runBuild(
  projectRoot,
  config,
  { mode = "production" } = {},
) {
  const production = mode === "production";
  projectRoot = resolve(projectRoot);

  const sourceRoot = resolve(projectRoot, config.root);
  const entryPath = resolve(sourceRoot, config.entry);
  const htmlPath = resolve(sourceRoot, config.html);
  const outputRoot = resolve(projectRoot, "dist");
  const assetsRoot = resolve(outputRoot, "assets");

  const result = await build({
    absWorkingDir: projectRoot,
    entryPoints: [entryPath],
    bundle: true,
    outdir: assetsRoot,
    entryNames: "main",
    assetNames: "[name]-[hash]",
    format: "esm",
    platform: "browser",
    target: "es2022",
    jsx: "automatic",
    jsxImportSource: "@jgluhov/relement",
    metafile: true,
    minify: production,
    treeShaking: true,
    define: { "process.env.NODE_ENV": JSON.stringify(mode) },
    plugins: [cssModulesPlugin({ minify: production })],
  });

  const base = config.base ?? "/";
  const scriptUrl = `${base}assets/main.js`;
  const html = await readFile(htmlPath, "utf8");
  const moduleScript =
    /<script\b(?=[^>]*\btype=["']module["'])(?=[^>]*\bsrc=["'][^"']+["'])[^>]*>\s*<\/script>/i;

  if (!moduleScript.test(html)) {
    throw new Error(`No module script found in "${htmlPath}".`);
  }

  let outputHtml = html.replace(
    moduleScript,
    `<script type="module" src="${scriptUrl}"></script>`,
  );

  const cssOutputs = Object.keys(result.metafile.outputs).filter((path) =>
    path.endsWith(".css"),
  );

  if (cssOutputs.length > 0) {
    const links = cssOutputs
      .map((path) => {
        const absolutePath = resolve(projectRoot, path);
        const relativePath = relative(outputRoot, absolutePath)
          .split(sep)
          .join("/");
        return `<link rel="stylesheet" href="${base}${relativePath}" />`;
      })
      .join("\n     ");

    outputHtml = outputHtml.replace(/<\/head>/i, `     ${links}\n  </head>`);
  }

  await mkdir(outputRoot, { recursive: true });
  await writeFile(resolve(outputRoot, "index.html"), outputHtml);
}
