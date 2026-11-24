export type Root = {
  render(node: Node): void;
};

export function createRoot(host: HTMLElement): Root {
  return {
    render(node: Node): void {
      host.replaceChildren(node);
    },
  };
}
