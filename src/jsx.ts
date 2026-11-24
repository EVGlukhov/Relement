import type { VNode, VNodeChild, VNodeType } from "./vdom.js";

export function h(
  tagName: VNodeType,
  props: Record<string, unknown> | null,
  ...children: VNodeChild[]
): VNode {
  return {
    type: tagName,
    props: props ?? {},
    children,
  };
}

declare global {
  namespace JSX {
    interface Element extends VNode {}

    interface ElementChildrenAttribute {
      children: {};
    }

    interface IntrinsicElements {
      [tagName: string]: Record<string, unknown>;
    }
  }
}
