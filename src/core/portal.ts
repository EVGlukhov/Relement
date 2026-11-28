import { VNodeChild } from "./vdom.js";

export type PortalTarget = HTMLElement | ShadowRoot;

export interface PortalProps {
  target: PortalTarget;
  children?: VNodeChild;
}

export function Portal({ children }: PortalProps): VNodeChild {
  return children ?? null;
}
