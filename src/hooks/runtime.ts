import { withActiveHooks } from "./dispatcher.js";
import type {
  EffectSlot,
  HookContext,
  HookSlot,
  Hooks,
  RefSlot,
  Render,
  StateSlot,
} from "./types.js";
import { createUseEffect } from "./use-effect.js";
import { createUseRef } from "./use-ref.js";
import { createUseState } from "./use-state.js";

export class HookRuntime implements HookContext {
  #slots: HookSlot[] = [];
  #hookIndex = 0;
  #expectedHookCount: number | undefined;
  #requestUpdate: () => void;
  #isConnected: () => boolean;
  #pendingEffects = new Set<EffectSlot>();
  #committingEffects = false;
  #hooks: Hooks;

  constructor(requestUpdate: () => void, isConnected: () => boolean) {
    this.#requestUpdate = requestUpdate;
    this.#isConnected = isConnected;

    this.#hooks = {
      useState: createUseState(this),
      useEffect: createUseEffect(this),
      useRef: createUseRef(this),
    };
  }

  nextStateSlot(initialValue: unknown): StateSlot {
    const index = this.#hookIndex++;
    const existingSlot = this.#slots[index];

    if (!existingSlot) {
      const slot: StateSlot = { kind: "state", value: initialValue };
      this.#slots[index] = slot;
      return slot;
    }

    if (existingSlot.kind !== "state") {
      throw new Error("Hook type changed at this position.");
    }

    return existingSlot;
  }

  nextEffectSlot(create: () => EffectSlot): EffectSlot {
    const index = this.#hookIndex++;
    const existingSlot = this.#slots[index];

    if (!existingSlot) {
      const slot = create();
      this.#slots[index] = slot;
      return slot;
    }

    if (existingSlot.kind !== "effect") {
      throw new Error("Hook type changed at this position.");
    }

    return existingSlot;
  }

  nextRefSlot(initialValue: unknown): RefSlot {
    const index = this.#hookIndex++;
    const existingSlot = this.#slots[index];

    if (!existingSlot) {
      const slot: RefSlot = {
        kind: "ref",
        value: { current: initialValue },
      };

      this.#slots[index] = slot;
      return slot;
    }

    if (existingSlot.kind !== "ref") {
      throw new Error("Hook type changed at this position");
    }

    return existingSlot;
  }

  isConnected(): boolean {
    return this.#isConnected();
  }

  requestUpdate(): void {
    this.#requestUpdate();
  }

  enqueueEffect(slot: EffectSlot): void {
    this.#pendingEffects.add(slot);
  }

  render(render: Render): Node {
    this.#hookIndex = 0;

    const view = withActiveHooks(this.#hooks, render);
    const hookCount = this.#hookIndex;

    if (
      this.#expectedHookCount !== undefined &&
      hookCount !== this.#expectedHookCount
    ) {
      throw new Error(
        "The number of hooks changed. " +
          "Call hooks in the same order on every render.",
      );
    }

    this.#expectedHookCount = hookCount;
    return view;
  }

  commitEffects(): void {
    if (this.#committingEffects) return;

    this.#committingEffects = true;

    try {
      while (this.#pendingEffects.size > 0) {
        const pending = [...this.#pendingEffects];
        this.#pendingEffects.clear();

        for (const slot of pending) {
          if (slot.active) {
            slot.active = false;
            const cleanup = slot.cleanup;
            slot.cleanup = undefined;
            cleanup?.();
          }

          slot.active = true;

          try {
            const cleanup = slot.effect();
            if (typeof cleanup === "function") {
              slot.cleanup = cleanup;
            }
          } catch (error) {
            slot.active = false;
            throw error;
          }
        }
      }
    } finally {
      this.#committingEffects = false;
    }
  }

  disconnect(): void {
    this.#pendingEffects.clear();

    for (const slot of this.#slots) {
      if (slot?.kind === "effect" && slot.active) {
        slot.active = false;
        const cleanup = slot.cleanup;
        slot.cleanup = undefined;
        cleanup?.();
      }
    }
  }
}
