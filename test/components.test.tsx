import { Window } from "happy-dom";
import assert from "node:assert/strict";
import test from "node:test";
import moduleStyles from "./fixtures/component.module.css";

const dom = new Window();

Object.assign(globalThis, {
  document: dom.document,
  HTMLElement: dom.HTMLElement,
  Node: dom.Node,
  customElements: dom.customElements,
});

const { createRoot, h, useState, Fragment } = await import("../src/index.js");

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

  assert.equal(
    queryDeep<HTMLHeadingElement>(host, "h1")?.textContent,
    "Welcome",
  );
  assert.equal(
    queryDeep<HTMLParagraphElement>(host, "p")?.textContent,
    "Panel content",
  );
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
    Array.from(appHost.shadowRoot!.children, (element) => element.tagName),
    ["SPAN", "SPAN"],
  );
});

test("applies className and object styles to HTML elements", () => {
  function App() {
    return (
      <p
        className="greeting"
        style={{ color: "red", backgroundColor: "lightblue" }}
      >
        Hello
      </p>
    );
  }

  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(<App />);

  const paragraph = queryDeep<HTMLParagraphElement>(host, "p");
  assert.ok(paragraph);

  assert.equal(paragraph.className, "greeting");
  assert.equal(paragraph.style.color, "red");
  assert.equal(paragraph.style.backgroundColor, "lightblue");
});

test("renders function components inside an open shadow root", () => {
  function App() {
    return <p>Inside</p>;
  }

  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(<App />);

  const appHost = host.querySelector("r-app");
  assert.ok(appHost);
  assert.ok(appHost.shadowRoot);
  assert.equal(appHost.shadowRoot.querySelector("p")?.textContent, "Inside");
  assert.equal(appHost.querySelector("p"), null);
});

test("injects registered module styles into the component shadow root", () => {
  function StyledDemo() {
    return <div className={moduleStyles.box}>Styled</div>;
  }

  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(<StyledDemo />);

  const component = queryDeep<HTMLElement>(host, "r-styled-demo");
  assert.ok(component?.shadowRoot);

  const injectedCSS = component.shadowRoot.querySelector(
    "style[data-relement-styles]",
  )?.textContent;

  assert.match(injectedCSS ?? "", /color:\s*red/);
  assert.equal(
    component.shadowRoot.querySelector(`.${moduleStyles.box}`)?.textContent,
    "Styled",
  );
});
