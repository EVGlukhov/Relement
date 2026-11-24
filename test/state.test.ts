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

test("throws when the hook count changes between renders", () => {
  let revealExtraState = (): void => {};

  defineElement("x-hook-count-test", ({ useState }) => {
    const [revealed, setRevealed] = useState(false);
    revealExtraState = () => setRevealed(true);

    if (revealed) {
      useState(0);
    }

    return document.createElement("span");
  });

  const element = document.createElement("x-hook-count-test");
  document.body.replaceChildren(element);

  assert.throws(revealExtraState, /number of useState calls changed/);
});

test("runs effects when dependencies change and cleans up on disconnect", () => {
  const events: string[] = [];
  let setCount: (value: number) => void = () => {};
  let setUnrelated: (value: number) => void = () => {};

  defineElement("x-effect-test", ({ useState, useEffect }) => {
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
});
