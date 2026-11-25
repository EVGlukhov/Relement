# Relement

A lightweight JavaScript UI framework built on native Custom Elements.

> The npm package is not published yet. The full documentation site is
> available at [Relement Docs](https://evglukhov.github.io/Relement/).

## TypeScript components

Configure TypeScript to use Relement's JSX factory:

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment"
  }
}
```

Import `h` in each TSX file and declare component props with a TypeScript
type or interface:

```tsx
import { h } from "@jgluhov/relement";

type GreetingProps = {
  name: string;
};

function Greeting({ name }: GreetingProps) {
  return <p>Hello, {name}</p>;
}

const greeting = <Greeting name="Ada" />;
```

TypeScript checks component props in JSX and direct `h()` calls. For example,
these calls are type errors because `name` must be a string and is required:

```tsx
// @ts-expect-error name must be a string
const invalidName = <Greeting name={42} />;

// @ts-expect-error name is required
const missingName = <Greeting />;
```

The special `key` attribute is accepted separately from declared component
props:

```tsx
const keyedGreeting = <Greeting key="ada" name="Ada" />;
```

## Children

Declare a `children` prop to type-check JSX children. Make it optional if the
component can be used without children:

```tsx
import { h, type VNodeChild } from "@jgluhov/relement";

type PanelProps = {
  title: string;
  children: VNodeChild;
};

function Panel({ title, children }: PanelProps) {
  return (
    <section>
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

const panel = (
  <Panel title="Status">
    <span>Ready</span>
  </Panel>
);
```

Use `children?: VNodeChild` if the component can be used without children. The
JSX child type is checked against the declared `children` prop.
