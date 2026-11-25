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

const { createRoot, h, useState, Fragment } = await import("../src/index.js");

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

test("preserves keyed component state when siblings reorder", () => {
  function Counter({ id }: { id: string }) {
    const [count, setCount] = useState(0);

    return (
      <button data-counter={id} onClick={() => setCount((value) => value + 1)}>
        {id}: {count}
      </button>
    );
  }

  function App() {
    const [reversed, setReversed] = useState(false);
    const ids = reversed ? ["b", "a"] : ["a", "b"];

    return (
      <main>
        <button onClick={() => setReversed((value) => !value)}>Reverse</button>
        {ids.map((id) => (
          <Counter key={id} id={id} />
        ))}
      </main>
    );
  }

  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(<App />);

  const counters = host.querySelectorAll<HTMLButtonElement>("[data-counter]");
  counters[0].click();
  counters[1].click();
  counters[1].click();

  host.querySelector<HTMLButtonElement>("main > button")?.click();

  assert.equal(host.querySelector('[data-counter="a"]')?.textContent, "a: 1");
  assert.equal(host.querySelector('[data-counter="b"]')?.textContent, "b: 2");
});

test("passes props and children to function components", () => {
  function Panel({ title, children }: { title: string; children: string }) {
    return (
      <article>
        <h1>{title}</h1>
        <p>{children}</p>
      </article>
    );
  }

  function App() {
    return <Panel title="Welcome">Panel content</Panel>;
  }

  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(<App />);

  assert.equal(host.querySelector("h1")?.textContent, "Welcome");
  assert.equal(host.querySelector("p")?.textContent, "Panel content");
});

test("renders fragments without adding a wrapper", () => {
  function App() {
    return (
      <>
        <span>First</span>
        <span>Second</span>
      </>
    );
  }

  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(<App />);

  const appHost = host.querySelector("r-app");
  assert.ok(appHost);
  assert.deepEqual(
    Array.from(appHost.children, (element) => element.tagName),
    ["SPAN", "SPAN"],
  );
});
