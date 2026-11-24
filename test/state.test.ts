import { Window } from "happy-dom";
import assert from "node:assert/strict";
import test from "node:test";

const dom = new Window();

Object.assign(globalThis, {
  document: dom.document,
  HTMLElement: dom.HTMLElement,
  customElements: dom.customElements,
});

const { defineElement, useState, useEffect } = await import("../src/index.js");

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

  assert.equal(first.textContent, "0");
  assert.equal(second.textContent, "0");

  const button = first.querySelector("button");
  assert.ok(button);
  button.click();

  assert.equal(first.textContent, "1");
  assert.equal(second.textContent, "0");
});

test("throws when the hook count changes between renders", () => {
  let revealExtraState = (): void => {};

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
  let setCount: (value: number) => void = () => {};
  let setUnrelated: (value: number) => void = () => {};

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
  let increment = (): void => {};

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
