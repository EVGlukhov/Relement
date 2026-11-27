const globalStylesById = new Map<string, string>();
let documentStyleElement: HTMLStyleElement | undefined;

export function getGlobalStyles(): readonly string[] {
  return [...globalStylesById.values()];
}

export function registerGlobalStyles(id: string, cssText: string): void {
  if (!id.trim()) {
    throw new Error("Global styles must have a non-empty ID.");
  }

  globalStylesById.set(id, cssText);

  if (typeof document === "undefined") return;

  documentStyleElement ??=
    document.querySelector<HTMLStyleElement>(
      "style[data-relement-global-styles]",
    ) ?? document.createElement("style");

  documentStyleElement.setAttribute("data-relement-global-styles", "");

  if (!documentStyleElement.isConnected) {
    (document.head ?? document.documentElement).append(documentStyleElement);
  }

  documentStyleElement.textContent = getGlobalStyles().join("\n");
}
