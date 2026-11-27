import test from "node:test";
import { createResource } from "../src/resource.js";
import assert from "node:assert/strict";

test("loads once and caches the resolved value", async () => {
  let loadCount = 0;
  let resolve: ((value: string) => void) | undefined;
  let pending: Promise<unknown> | undefined;

  const resource = createResource(
    () =>
      new Promise<string>((resolvePromise) => {
        loadCount += 1;
        resolve = resolvePromise;
      }),
  );

  assert.throws(
    () => resource.read(),
    (error) => {
      if (!(error instanceof Promise)) return false;
      pending = error;
      return true;
    },
  );

  assert.throws(
    () => resource.read(),
    (error) => error === pending,
  );
  assert.equal(loadCount, 1);

  assert.ok(resolve);
  assert.ok(pending);
  resolve("ready");
  await pending;

  assert.equal(resource.read(), "ready");
  assert.equal(resource.read(), "ready");
});

test("rethrows a rejected load error", async () => {
  const error = new Error("load failed");
  const resource = createResource(() => Promise.reject(error));
  let pending: Promise<unknown> | undefined;

  assert.throws(
    () => resource.read(),
    (caught) => {
      if (!(caught instanceof Promise)) return false;
      pending = caught;
      return true;
    },
  );

  assert.ok(pending);
  await assert.rejects(pending, (caught) => caught === error);
  assert.throws(
    () => resource.read(),
    (caught) => caught === error,
  );
});

test("caches a synchronous loader error", () => {
  const error = new Error("loader failed");
  const resource = createResource<string>(() => {
    throw error;
  });

  assert.throws(
    () => resource.read(),
    (caught) => caught === error,
  );
  assert.throws(
    () => resource.read(),
    (caught) => caught === error,
  );
});
