export type StateUpdate<T> = T | ((previousValue: T) => T);
export type StateSetter<T> = (nextValue: StateUpdate<T>) => void;
export type Hooks = {
  useState: <T>(initialValue: T) => [T, StateSetter<T>];
};
export type Render = (hooks: Hooks) => Node;

export class HookRuntime {
  #states: unknown[] = [];
  #hookIndex = 0;
  #expectedHookCount: number | undefined;
  #requestUpdate: () => void;
  #isConnected: () => boolean;

  constructor(requestUpdate: () => void, isConnected: () => boolean) {
    this.#requestUpdate = requestUpdate;
    this.#isConnected = isConnected;
  }

  render(render: Render): Node {
    this.#hookIndex = 0;

    const view = render({
      useState: <T>(initialValue: T): [T, StateSetter<T>] => {
        const index = this.#hookIndex++;

        if (index === this.#states.length) {
          this.#states.push(initialValue);
        }

        const setState: StateSetter<T> = (nextValue) => {
          const previousValue = this.#states[index] as T;
          const value =
            typeof nextValue === "function"
              ? (nextValue as (previousValue: T) => T)(previousValue)
              : nextValue;

          if (Object.is(previousValue, value)) return;

          this.#states[index] = value;
          if (this.#isConnected()) this.#requestUpdate();
        };

        return [this.#states[index] as T, setState];
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
}
