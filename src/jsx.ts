import type { VNode, VNodeChild, VNodeKey, VNodeType } from "./vdom.js";

type VNodeProps = Record<string, unknown> & {
  key?: VNodeKey;
};

export function h(
  tagName: VNodeType,
  props: VNodeProps | null,
  ...children: VNodeChild[]
): VNode {
  const { key, ...vnodeProps } = props ?? {};

  return {
    type: tagName,
    key,
    props: vnodeProps,
    children,
  };
}

declare global {
  namespace JSX {
    interface Element extends VNode {}

    interface IntrinsicAttributes {
      key?: string | number;
    }

    interface ElementChildrenAttribute {
      children: {};
    }

    interface IntrinsicElements {
      [tagName: string]: Record<string, unknown>;
    }
  }
}
