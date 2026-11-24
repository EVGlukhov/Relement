export type ComponentProps = Record<string, string | null>;
export type ComponentRender<TProps extends ComponentProps = ComponentProps> = (
  props: TProps,
) => Node;
export type ComponentFactory = (
  props: Record<string, unknown>,
  children: Node[],
) => Node;
