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
  props: Readonly<Record<string, unknown>>;
  children: readonly VNodeChild[];
}
