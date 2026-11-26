# Relement

A lightweight TypeScript UI framework built on native Custom Elements, function
components, and hooks.

[Documentation](https://evglukhov.github.io/Relement/) ·
[Quick start](https://evglukhov.github.io/Relement/#quick-start) ·
[API reference](https://evglukhov.github.io/Relement/#api) ·
[GitHub](https://github.com/EVGlukhov/Relement)

## Learn Relement

- [Quick start](https://evglukhov.github.io/Relement/#quick-start)
- [TypeScript and automatic JSX](https://evglukhov.github.io/Relement/#typescript)
- [Function components](https://evglukhov.github.io/Relement/#components)
- [Props and children](https://evglukhov.github.io/Relement/#props-children)
- [Rendering and fragments](https://evglukhov.github.io/Relement/#rendering)
- [State, effects, and refs](https://evglukhov.github.io/Relement/#state)
- [Keys and reconciliation](https://evglukhov.github.io/Relement/#keys)
- [Custom Elements and Shadow DOM](https://evglukhov.github.io/Relement/#custom-elements)
- [CSS Modules](https://evglukhov.github.io/Relement/#css-modules)
- [Public API](https://evglukhov.github.io/Relement/#api)

## TypeScript and JSX

Relement supports TypeScript's automatic JSX runtime:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@jgluhov/relement"
  }
}
```

```tsx
type GreetingProps = {
  name: string;
};

function Greeting({ name }: GreetingProps) {
  return <p>Hello, {name}</p>;
}
```

The JSX runtime is imported automatically; components do not need to import
`h`.

## Project status

The npm package is private and has not been published yet. To explore the
current implementation locally:

```sh
git clone https://github.com/EVGlukhov/Relement.git
cd Relement
npm install
npm test
```
