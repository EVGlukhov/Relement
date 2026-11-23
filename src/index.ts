export type Render = () => Node;

export function defineElement(name: string, render: Render): void {
  class RelementElement extends HTMLElement {
    connectedCallback(): void {
      this.replaceChildren(render());
    }
  }

  customElements.define(name, RelementElement);
}
