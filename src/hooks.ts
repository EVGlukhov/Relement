export type StateUpdate<T> = T | ((previousValue: T) => T);
export type StateSetter<T> = (nextValue: StateUpdate<T>) => void;
export type EffectCleanup = () => void;
export type Effect = () => void | EffectCleanup;
type StateSlot = { kind: "state"; value: unknown };
type EffectSlot = {
  kind: "effect";
  dependencies: readonly unknown[];
  effect: Effect;
  cleanup?: EffectCleanup;
  active: boolean;
};
type HookSlot = StateSlot | EffectSlot;
export type Hooks = {
  useState: <T>(initialValue: T) => [T, StateSetter<T>];
  useEffect: (effect: Effect, dependencies: readonly unknown[]) => void;
};
export type Render = (hooks: Hooks) => Node;

function sameDependencies(
  previous: readonly unknown[],
  next: readonly unknown[],
): boolean {
  return (
    previous.length === next.length &&
    next.every((value, index) => Object.is(value, previous[index]))
  );
}

export class HookRuntime {
  #slots: HookSlot[] = [];
  #hookIndex = 0;
  #expectedHookCount: number | undefined;
  #requestUpdate: () => void;
  #isConnected: () => boolean;
  #pendingEffects = new Set<EffectSlot>();
  #committingEffects = false;

  constructor(requestUpdate: () => void, isConnected: () => boolean) {
    this.#requestUpdate = requestUpdate;
    this.#isConnected = isConnected;
  }

  render(render: Render): Node {
    this.#hookIndex = 0;

    const view = render({
      useEffect: (effect, dependencies) => {
        const index = this.#hookIndex++;
        let slot = this.#slots[index];
        if (!slot) {
          slot = {
            kind: "effect",
            dependencies: [],
            effect,
            active: false,
          };
          this.#slots[index] = slot;
        } else if (slot.kind !== "effect") {
          throw new Error("Hook type changed at this position.");
        }

        const dependenciesChanged = !sameDependencies(
          slot.dependencies,
          dependencies,
        );

        slot.effect = effect;

        if (!slot.active || dependenciesChanged) {
          slot.dependencies = [...dependencies];
          this.#pendingEffects.add(slot);
        }
      },
      useState: <T>(initialValue: T): [T, StateSetter<T>] => {
        const index = this.#hookIndex++;
        let slot = this.#slots[index];

        if (!slot) {
          slot = { kind: "state", value: initialValue };
          this.#slots[index] = slot;
        } else if (slot.kind !== "state") {
          throw new Error("Hook type changed at this position.");
        }

        const setState: StateSetter<T> = (nextValue) => {
          const stateSlot = this.#slots[index];

          if (!stateSlot || stateSlot.kind !== "state") {
            throw new Error("State hook is no longer available.");
          }

          const previousValue = stateSlot.value as T;
          const value =
            typeof nextValue === "function"
              ? (nextValue as (previousValue: T) => T)(previousValue)
              : nextValue;

          if (Object.is(previousValue, value)) return;

          stateSlot.value = value;
          if (this.#isConnected()) this.#requestUpdate();
        };

        return [slot.value as T, setState];
      },
    });

    const hookCount = this.#hookIndex;

    if (
      this.#expectedHookCount !== undefined &&
      hookCount !== this.#expectedHookCount
    ) {
      throw new Error(
        `The number of useState calls changed. ` +
          `Call hooks in the same order on every render.`,
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
