import type { Hooks } from "./types.js";

let activeHooks: Hooks | undefined;

export function getActiveHooks(): Hooks {
  if (!activeHooks) {
    throw new Error(
      "Hooks can only be called while rendering a Relement element.",
    );
  }

  return activeHooks;
}

export function withActiveHooks<T>(hooks: Hooks, render: () => T): T {
  const previousHooks = activeHooks;
  activeHooks = hooks;

  try {
    return render();
  } finally {
    activeHooks = previousHooks;
  }
}
