import { HookRuntime } from "./hooks/runtime.js";
import type { FunctionComponent, VNode, VNodeChild, VNodeKey } from "./vdom.js";

const nodeKeys = new WeakMap<Node, VNodeKey>();

const componentHostTags = new Set<string>();

function getChildKey(child: VNodeChild): VNodeKey | undefined {
  if (child instanceof Node || typeof child !== "object" || child === null) {
    return undefined;
  }

  return (child as VNode).key;
}

function getComponentTag(component: FunctionComponent): string {
  const name = component.name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `r-${name || "anonymous"}`;
}

const elementProps = new WeakMap<
  HTMLElement,
  Readonly<Record<string, unknown>>
>();

interface FunctionComponentHost extends HTMLElement {
  matchesComponent(component: FunctionComponent): boolean;
  updateComponent(
    component: FunctionComponent,
    props: Record<string, unknown>,
  ): void;
}

function isFunctionComponentHost(
  node: Node | undefined,
): node is FunctionComponentHost {
  return node instanceof HTMLElement && componentHostTags.has(node.localName);
}

function flattenChildren(children: readonly VNodeChild[]): VNodeChild[] {
  const result: VNodeChild[] = [];

  for (const child of children) {
    if (Array.isArray(child)) {
      result.push(...flattenChildren(child));
    } else if (
      child !== null &&
      child !== undefined &&
      typeof child !== "boolean"
    ) {
      result.push(child);
    }
  }

  return result;
}

function updateElementProps(
  element: HTMLElement,
  props: Readonly<Record<string, unknown>>,
): void {
  const previous = elementProps.get(element) ?? {};
  const names = new Set([...Object.keys(previous), ...Object.keys(props)]);

  for (const name of names) {
    const oldValue = previous[name];
    const value = props[name];

    if (Object.is(oldValue, value)) continue;

    if (name.startsWith("on") && isEventHandler(oldValue)) {
      element.removeEventListener(name.slice(2).toLowerCase(), oldValue);
    }

    if (name.startsWith("on") && isEventHandler(value)) {
      element.addEventListener(name.slice(2).toLowerCase(), value);
    } else if (value === false || value === null || value === undefined) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, String(value));
    }
  }

  elementProps.set(element, props);
}

function reconcileChild(
  current: ChildNode | undefined,
  child: VNodeChild,
): Node {
  if (typeof child === "string" || typeof child === "number") {
    const text = String(child);

    if (current?.nodeType === Node.TEXT_NODE) {
      current.textContent = text;
      return current;
    }

    return document.createTextNode(text);
  }

  if (child instanceof Node) {
    return child;
  }

  const vnode = child as VNode;

  if (typeof vnode.type !== "string") {
    const tag = ensureComponentHost(vnode.type);

    if (isFunctionComponentHost(current)) {
      if (current.matchesComponent(vnode.type)) {
        current.updateComponent(vnode.type, { ...vnode.props });
        return current;
      }
    }

    const host = document.createElement(tag) as FunctionComponentHost;
    host.updateComponent(vnode.type, { ...vnode.props });
    return host;
  }

  const element =
    current instanceof HTMLElement &&
    current.localName === vnode.type.toLowerCase()
      ? current
      : document.createElement(vnode.type);

  updateElementProps(element, vnode.props);
  reconcileChildren(element, vnode.children);

  return element;
}

export function reconcileChildren(
  parent: HTMLElement,
  children: readonly VNodeChild[],
): void {
  const nextChildren = flattenChildren(children);
  const previous = Array.from(parent.childNodes);
  const previousNodes = new Set<Node>(previous);
  const usedNodes = new Set<Node>();
  const keys = new Set<VNodeKey>();

  for (const child of nextChildren) {
    const key = getChildKey(child);

    if (key === undefined) continue;
    if (keys.has(key)) {
      throw new Error(`Duplicate key "${key}" among siblings.`);
    }

    keys.add(key);
  }

  for (let index = 0; index < nextChildren.length; index += 1) {
    const child = nextChildren[index];
    const key = getChildKey(child);

    const current =
      key === undefined
        ? previous[index] &&
          !usedNodes.has(previous[index]) &&
          !nodeKeys.has(previous[index])
          ? previous[index]
          : undefined
        : previous.find(
            (node) => !usedNodes.has(node) && nodeKeys.get(node) === key,
          );

    const next = reconcileChild(current, child);

    if (previousNodes.has(next)) {
      usedNodes.add(next);
    }

    if (key === undefined) {
      nodeKeys.delete(next);
    } else {
      nodeKeys.set(next, key);
    }

    const position = parent.childNodes.item(index);

    if (next !== position) {
      parent.insertBefore(next, position);
    }
  }

  for (const node of previous) {
    if (!usedNodes.has(node) && node.parentNode === parent) {
      parent.removeChild(node);
    }
  }
}

function ensureComponentHost(component: FunctionComponent): string {
  const tag = getComponentTag(component);

  if (customElements.get(tag)) {
    if (!componentHostTags.has(tag)) {
      throw new Error(`Custom element "${tag}" is already registered`);
    }

    return tag;
  }

  class RelementFunctionComponent extends HTMLElement {
    #component: FunctionComponent | undefined;
    #props: Record<string, unknown> = {};
    #hooks = new HookRuntime(
      () => this.update(),
      () => this.isConnected,
    );

    connectedCallback(): void {
      this.update();
    }

    disconnectedCallback(): void {
      this.#hooks.disconnect();
    }

    matchesComponent(component: FunctionComponent): boolean {
      return this.#component === component;
    }

    updateComponent(
      component: FunctionComponent,
      props: Record<string, unknown>,
    ): void {
      this.#component = component;
      this.#props = props;

      if (this.isConnected) {
        this.update();
      }
    }

    private update(): void {
      const component = this.#component;

      if (!component) {
        throw new Error("Function component host has not been initialized.");
      }

      const view = this.#hooks.render(() => component(this.#props as never));
      reconcileChildren(this, [view]);
      this.#hooks.commitEffects();
    }
  }

  customElements.define(tag, RelementFunctionComponent);
  componentHostTags.add(tag);

  return tag;
}

function isEventHandler(value: unknown): value is EventListener {
  return typeof value === "function";
}
