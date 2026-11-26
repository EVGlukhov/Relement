import type { FunctionComponent } from "./vdom.js";

type HotRecord = {
  current: FunctionComponent;
  proxy: FunctionComponent;
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
    existing.current = implementation;
    return existing.proxy as TComponent;
  }

  let record: HotRecord;

  const proxy: FunctionComponent = (props) => record.current(props);

  record = { current: implementation, proxy };
  records.set(id, record);
  componentIds.set(proxy, id);

  return proxy as TComponent;
}

export function getHotComponentId(
  component: FunctionComponent,
): string | undefined {
  return componentIds.get(component);
}
