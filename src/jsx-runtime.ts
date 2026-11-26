import { createVNode } from "./jsx.js";
import type { VNode, VNodeChild, VNodeKey } from "./vdom.js";

export { Fragment } from "./vdom.js";

type RuntimeProps<P extends object> = P & {
  children?: VNodeChild;
  key?: VNodeKey;
};

function createJSXElement<P extends object = Record<string, unknown>>(
  type: string | ((props: P) => VNodeChild),
  props: RuntimeProps<P> | null,
  key?: VNodeKey,
): VNode {
  const propsRecord: Record<string, unknown> = { ...(props ?? {}) };
  const propKey = propsRecord.key as VNodeKey | undefined;
  const hasChildren = Object.hasOwn(propsRecord, "children");
  const children = hasChildren ? [propsRecord.children as VNodeChild] : [];

  delete propsRecord.key;
  delete propsRecord.children;

  return createVNode(type, propsRecord, key ?? propKey, children);
}

export const jsx = createJSXElement;
export const jsxs = createJSXElement;

export namespace JSX {
  export interface Element extends VNode {}

  export interface IntrinsicAttributes {
    key?: string | number;
  }

  export interface ElementChildrenAttribute {
    children: {};
  }

  export interface IntrinsicElements {
    [tagName: string]: Record<string, unknown>;
  }
}
