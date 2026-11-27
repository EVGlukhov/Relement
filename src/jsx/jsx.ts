import type { VNode, VNodeChild, VNodeKey } from "../core/vdom.js";

type VNodeProps = Record<string, unknown> & {
  key?: VNodeKey;
};

type ComponentPropsArgument<P extends object> = {} extends P
  ? (P & VNodeProps) | null
  : P & VNodeProps;

export function createVNode<P extends object>(
  type: string | ((props: P) => VNodeChild),
  props: Record<string, unknown>,
  key: VNodeKey | undefined,
  children: VNodeChild[],
): VNode {
  const componentProps = { ...props };

  if (children.length === 1) {
    componentProps.children = children[0];
  } else if (children.length > 1) {
    componentProps.children = children;
  }

  const renderComponent =
    typeof type === "function" ? () => type(componentProps as P) : undefined;

  return { type, key, props, children, renderComponent };
}

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
  const propsRecord: Record<string, unknown> = { ...props };
  const key = propsRecord.key as VNodeKey | undefined;

  delete propsRecord.key;

  return createVNode(tagName, propsRecord, key, children);
}
