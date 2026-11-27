import { VNodeChild } from "./vdom.js";

export interface SuspenseProps {
  fallback: VNodeChild;
  children: VNodeChild;
}

export function Suspense({ children }: SuspenseProps): VNodeChild {
  return children;
}
