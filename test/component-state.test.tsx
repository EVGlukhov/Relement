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

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount((value) => value + 1)}>{count}</button>
  );
}

function TwoCountersApp() {
  return (
    <main>
      <Counter />
      <Counter />
    </main>
  );
}

let rerenderParent = (): void => {};

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

function KeyedCounter({ id }: { id: string }) {
  const [count, setCount] = useState(0);

  return (
    <button data-counter={id} onClick={() => setCount((value) => value + 1)}>
      {id}: {count}
    </button>
  );
}

function KeyedCountersApp() {
  const [reversed, setReversed] = useState(false);
  const ids = reversed ? ["b", "a"] : ["a", "b"];

  return (
    <main>
      <button onClick={() => setReversed((value) => !value)}>Reverse</button>
      {ids.map((id) => (
        <KeyedCounter key={id} id={id} />
      ))}
    </main>
  );
}

function queryAllDeep<T extends Element>(
  root: ParentNode,
  selector: string,
): T[] {
  const results = Array.from(root.querySelectorAll<T>(selector));

  for (const element of root.querySelectorAll<HTMLElement>("*")) {
    if (element.shadowRoot) {
      results.push(...queryAllDeep<T>(element.shadowRoot, selector));
    }
  }

  return results;
}

function queryDeep<T extends Element>(
  root: ParentNode,
  selector: string,
): T | undefined {
  return queryAllDeep<T>(root, selector)[0];
}

test("gives each function component its own state", () => {
  const host = document.createElement("div");
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(<TwoCountersApp />);

  const buttons = queryAllDeep<HTMLButtonElement>(host, "button");

  assert.equal(buttons.length, 2);
  assert.equal(buttons[0].textContent, "0");
  assert.equal(buttons[1].textContent, "0");

  buttons[0].click();

  const updatedButtons = queryAllDeep<HTMLButtonElement>(host, "button");

  assert.equal(updatedButtons[0].textContent, "1");
  assert.equal(updatedButtons[1].textContent, "0");
});

test("preserves child state when its parent rerenders", () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(<Parent />);

  queryDeep<HTMLButtonElement>(host, "button")?.click();
  rerenderParent();

  assert.equal(
    queryDeep<HTMLParagraphElement>(host, "p")?.textContent,
    "Parent version: 1",
  );
  assert.equal(queryDeep<HTMLButtonElement>(host, "button")?.textContent, "1");
  assert.ok(queryDeep(host, "r-counter"));
});

test("preserves keyed component state when siblings reorder", () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(<KeyedCountersApp />);

  const counters = queryAllDeep<HTMLButtonElement>(host, "[data-counter]");
  counters[0].click();
  counters[1].click();
  counters[1].click();

  queryDeep<HTMLButtonElement>(host, "main > button")?.click();

  assert.equal(
    queryDeep<HTMLButtonElement>(host, '[data-counter="a"]')?.textContent,
    "a: 1",
  );
  assert.equal(
    queryDeep<HTMLButtonElement>(host, '[data-counter="b"]')?.textContent,
    "b: 2",
  );
});
