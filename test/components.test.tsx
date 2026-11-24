import { Window } from "happy-dom";
import assert from "node:assert/strict";
import test from "node:test";

const dom = new Window();

Object.assign(globalThis, {
  document: dom.document,
  HTMLElement: dom.HTMLElement,
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
  const root = createRoot(host);

  root.render(<App />);

  const buttons = host.querySelectorAll("button");

  assert.equal(buttons.length, 2);
  assert.equal(buttons[0].textContent, "0");
  assert.equal(buttons[1].textContent, "0");

  buttons[0].click();

  assert.equal(buttons[0].textContent, "1");
  assert.equal(buttons[1].textContent, "0");
});
