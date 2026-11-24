import { HookRuntime, type Render } from "./hooks.js";

export type { Hooks, Render, StateSetter, StateUpdate } from "./hooks.js";

export function defineElement(name: string, render: Render): void {
  class RelementElement extends HTMLElement {
    #hooks: HookRuntime;

    constructor() {
      super();
      this.#hooks = new HookRuntime(
        () => this.update(),
        () => this.isConnected,
      );
    }

    connectedCallback(): void {
      this.update();
    }

    private update(): void {
      this.replaceChildren(this.#hooks.render(render));
    }
  }

  customElements.define(name, RelementElement);
}
