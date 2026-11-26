import { Window } from "happy-dom";
import assert from "node:assert/strict";
import test from "node:test";

const dom = new Window();

Object.assign(globalThis, {
  document: dom.document,
  HTMLElement: dom.HTMLElement,
  customElements: dom.customElements,
  Node: dom.Node,
});

const { defineElement, useState, useEffect, useRef } =
  await import("../src/index.js");

const noop = (): void => {};

test("keeps state separate between element instances", () => {
  defineElement("x-counter-test", () => {
    const [count, setCount] = useState(0);
    const button = document.createElement("button");

    button.textContent = String(count);
    button.addEventListener("click", () => setCount(count + 1));

    return button;
  });

  const first = document.createElement("x-counter-test");
  const second = document.createElement("x-counter-test");
  document.body.replaceChildren(first, second);

  assert.equal(first.shadowRoot?.textContent, "0");
  assert.equal(second.shadowRoot?.textContent, "0");

  const button = first.shadowRoot?.querySelector("button");
  assert.ok(button);
  button.click();

  assert.equal(first.shadowRoot?.textContent, "1");
  assert.equal(second.shadowRoot?.textContent, "0");
});

test("throws when the hook count changes between renders", () => {
  let revealExtraState = noop;

  defineElement("x-hook-count-test", () => {
    const [revealed, setRevealed] = useState(false);
    revealExtraState = () => setRevealed(true);

    if (revealed) {
      useState(0);
    }

    return document.createElement("span");
  });

  const element = document.createElement("x-hook-count-test");
  document.body.replaceChildren(element);

  assert.throws(revealExtraState, /number of hooks changed/);
});

test("runs effects when dependencies change and cleans up on disconnect", () => {
  const events: string[] = [];
  let setCount: (value: number) => void = noop;
  let setUnrelated: (value: number) => void = noop;

  defineElement("x-effect-test", () => {
    const [count, updateCount] = useState(0);
    setCount = updateCount;

    const [unrelated, updateUnrelated] = useState(0);
    setUnrelated = updateUnrelated;

    useEffect(() => {
      events.push(`effect:${count}`);

      return () => {
        events.push(`cleanup:${count}`);
      };
    }, [count]);

    const span = document.createElement("span");
    span.textContent = String(unrelated);
    return span;
  });

  const element = document.createElement("x-effect-test");
  document.body.replaceChildren(element);

  assert.deepEqual(events, ["effect:0"]);

  setUnrelated(1);
  assert.deepEqual(events, ["effect:0"]);

  setCount(1);
  assert.deepEqual(events, ["effect:0", "cleanup:0", "effect:1"]);

  document.body.removeChild(element);
  assert.deepEqual(events, ["effect:0", "cleanup:0", "effect:1", "cleanup:1"]);

  document.body.appendChild(element);
  assert.deepEqual(events, [
    "effect:0",
    "cleanup:0",
    "effect:1",
    "cleanup:1",
    "effect:1",
  ]);
});

test("runs effects after every render when dependencies are omitted", () => {
  const events: string[] = [];
  let increment = noop;

  defineElement("x-effect-every-render-test", () => {
    const [count, setCount] = useState(0);
    increment = () => setCount((value) => value + 1);

    useEffect(() => {
      events.push(`effect:${count}`);

      return () => {
        events.push(`cleanup:${count}`);
      };
    });

    return document.createElement("span");
  });

  const element = document.createElement("x-effect-every-render-test");
  document.body.appendChild(element);

  assert.deepEqual(events, ["effect:0"]);

  increment();

  assert.deepEqual(events, ["effect:0", "cleanup:0", "effect:1"]);
});

test("preserves a ref between renders without rerendering on mutation", () => {
  let savedRef: { current: number } | undefined;
  let forceRender = noop;

  defineElement("x-ref-test", () => {
    const ref = useRef(0);
    savedRef = ref;

    const [count, setCount] = useState(0);
    forceRender = () => setCount((value) => value + 1);

    const span = document.createElement("span");
    span.textContent = `${count}:${ref.current}`;
    return span;
  });

  const element = document.createElement("x-ref-test");
  document.body.appendChild(element);

  const firstRef = savedRef;
  assert.ok(firstRef);
  assert.equal(element.shadowRoot?.textContent, "0:0");

  firstRef.current = 5;

  assert.equal(element.shadowRoot?.textContent, "0:0");

  forceRender();

  assert.equal(element.shadowRoot?.textContent, "1:5");
  assert.strictEqual(savedRef, firstRef);
});

test("throws when hook type changes at the same position", () => {
  let changeHookType = noop;

  defineElement("x-hook-type-test", () => {
    const [usesState, setUsesState] = useState(true);

    changeHookType = () => setUsesState(false);

    if (usesState) {
      useState(0);
    } else {
      useRef(0);
    }

    return document.createElement("span");
  });

  const element = document.createElement("x-hook-type-test");
  document.body.appendChild(element);

  assert.throws(changeHookType, /Hook type changed at this position/);
});

test("renders defineElement inside an open shadow root", () => {
  defineElement("x-shadow-test", () => {
    const paragraph = document.createElement("p");
    paragraph.textContent = "Inside";
    return paragraph;
  });

  const element = document.createElement("x-shadow-test");
  document.body.replaceChildren(element);

  assert.ok(element.shadowRoot);
  assert.equal(element.shadowRoot.querySelector("p")?.textContent, "Inside");
  assert.equal(element.querySelector("p"), null);
});
