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

const { createRoot } = await import("../src/index.js");

test("updates input value and checked DOM properties", () => {
  const host = document.createElement("div");
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(<input value="first" checked={false} />);

  const input = host.querySelector<HTMLInputElement>("input");
  assert.ok(input);
  assert.equal(input.value, "first");
  assert.equal(input.checked, false);

  root.render(<input value="second" checked={true} />);
  assert.equal(input.value, "second");
  assert.equal(input.checked, true);

  root.render(<input />);
  assert.equal(input.value, "");
  assert.equal(input.checked, false);
});
