import { HookRuntime } from "./hooks/runtime.js";
import type { FunctionComponent, VNode, VNodeChild, VNodeKey } from "./vdom.js";
import { Fragment } from "./vdom.js";
import { getCSSForClassNames } from "./css-modules.js";
import { getHotComponentId, subscribeToHotComponent } from "./hmr.js";
import { getGlobalStyles } from "./global-styles.js";
import { Suspense } from "./suspense.js";

const nodeKeys = new WeakMap<Node, VNodeKey>();

const componentHostTags = new Set<string>();

function getChildKey(child: VNodeChild): VNodeKey | undefined {
  if (child instanceof Node || typeof child !== "object" || child === null) {
    return undefined;
  }

  return (child as VNode).key;
}

function getComponentTag(component: FunctionComponent): string {
  const hostId = getHotComponentId(component);

  if (hostId) {
    const suffix = Array.from(new TextEncoder().encode(hostId), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");

    return `r-hot-${suffix}`;
  }

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

interface SuspenseBoundary {
  suspend(promise: PromiseLike<unknown>): void;
}

interface FunctionComponentHost extends HTMLElement {
  matchesComponent(component: FunctionComponent): boolean;
  updateComponent(
    component: FunctionComponent,
    renderComponent: () => VNodeChild,
    suspenseBoundary?: SuspenseBoundary,
    props?: Readonly<Record<string, unknown>>,
  ): void;
}

function isFragment(child: VNodeChild): child is VNode {
  return (
    typeof child === "object" &&
    child !== null &&
    !(child instanceof Node) &&
    (child as VNode).type === Fragment
  );
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    "then" in value &&
    typeof value.then === "function"
  );
}

function isFunctionComponentHost(
  node: Node | undefined,
): node is FunctionComponentHost {
  return node instanceof HTMLElement && componentHostTags.has(node.localName);
}

function isStyleObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toCssPropertyName(name: string): string {
  return name.startsWith("--")
    ? name
    : name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function updateInlineStyles(
  element: HTMLElement,
  previousValue: unknown,
  value: unknown,
): void {
  const previous = isStyleObject(previousValue) ? previousValue : {};

  if (value !== null && value !== undefined && !isStyleObject(value)) {
    throw new TypeError("The style prop must be an object");
  }

  const next = isStyleObject(value) ? value : {};
  const names = new Set([...Object.keys(previous), ...Object.keys(next)]);

  for (const name of names) {
    const styleValue = next[name];
    const property = toCssPropertyName(name);

    if (styleValue === undefined || styleValue === null || styleValue === "") {
      element.style.removeProperty(property);
    } else if (typeof styleValue === "string") {
      element.style.setProperty(property, styleValue);
    } else {
      throw new TypeError(`The style value for "${name}" must be a string.`);
    }
  }
}

function updateDOMProperty(
  element: HTMLElement,
  name: string,
  value: unknown,
): boolean {
  let propertyValue: unknown;

  if (name === "value" && "value" in element) {
    propertyValue = value === null || value === undefined ? "" : String(value);
  } else if (
    [
      "checked",
      "selected",
      "disabled",
      "multiple",
      "readOnly",
      "required",
    ].includes(name) &&
    name in element
  ) {
    propertyValue = Boolean(value);
  } else {
    return false;
  }

  if (!Reflect.set(element, name, propertyValue)) {
    throw new TypeError(`Cannot set DOM property "${name}".`);
  }

  return true;
}

function flattenChildren(children: readonly VNodeChild[]): VNodeChild[] {
  const result: VNodeChild[] = [];

  for (const child of children) {
    if (Array.isArray(child)) {
      result.push(...flattenChildren(child));
    } else if (isFragment(child)) {
      result.push(...flattenChildren(child.children));
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

function collectCSSModuleStyles(children: readonly VNodeChild[]): string[] {
  const stylesheets = new Set<string>();

  function visit(child: VNodeChild): void {
    if (Array.isArray(child)) {
      child.forEach(visit);
      return;
    }

    if (
      child === null ||
      child === undefined ||
      typeof child === "boolean" ||
      typeof child === "string" ||
      typeof child === "number" ||
      child instanceof Node
    ) {
      return;
    }

    const vnode = child as VNode;

    if (vnode.type === Fragment) {
      vnode.children.forEach(visit);
      return;
    }

    if (typeof vnode.type !== "string") return;

    const className = vnode.props.className;

    if (typeof className === "string") {
      getCSSForClassNames(className).forEach((css) => stylesheets.add(css));
    }

    vnode.children.forEach(visit);
  }

  children.forEach(visit);
  return [...stylesheets];
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

    if (name === "style") {
      updateInlineStyles(element, oldValue, value);
      continue;
    }

    if (updateDOMProperty(element, name, value)) continue;

    if (name.startsWith("on") && isEventHandler(oldValue)) {
      element.removeEventListener(name.slice(2).toLowerCase(), oldValue);
    }

    if (name.startsWith("on") && isEventHandler(value)) {
      element.addEventListener(name.slice(2).toLowerCase(), value);
    } else {
      const attributeName = name === "className" ? "class" : name;

      if (value === false || value === null || value === undefined) {
        element.removeAttribute(attributeName);
      } else {
        element.setAttribute(attributeName, String(value));
      }
    }
  }

  elementProps.set(element, props);
}

function reconcileChild(
  current: ChildNode | undefined,
  child: VNodeChild,
  suspenseBoundary?: SuspenseBoundary,
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

  if (vnode.type === Fragment) {
    throw new Error("Fragment nodes must be flattened before reconciliation.");
  }

  if (typeof vnode.type !== "string") {
    const renderComponent = vnode.renderComponent;

    if (!renderComponent) {
      throw new Error("Function component VNode has no render function.");
    }

    const tag = ensureComponentHost(vnode.type);

    if (isFunctionComponentHost(current)) {
      if (current.matchesComponent(vnode.type)) {
        current.updateComponent(
          vnode.type,
          renderComponent,
          suspenseBoundary,
          vnode.props,
        );
        return current;
      }
    }

    const host = document.createElement(tag) as FunctionComponentHost;
    host.updateComponent(
      vnode.type,
      renderComponent,
      suspenseBoundary,
      vnode.props,
    );
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
  parent: HTMLElement | ShadowRoot,
  children: readonly VNodeChild[],
  styleElement?: HTMLStyleElement,
  suspenseBoundary?: SuspenseBoundary,
): void {
  const nextChildren = flattenChildren(children);

  if (styleElement) {
    styleElement.setAttribute("data-relement-styles", "");
    styleElement.textContent = [
      ...getGlobalStyles(),
      ...collectCSSModuleStyles(nextChildren),
    ].join("\n");

    if (styleElement.textContent) {
      nextChildren.push(styleElement);
    }
  }

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

    const next = reconcileChild(current, child, suspenseBoundary);

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
    #renderComponent: (() => VNodeChild) | undefined;
    #shadowRoot: ShadowRoot;
    #hooks: HookRuntime;
    #styleElement = document.createElement("style");
    #unsubscribeHotUpdate: (() => void) | undefined;
    #parentSuspenseBoundary: SuspenseBoundary | undefined;
    #suspenseBoundary: SuspenseBoundary | undefined;
    #pendingPromises = new Set<PromiseLike<unknown>>();
    #showFallback = false;
    #props: Readonly<Record<string, unknown>> = {};

    constructor() {
      super();
      this.#shadowRoot = this.attachShadow({ mode: "open" });
      this.#hooks = new HookRuntime(
        () => this.update(),
        () => this.isConnected,
      );
    }

    connectedCallback(): void {
      const currentComponent = this.#component;
      const hotId = currentComponent
        ? getHotComponentId(currentComponent)
        : undefined;

      if (hotId && !this.#unsubscribeHotUpdate) {
        this.#unsubscribeHotUpdate = subscribeToHotComponent(hotId, () =>
          this.update(),
        );
      }

      this.update();
    }

    disconnectedCallback(): void {
      this.#unsubscribeHotUpdate?.();
      this.#unsubscribeHotUpdate = undefined;
      this.#hooks.disconnect();
    }

    matchesComponent(candidate: FunctionComponent): boolean {
      return this.#component === candidate;
    }

    updateComponent(
      nextComponent: FunctionComponent,
      renderComponent: () => VNodeChild,
      suspenseBoundary?: SuspenseBoundary,
      props?: Readonly<Record<string, unknown>>,
    ): void {
      this.#component = nextComponent;
      this.#renderComponent = renderComponent;
      this.#parentSuspenseBoundary = suspenseBoundary;
      this.#suspenseBoundary =
        nextComponent === Suspense
          ? { suspend: (promise) => this.suspend(promise) }
          : suspenseBoundary;
      this.#props = props ?? {};

      if (this.isConnected) {
        this.update();
      }
    }

    private suspend(promise: PromiseLike<unknown>): void {
      if (this.#pendingPromises.has(promise)) return;

      this.#pendingPromises.add(promise);
      this.#showFallback = true;

      queueMicrotask(() => {
        if (this.isConnected) this.update();
      });

      void Promise.resolve(promise).then(
        () => this.retry(promise),
        () => this.retry(promise),
      );
    }

    private retry(promise: PromiseLike<unknown>): void {
      this.#pendingPromises.delete(promise);

      if (this.#pendingPromises.size > 0) return;

      this.#showFallback = false;
      if (this.isConnected) this.update();
    }

    private update(): void {
      const currentComponent = this.#component;

      if (!currentComponent) {
        throw new Error("Function component host has not been initialized.");
      }

      const renderComponent = this.#renderComponent;

      if (!renderComponent) {
        throw new Error("Function component host has no render function.");
      }

      const isBoundary = currentComponent === Suspense;
      let view: VNodeChild;

      if (isBoundary && this.#showFallback) {
        view = this.#props.fallback as VNodeChild;
      } else {
        try {
          view = this.#hooks.render(renderComponent);
        } catch (error) {
          if (isPromiseLike(error) && this.#parentSuspenseBoundary) {
            this.#parentSuspenseBoundary.suspend(error);
            return;
          }

          throw error;
        }
      }

      const childBoundary =
        isBoundary && this.#showFallback
          ? this.#parentSuspenseBoundary
          : this.#suspenseBoundary;

      reconcileChildren(
        this.#shadowRoot,
        [view],
        this.#styleElement,
        childBoundary,
      );
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
