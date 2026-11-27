import { HookRuntime } from "./hooks/runtime.js";
import { reconcileChildren } from "./core/renderer.js";
import { ComponentProps, ComponentRender } from "./types.js";

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
