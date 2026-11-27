import { Window } from "happy-dom";
import assert from "node:assert/strict";
import test from "node:test";
import moduleStyles from "./fixtures/component.module.css";
import {
  createResource,
  type Resource,
} from "../src/async/resource.js";

const dom = new Window();

Object.assign(globalThis, {
  document: dom.document,
  HTMLElement: dom.HTMLElement,
  Node: dom.Node,
  customElements: dom.customElements,
});

const { createRoot, registerGlobalStyles, Suspense } =
  await import("../src/index.js");

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

test("passes props and children to function components", () => {
  function PropsPanel({
    title,
    children,
  }: {
    title: string;
    children: string;
  }) {
    return (
      <article>
        <h1>{title}</h1>
        <p>{children}</p>
      </article>
    );
  }

  function PropsApp() {
    return <PropsPanel title="Welcome">Panel content</PropsPanel>;
  }

  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(<PropsApp />);

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
  function FragmentApp() {
    return (
      <>
        <span>First</span>
        <span>Second</span>
      </>
    );
  }

  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(<FragmentApp />);

  const appHost = host.querySelector("r-fragment-app");
  assert.ok(appHost);
  assert.deepEqual(
    Array.from(appHost.shadowRoot!.children, (element) => element.tagName),
    ["SPAN", "SPAN"],
  );
});

test("applies className and object styles to HTML elements", () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(
    <p
      className="greeting"
      style={{ color: "red", backgroundColor: "lightblue" }}
    >
      Hello
    </p>,
  );

  const paragraph = queryDeep<HTMLParagraphElement>(host, "p");
  assert.ok(paragraph);

  assert.equal(paragraph.className, "greeting");
  assert.equal(paragraph.style.color, "red");
  assert.equal(paragraph.style.backgroundColor, "lightblue");
});

test("renders function components inside an open shadow root", () => {
  function ShadowApp() {
    return <p>Inside</p>;
  }

  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(<ShadowApp />);

  const appHost = host.querySelector("r-shadow-app");
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

test("injects registered global styles into the document and shadow root", () => {
  function GlobalStylesDemo() {
    return <div className="global-style-test">Styled globally</div>;
  }

  const css = ".global-style-test { color: rebeccapurple; }";
  registerGlobalStyles("test/global.css", css);

  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(<GlobalStylesDemo />);

  const component = host.querySelector("r-global-styles-demo");
  assert.ok(component?.shadowRoot);

  const shadowStyles = component.shadowRoot.querySelector(
    "style[data-relement-styles]",
  );
  assert.match(shadowStyles?.textContent ?? "", /color:\s*rebeccapurple/);

  const documentStyles = document.head.querySelector(
    "style[data-relement-global-styles]",
  );
  assert.match(documentStyles?.textContent ?? "", /color:\s*rebeccapurple/);
});

test("shows fallback when a child suspends", async () => {
  function AsyncText({ resource }: { resource: Resource<string> }) {
    return <p>{resource.read()}</p>;
  }

  function SuspenseDemo({ resource }: { resource: Resource<string> }) {
    return (
      <Suspense fallback={<p>Loading profile...</p>}>
        <AsyncText resource={resource} />
      </Suspense>
    );
  }

  const resource = createResource(() => new Promise<string>(() => {}));
  const host = document.createElement("div");
  document.body.appendChild(host);

  createRoot(host).render(<SuspenseDemo resource={resource} />);

  await new Promise<void>((resolve) => queueMicrotask(resolve));

  assert.equal(
    queryDeep<HTMLParagraphElement>(host, "p")?.textContent,
    "Loading profile...",
  );
});
