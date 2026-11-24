import { HookRuntime } from "./hooks/runtime.js";
import type { FunctionComponent, VNode, VNodeChild } from "./vdom.js";

const componentTag = "relement-function-component";

interface FunctionComponentHost extends HTMLElement {
  mount(component: FunctionComponent, props: Record<string, unknown>): void;
}

function ensureComponentHost(): void {
  if (customElements.get(componentTag)) return;

  class RelementFunctionComponent extends HTMLElement {
    #component: FunctionComponent | undefined;
    #props: Record<string, unknown> = {};
    #hooks = new HookRuntime(
      () => this.update(),
      () => this.isConnected,
    );

    mount(component: FunctionComponent, props: Record<string, unknown>): void {
      this.#component = component;
      this.#props = props;
    }

    connectedCallback(): void {
      this.update();
    }

    disconnectedCallback(): void {
      this.#hooks.disconnect();
    }

    private update(): void {
      const component = this.#component;

      if (!component) {
        throw new Error("Function component host has not been initialized.");
      }

      const view = this.#hooks.render(() => component(this.#props as never));
      this.replaceChildren(...renderChild(view));
      this.#hooks.commitEffects();
    }
  }

  customElements.define(componentTag, RelementFunctionComponent);
}

function isEventHandler(value: unknown): value is EventListener {
  return typeof value === "function";
}

export function renderChild(child: VNodeChild): Node[] {
  if (child === null || child === undefined || typeof child === "boolean") {
    return [];
  }

  if (Array.isArray(child)) {
    return child.flatMap(renderChild);
  }

  if (typeof child === "string" || typeof child === "number") {
    return [document.createTextNode(String(child))];
  }

  if (child instanceof Node) {
    return [child];
  }

  const vnode = child as VNode;

  if (typeof vnode.type !== "string") {
    ensureComponentHost();

    const host = document.createElement(componentTag) as FunctionComponentHost;

    host.mount(vnode.type, { ...vnode.props });
    return [host];
  }

  const element = document.createElement(vnode.type);

  for (const [name, value] of Object.entries(vnode.props)) {
    if (name.startsWith("on") && isEventHandler(value)) {
      element.addEventListener(name.slice(2).toLowerCase(), value);
    } else if (value !== false && value !== null && value !== undefined) {
      element.setAttribute(name, String(value));
    }
  }

  element.replaceChildren(...vnode.children.flatMap(renderChild));
  return [element];
}
