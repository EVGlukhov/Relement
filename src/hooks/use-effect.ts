import { getActiveHooks } from "./dispatcher.js";
import type { Effect, HookContext, Hooks } from "./types.js";

function sameDependencies(
  previous: readonly unknown[],
  next: readonly unknown[],
): boolean {
  return (
    previous.length === next.length &&
    next.every((value, index) => Object.is(value, previous[index]))
  );
}

export function createUseEffect(context: HookContext): Hooks["useEffect"] {
  return (effect, dependencies): void => {
    const slot = context.nextEffectSlot(() => ({
      kind: "effect",
      dependencies,
      effect,
      active: false,
    }));

    const dependenciesChanged =
      dependencies === undefined ||
      slot.dependencies === undefined ||
      !sameDependencies(slot.dependencies, dependencies);

    slot.effect = effect;

    if (!slot.active || dependenciesChanged) {
      slot.dependencies =
        dependencies === undefined ? undefined : [...dependencies];

      context.enqueueEffect(slot);
    }
  };
}

export function useEffect(
  effect: Effect,
  dependencies?: readonly unknown[],
): void {
  getActiveHooks().useEffect(effect, dependencies);
}
