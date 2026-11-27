import type { VNodeChild } from "./core/vdom.js";

export type ComponentProps = Record<string, string | null>;
export type ComponentRender<TProps extends object = ComponentProps> = (
  props: TProps,
) => VNodeChild;
