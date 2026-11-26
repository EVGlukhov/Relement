import type { RelementConfig } from "./scripts/dev-server/config.js";

export default {
  base: "/Relement/",
  root: ".",
  html: "./docs/app/index.html",
  entry: "./docs/app/main.tsx",
  port: 3000,
} satisfies RelementConfig;
