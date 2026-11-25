export function Fragment({ children }: { children?: VNodeChild }): VNodeChild {
  return children ?? null;
}

export type VNodeChild =
  | VNode
  | Node
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly VNodeChild[];

export type FunctionComponent = (props: never) => VNodeChild;

export type VNodeType = string | FunctionComponent;

export interface VNode {
  type: VNodeType;
  key?: VNodeKey;
  props: Readonly<Record<string, unknown>>;
  children: readonly VNodeChild[];
  renderComponent?: () => VNodeChild;
}

export type VNodeKey = string | number;
