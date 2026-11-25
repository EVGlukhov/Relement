import type { VNode, VNodeChild, VNodeKey, VNodeType } from "./vdom.js";

type VNodeProps = Record<string, unknown> & {
  key?: VNodeKey;
};

type ComponentPropsArgument<P extends object> = {} extends P
  ? (P & VNodeProps) | null
  : P & VNodeProps;

export function h<P extends object>(
  tagName: (props: P) => VNodeChild,
  props: ComponentPropsArgument<P>,
  ...children: VNodeChild[]
): VNode;

export function h(
  tagName: string,
  props: VNodeProps | null,
  ...children: VNodeChild[]
): VNode;

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
