import assert from "node:assert/strict";
import test from "node:test";
import { h } from "../src/jsx/jsx.js";

test("type-checks props passed to function components with h", () => {
  function TypedLabel({ text }: { text: string }) {
    return <span>{text}</span>;
  }

  h(TypedLabel, { text: "Hello" });

  // @ts-expect-error text must be a string
  h(TypedLabel, { text: 123 });

  // @ts-expect-error text is required
  h(TypedLabel, {});

  // @ts-expect-error required text cannot be omitted
  h(TypedLabel, null);
});

test("type-checks function component props in JSX", () => {
  function TypedLabel({ text }: { text: string }) {
    return <span>{text}</span>;
  }

  function TypedPanel({ children }: { children: string }) {
    return <div>{children}</div>;
  }

  const label = <TypedLabel text="Hello" />;
  const keyedLabel = <TypedLabel key="label" text="Hello" />;
  const panel = <TypedPanel>Content</TypedPanel>;

  // @ts-expect-error text must be a string
  const invalidText = <TypedLabel text={123} />;

  // @ts-expect-error text is required
  const missingText = <TypedLabel />;

  // @ts-expect-error children must be a string
  const invalidChildren = <TypedPanel>{123}</TypedPanel>;

  // @ts-expect-error children are required
  const missingChildren = <TypedPanel />;

  assert.ok(label);
  assert.ok(keyedLabel);
  assert.ok(panel);
  assert.ok(invalidText);
  assert.ok(missingText);
  assert.ok(invalidChildren);
  assert.ok(missingChildren);
});
