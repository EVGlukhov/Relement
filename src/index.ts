import { HookRuntime } from "./hooks/runtime.js";
import type { Render } from "./hooks/types.js";

export { useEffect, useState } from "./hooks/index.js";
export type {
  Effect,
  EffectCleanup,
  Hooks,
  Render,
  StateSetter,
  StateUpdate,
} from "./hooks/index.js";

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

    disconnectedCallback(): void {
      this.#hooks.disconnect();
    }

    private update(): void {
      const view = this.#hooks.render(render);
      this.replaceChildren(view);
      this.#hooks.commitEffects();
    }
  }

  customElements.define(name, RelementElement);
}
