export interface Resource<T> {
  read(): T;
}

type ResourceState<T> =
  | { status: "idle" }
  | { status: "pending"; promise: Promise<T> }
  | { status: "resolved"; value: T }
  | { status: "rejected"; error: unknown };

export function createResource<T>(load: () => PromiseLike<T>): Resource<T> {
  let state: ResourceState<T> = { status: "idle" };

  function read(): T {
    if (state.status === "idle") {
      let promise: Promise<T>;

      try {
        promise = Promise.resolve(load());
      } catch (error) {
        state = { status: "rejected", error };
        throw error;
      }

      state = { status: "pending", promise };

      void promise.then(
        (value) => {
          state = { status: "resolved", value };
        },
        (error: unknown) => {
          state = { status: "rejected", error };
        },
      );
    }

    if (state.status === "pending") {
      throw state.promise;
    }

    if (state.status === "rejected") {
      throw state.error;
    }

    if (state.status === "resolved") {
      return state.value;
    }

    throw new Error("Resource did not start loading.");
  }

  return { read };
}
