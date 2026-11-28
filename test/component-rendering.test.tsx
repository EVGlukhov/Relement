import { Window } from "happy-dom";
import assert from "node:assert/strict";
import test from "node:test";
import moduleStyles from "./fixtures/component.module.css";
import { ErrorBoundary, use } from "../src/index.js";

const dom = new Window();

Object.assign(globalThis, {
  document: dom.document,
  HTMLElement: dom.HTMLElement,
  Node: dom.Node,
  customElements: dom.customElements,
});

const { createRoot, registerGlobalStyles, Suspense, Portal } =
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
  function AsyncText({ promise }: { promise: PromiseLike<string> }) {
    return <p>{use(promise)}</p>;
  }

  function SuspenseDemo({ promise }: { promise: PromiseLike<string> }) {
    return (
      <Suspense fallback={<p>Loading profile...</p>}>
        <AsyncText promise={promise} />
      </Suspense>
    );
  }

  let resolveProfile: ((value: string) => void) | undefined;
  const profilePromise = new Promise<string>((resolve) => {
    resolveProfile = resolve;
  });
  const host = document.createElement("div");
  document.body.appendChild(host);

  createRoot(host).render(<SuspenseDemo promise={profilePromise} />);

  await new Promise<void>((resolve) => queueMicrotask(resolve));
  assert.equal(
    queryDeep<HTMLParagraphElement>(host, "p")?.textContent,
    "Loading profile...",
  );

  assert.ok(resolveProfile);
  resolveProfile("Profile loaded");
  await profilePromise;

  assert.equal(
    queryDeep<HTMLParagraphElement>(host, "p")?.textContent,
    "Profile loaded",
  );
});

test("shows an error fallback when a nested child throws during render", async () => {
  function BrokenPanel(): never {
    throw new Error("render failed");
  }

  function ErrorBoundaryDemo() {
    return (
      <ErrorBoundary
        fallback={(error) => (
          <p role="alert">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        )}
      >
        <section>
          <BrokenPanel />
        </section>
      </ErrorBoundary>
    );
  }

  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(<ErrorBoundaryDemo />);

  await new Promise<void>((resolve) => queueMicrotask(resolve));

  assert.equal(
    queryDeep<HTMLParagraphElement>(host, '[role="alert"]')?.textContent,
    "render failed",
  );
});

test("catches a rejected promise inside Suspense", async () => {
  const failure = new Error("profile load failed");
  const profilePromise = Promise.reject<string>(failure);

  function AsyncText() {
    return <p>{use(profilePromise)}</p>;
  }

  function ErrorBoundaryDemo() {
    return (
      <ErrorBoundary
        fallback={(error) => (
          <p role="alert">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        )}
      >
        <Suspense fallback={<p>Loading profile...</p>}>
          <AsyncText />
        </Suspense>
      </ErrorBoundary>
    );
  }

  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(<ErrorBoundaryDemo />);

  await new Promise<void>((resolve) => setTimeout(resolve, 0));

  assert.equal(
    queryDeep<HTMLParagraphElement>(host, '[role="alert"]')?.textContent,
    "profile load failed",
  );
});

test("passes errors from an error fallback to its parent boundary", async () => {
  function BrokenPanel(): never {
    throw new Error("render failed");
  }

  function BrokenFallback(): never {
    throw new Error("fallback failed");
  }

  function ErrorBoundaryDemo() {
    return (
      <ErrorBoundary
        fallback={(error) => (
          <p role="alert">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        )}
      >
        <ErrorBoundary fallback={() => <BrokenFallback />}>
          <BrokenPanel />
        </ErrorBoundary>
      </ErrorBoundary>
    );
  }

  const host = document.createElement("div");
  document.body.appendChild(host);
  createRoot(host).render(<ErrorBoundaryDemo />);

  await new Promise<void>((resolve) => setTimeout(resolve, 0));

  assert.equal(
    queryDeep<HTMLParagraphElement>(host, '[role="alert"]')?.textContent,
    "fallback failed",
  );
});

test("renders portal content in its target and cleans it up on unmount", () => {
  const host = document.createElement("div");
  const target = document.createElement("div");

  document.body.append(host, target);

  function PortalApp() {
    return (
      <Portal target={target}>
        <p>Rendered elsewhere</p>
      </Portal>
    );
  }

  const root = createRoot(host);
  root.render(<PortalApp />);

  assert.equal(target.querySelector("p")?.textContent, "Rendered elsewhere");
  assert.equal(host.querySelector("p"), null);

  root.render(null);

  assert.equal(target.querySelector("p"), null);
  assert.equal(target.querySelector("[data-relement-portal]"), null);

  host.remove();
  target.remove();
});

test("preserves a portal when its target is the root host", () => {
  const host = document.createElement("div");
  document.body.append(host);

  const root = createRoot(host);

  root.render(
    <Portal target={host}>
      <p>Portal content</p>
    </Portal>,
  );

  assert.equal(host.querySelector("p")?.textContent, "Portal content");
  assert.equal(host.querySelectorAll("[data-relement-portal]").length, 1);

  root.render(
    <Portal target={host}>
      <p>Portal content updated</p>
    </Portal>,
  );

  assert.equal(host.querySelector("p")?.textContent, "Portal content updated");
  assert.equal(host.querySelectorAll("[data-relement-portal]").length, 1);

  root.render(null);

  assert.equal(host.querySelector("p"), null);
  assert.equal(host.querySelector("[data-relement-portal]"), null);

  host.remove();
});
