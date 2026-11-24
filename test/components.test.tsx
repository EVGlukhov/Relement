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

const { createRoot, h, useState } = await import("../src/index.js");

test("gives each function component its own state", () => {
  function Counter() {
    const [count, setCount] = useState(0);

    return (
      <button onClick={() => setCount((value) => value + 1)}>{count}</button>
    );
  }

  function App() {
    return (
      <main>
        <Counter />
        <Counter />
      </main>
    );
  }

  const host = document.createElement("div");
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(<App />);

  const buttons = host.querySelectorAll("button");

  assert.equal(buttons.length, 2);
  assert.equal(buttons[0].textContent, "0");
  assert.equal(buttons[1].textContent, "0");

  buttons[0].click();

  const updatedButtons = host.querySelectorAll("button");

  assert.equal(updatedButtons[0].textContent, "1");
  assert.equal(updatedButtons[1].textContent, "0");
});

test("preserves child state when its parent rerenders", () => {
  let rerenderParent = (): void => {};

  function Counter() {
    const [count, setCount] = useState(0);
    return (
      <button onClick={() => setCount((value) => value + 1)}>{count}</button>
    );
  }

  function Parent() {
    const [version, setVersion] = useState(0);
    rerenderParent = () => setVersion((value) => value + 1);

    return (
      <main>
        <p>Parent version: {version}</p>
        <Counter />
      </main>
    );
  }

  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(<Parent />);

  host.querySelector("button")?.click();
  rerenderParent();

  assert.equal(host.querySelector("p")?.textContent, "Parent version: 1");
  assert.equal(host.querySelector("button")?.textContent, "1");
  assert.ok(host.querySelector("r-counter"));
});
