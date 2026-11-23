export type StateUpdate<T> = T | ((previousValue: T) => T);
export type StateSetter<T> = (nextValue: StateUpdate<T>) => void;
export type Hooks = {
  useState: <T>(initialValue: T) => [T, StateSetter<T>];
};

export type Render = (hooks: Hooks) => Node;

export function defineElement(name: string, render: Render): void {
  class RelementElement extends HTMLElement {
    #states: unknown[] = [];
    #hookIndex = 0;

    connectedCallback(): void {
      this.update();
    }

    private update(): void {
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
            if (this.isConnected) this.update();
          };

          return [this.#states[index] as T, setState];
        },
      });

      this.replaceChildren(view);
    }
  }

  customElements.define(name, RelementElement);
}
