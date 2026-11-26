import { Window } from "happy-dom";
import assert from "node:assert/strict";
import test from "node:test";

const dom = new Window();

Object.assign(globalThis, {
  document: dom.document,
  HTMLElement: dom.HTMLElement,
  Node: dom.Node,
  customElements: dom.customElements,
});

const { createRoot, useState } = await import("../src/index.js");
const { hotComponent } = await import("../src/hmr.js");

function CounterV1() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount((value) => value + 1)}>
      v1: {count}
    </button>
  );
}

function CounterV2() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount((value) => value + 1)}>
      v2: {count}
    </button>
  );
}

function queryDeep<T extends Element>(
  root: ParentNode,
  selector: string,
): T | undefined {
  const directMatch = root.querySelector<T>(selector);

  if (directMatch) return directMatch;

  for (const element of root.querySelectorAll<HTMLElement>("*")) {
    if (element.shadowRoot) {
      const nestedMatch = queryDeep<T>(element.shadowRoot, selector);

      if (nestedMatch) return nestedMatch;
    }
  }

  return undefined;
}

test("preserves state when a hot component implementation changes", () => {
  const host = document.createElement("div");
  document.body.appendChild(host);

  const root = createRoot(host);
  const CounterBefore = hotComponent("test#Counter", CounterV1);

  root.render(<CounterBefore />);

  const originalHost = host.firstElementChild;
  assert.ok(originalHost);

  queryDeep<HTMLButtonElement>(host, "button")?.click();

  const CounterAfter = hotComponent("test#Counter", CounterV2);
  root.render(<CounterAfter />);

  assert.strictEqual(host.firstElementChild, originalHost);
  assert.equal(
    queryDeep<HTMLButtonElement>(host, "button")?.textContent,
    "v2: 1",
  );
});
