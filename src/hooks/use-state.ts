import { getActiveHooks } from "./dispatcher.js";
import type { HookContext, Hooks, StateSetter } from "./types.js";

export function createUseState(context: HookContext): Hooks["useState"] {
  return <T>(initialValue: T): [T, StateSetter<T>] => {
    const slot = context.nextStateSlot(initialValue);

    const setState: StateSetter<T> = (nextValue) => {
      const previousValue = slot.value as T;
      const value =
        typeof nextValue === "function"
          ? (nextValue as (previousValue: T) => T)(previousValue)
          : nextValue;

      if (Object.is(previousValue, value)) return;

      slot.value = value;

      if (context.isConnected()) {
        context.requestUpdate();
      }
    };

    return [slot.value as T, setState];
  };
}

export function useState<T>(initialValue: T): [T, StateSetter<T>] {
  return getActiveHooks().useState(initialValue);
}
