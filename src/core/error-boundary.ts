import type { VNodeChild } from "./vdom.js";

export interface ErrorBoundaryProps {
  fallback: (error: unknown) => VNodeChild;
  children: VNodeChild;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps): VNodeChild {
  return children;
}
