interface ImportMetaEnv {
  readonly MODE: "development" | "production";
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly BASE_URL: string;
  readonly [key: `RELEMENT_${string}`]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
