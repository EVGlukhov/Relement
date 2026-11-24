import { getActiveHooks } from "./dispatcher.js";
import type { HookContext, Hooks, RefObject } from "./types.js";

export function createUseRef(context: HookContext): Hooks["useRef"] {
  return <T>(initialValue: T): RefObject<T> => {
    const slot = context.nextRefSlot(initialValue);
    return slot.value as RefObject<T>;
  };
}

export function useRef<T>(initialValue: T): RefObject<T> {
  return getActiveHooks().useRef(initialValue);
}
