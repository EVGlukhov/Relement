import { HookRuntime } from "./hooks/runtime.js";
import { reconcileChildren } from "./renderer.js";
import type { ComponentProps, ComponentRender } from "./types.js";

export { useEffect, useState, useRef } from "./hooks/index.js";
export type {
  RefObject,
  RefSlot,
  Effect,
  EffectCleanup,
  Hooks,
  StateSetter,
  StateUpdate,
} from "./hooks/index.js";

export { h } from "./jsx.js";
export { createRoot, type Root } from "./root.js";
export { Fragment, type VNodeChild } from "./vdom.js";
export { registerGlobalStyles } from "./global-styles.js";

export function defineElement<TProps extends object>(
  name: string,
  render: ComponentRender<TProps>,
  observedAttributes: readonly (keyof TProps & string)[] = [],
): void {
  const attributes = [...observedAttributes];

  class RelementElement extends HTMLElement {
    #hooks: HookRuntime;
    #shadowRoot = this.attachShadow({ mode: "open" });
    #styleElement = document.createElement("style");

    constructor() {
      super();
      this.#hooks = new HookRuntime(
        () => this.update(),
        () => this.isConnected,
      );
    }

    static get observedAttributes(): string[] {
      return attributes;
    }

    attributeChangedCallback(): void {
      this.update();
    }

    private readProps(): TProps {
      const props: ComponentProps = {};

      for (const attribute of attributes) {
        props[attribute] = this.getAttribute(attribute);
      }

      return props as unknown as TProps;
    }

    connectedCallback(): void {
      this.update();
    }

    disconnectedCallback(): void {
      this.#hooks.disconnect();
    }

    private update(): void {
      const view = this.#hooks.render(() => render(this.readProps()));
      reconcileChildren(this.#shadowRoot, [view], this.#styleElement);
      this.#hooks.commitEffects();
    }
  }

  customElements.define(name, RelementElement);
}
