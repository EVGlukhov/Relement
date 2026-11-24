export function h(
  tagName: string,
  props: Record<string, unknown> | null,
  ...children: Array<Node | string>
): HTMLElement {
  const element = document.createElement(tagName);

  for (const [name, value] of Object.entries(props ?? {})) {
    if (value !== false && value !== null && value !== undefined) {
      element.setAttribute(name, String(value));
    }
  }

  for (const child of children) {
    element.append(
      typeof child === "string" ? document.createTextNode(child) : child,
    );
  }

  return element;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [tagName: string]: Record<string, unknown>;
    }
  }
}
