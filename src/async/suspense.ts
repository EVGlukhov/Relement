import type { VNodeChild } from "../core/vdom.js";

export interface SuspenseProps {
  fallback: VNodeChild;
  children: VNodeChild;
}

export function Suspense({ children }: SuspenseProps): VNodeChild {
  return children;
}
