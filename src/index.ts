export type Hooks = {
  useState: <T>(initialValue: T) => [T, (nextValue: T) => void];
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
        useState: <T>(initialValue: T): [T, (nextValue: T) => void] => {
          const index = this.#hookIndex++;

          if (index === this.#states.length) {
            this.#states.push(initialValue);
          }

          const setState = (nextValue: T): void => {
            this.#states[index] = nextValue;
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
