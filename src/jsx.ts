import type { VNode, VNodeChild, VNodeKey } from "./vdom.js";

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

export function h<P extends object>(
  tagName: string | ((props: P) => VNodeChild),
  props: VNodeProps | null,
  ...children: VNodeChild[]
): VNode {
  const propsRecord: Record<string, unknown> = { ...(props ?? {}) };
  const key = propsRecord.key as VNodeKey | undefined;
  delete propsRecord.key;

  const componentProps = { ...propsRecord };

  if (children.length === 1) {
    componentProps.children = children[0];
  } else if (children.length > 1) {
    componentProps.children = children;
  }

  const renderComponent =
    typeof tagName === "function"
      ? () => tagName(componentProps as P)
      : undefined;

  return {
    type: tagName,
    key,
    props: propsRecord,
    children,
    renderComponent,
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
