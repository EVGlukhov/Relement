import type { FunctionComponent } from "./core/vdom.js";

type HotRecord = {
  current: FunctionComponent;
  proxy: FunctionComponent;
  subscribers: Set<() => void>;
};

const records = new Map<string, HotRecord>();
const componentIds = new WeakMap<FunctionComponent, string>();

export function hotComponent<TComponent extends FunctionComponent>(
  id: string,
  implementation: TComponent,
): TComponent {
  if (!id.trim()) {
    throw new TypeError("A hot component ID must not be empty.");
  }

  const existing = records.get(id);

  if (existing) {
    const changed = existing.current !== implementation;
    existing.current = implementation;

    if (changed) {
      for (const update of existing.subscribers) {
        update();
      }
    }

    return existing.proxy as TComponent;
  }

  let record: HotRecord;

  const proxy: FunctionComponent = (props) => record.current(props);

  record = { current: implementation, proxy, subscribers: new Set() };
  records.set(id, record);
  componentIds.set(proxy, id);

  return proxy as TComponent;
}

export function getHotComponentId(
  component: FunctionComponent,
): string | undefined {
  return componentIds.get(component);
}

export function subscribeToHotComponent(
  id: string,
  update: () => void,
): () => void {
  const record = records.get(id);

  if (!record) {
    throw new Error(`Hot component "${id}" is not registered.`);
  }

  record.subscribers.add(update);

  return () => {
    record.subscribers.delete(update);
  };
}
