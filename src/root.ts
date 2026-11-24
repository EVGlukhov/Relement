import { renderChild } from "./renderer.js";
import type { VNodeChild } from "./vdom.js";

export type Root = {
  render(node: VNodeChild): void;
};

export function createRoot(host: HTMLElement): Root {
  return {
    render(node: VNodeChild): void {
      host.replaceChildren(...renderChild(node));
    },
  };
}
