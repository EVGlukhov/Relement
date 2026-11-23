import { Window } from "happy-dom";
import assert from "node:assert/strict";
import test from "node:test";

const dom = new Window();

Object.assign(globalThis, {
  document: dom.document,
  HTMLElement: dom.HTMLElement,
  customElements: dom.customElements,
});

const { defineElement } = await import("../src/index.js");

test("keeps state separate between element instances", () => {
  defineElement("x-counter-test", ({ useState }) => {
    const [count, setCount] = useState(0);
    const button = document.createElement("button");

    button.textContent = String(count);
    button.addEventListener("click", () => setCount(count + 1));

    return button;
  });

  const first = document.createElement("x-counter-test");
  const second = document.createElement("x-counter-test");
  document.body.replaceChildren(first, second);

  assert.equal(first.textContent, "0");
  assert.equal(second.textContent, "0");

  const button = first.querySelector("button");
  assert.ok(button);
  button.click();

  assert.equal(first.textContent, "1");
  assert.equal(second.textContent, "0");
});
