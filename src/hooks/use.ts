import { getActiveHooks } from "./dispatcher.js";

type PromiseState<T> =
  | { status: "pending"; promise: Promise<T> }
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; error: unknown };

const promiseStates = new WeakMap<object, PromiseState<unknown>>();

export function use<T>(promiseLike: PromiseLike<T>): T {
  getActiveHooks();

  let state = promiseStates.get(promiseLike) as PromiseState<T> | undefined;

  if (!state) {
    const promise = Promise.resolve(promiseLike);
    state = { status: "pending", promise };
    promiseStates.set(promiseLike, state);

    void promise.then(
      (value) => {
        promiseStates.set(promiseLike, { status: "fulfilled", value });
      },
      (error: unknown) => {
        promiseStates.set(promiseLike, { status: "rejected", error });
      },
    );
  }

  if (state.status === "pending") throw state.promise;
  if (state.status === "rejected") throw state.error;

  return state.value;
}
