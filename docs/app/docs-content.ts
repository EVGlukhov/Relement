export type DocTopic = {
  id: string;
  group: string;
  title: string;
  lead: string;
  example?: string;
  notes?: readonly string[];
};

export const topics: readonly DocTopic[] = [
  {
    id: "overview",
    group: "Start",
    title: "Build interfaces close to the platform.",
    lead:
      "Relement is a lightweight TypeScript UI framework built on function components, hooks, native Custom Elements, and Shadow DOM.",
    notes: [
      "Write function components in TSX with checked component props.",
      "Keep local state with useState, synchronize effects with useEffect, and store mutable values with useRef.",
      "Use native Custom Elements and Shadow DOM as component boundaries.",
    ],
  },
  {
    id: "quick-start",
    group: "Start",
    title: "Quick start",
    lead:
      "Create a starter project with the Relement CLI, install its dependencies, and start the development server.",
    example: String.raw`npx @jgluhov/relement create my-app
cd my-app
npm install
npm run dev`,
    notes: [
      "To add Relement to an existing project, install it with npm install @jgluhov/relement.",
      "The scaffold includes TypeScript, the automatic JSX runtime, a starter component, and a Relement CLI config.",
    ],
  },
  {
    id: "typescript",
    group: "Start",
    title: "Configure TypeScript for TSX",
    lead:
      "Relement uses TypeScript's automatic JSX runtime. Configure the runtime once and use JSX without importing h in each TSX module.",
    example: String.raw`{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@jgluhov/relement"
  }
}`,
    notes: [
      "The automatic runtime imports jsx/jsxs and Fragment from @jgluhov/relement/jsx-runtime.",
    ],
  },
  {
    id: "components",
    group: "Build interfaces",
    title: "Function components",
    lead:
      "A function component receives one props object and returns a renderable child such as JSX, a fragment, text, a DOM node, or null.",
    example: String.raw`type GreetingProps = {
  name: string;
};

function Greeting({ name }: GreetingProps) {
  return <p>Hello, {name}</p>;
}

function App() {
  return <Greeting name="Ada" />;
}`,
    notes: [
      "Each function component is hosted by a named Custom Element with its own open Shadow Root.",
      "State belongs to a component instance, so separate instances keep independent state.",
    ],
  },
  {
    id: "props-children",
    group: "Build interfaces",
    title: "Props and children",
    lead:
      "Declare props with a TypeScript type or interface. JSX and direct h() calls check required props and value types.",
    example: String.raw`import type { VNodeChild } from "@jgluhov/relement";

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
    <strong>Ready</strong>
  </Panel>
);`,
    notes: [
      "Use children?: VNodeChild when children are optional.",
      "The special key attribute is accepted separately and is not passed as a component prop.",
    ],
  },
  {
    id: "rendering",
    group: "Build interfaces",
    title: "Rendering and fragments",
    lead:
      "createRoot(host).render(child) mounts a renderable child into an existing element. Arrays and fragments are flattened without wrapper elements.",
    example: String.raw`import { createRoot } from "@jgluhov/relement";

function Labels() {
  return (
    <>
      <span>First</span>
      <span>Second</span>
    </>
  );
}

createRoot(host).render(<Labels />);`,
    notes: [
      "The automatic JSX runtime handles fragments without importing Fragment.",
    ],
  },
  {
    id: "state",
    group: "Build interfaces",
    title: "State with useState",
    lead:
      "useState(initialValue) returns the current value and a setter. Pass a value or an updater function based on the previous state.",
    example: String.raw`import { useState } from "@jgluhov/relement";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount((previous) => previous + 1)}>
      Count: {count}
    </button>
  );
}`,
    notes: [
      "Calling the setter with a value equal to the current value according to Object.is does not request another render.",
    ],
  },
  {
    id: "effects",
    group: "Build interfaces",
    title: "Effects with useEffect",
    lead:
      "useEffect runs after rendering. Return a cleanup function to release resources before an effect runs again or when its component disconnects.",
    example: String.raw`useEffect(() => {
  const timer = window.setInterval(() => {
    setSeconds((value) => value + 1);
  }, 1000);

  return () => window.clearInterval(timer);
}, []);`,
    notes: [
      "An empty dependency list runs the effect once per connection.",
      "A dependency list reruns the effect when a dependency changes according to Object.is.",
      "Omitting the dependency list runs the effect after every render.",
    ],
  },
  {
    id: "refs",
    group: "Build interfaces",
    title: "Mutable values with useRef",
    lead:
      "useRef(initialValue) returns the same { current } object for the lifetime of a component instance. Changing current does not request a render.",
    example: String.raw`function ClickCounter() {
  const clicks = useRef(0);
  const [visibleCount, setVisibleCount] = useState(0);

  return (
    <button
      onClick={() => {
        clicks.current += 1;
        setVisibleCount(clicks.current);
      }}
    >
      Clicks: {visibleCount}
    </button>
  );
}`,
    notes: [
      "useRef is a mutable value container; it is not automatically attached to DOM elements.",
    ],
  },
  {
    id: "keys",
    group: "Build interfaces",
    title: "Keys and reconciliation",
    lead:
      "Relement reuses compatible sibling nodes by position. Add stable keys to dynamic lists so component instances keep their state when siblings move.",
    example: String.raw`{items.map((item) => (
  <TodoItem key={item.id} item={item} />
))}`,
    notes: [
      "Duplicate keys among siblings throw an error.",
      "Keys identify a sibling within its parent and are not passed as component props.",
    ],
  },
  {
    id: "dom-props",
    group: "Browser platform",
    title: "DOM props and events",
    lead:
      "Intrinsic elements support className, object-valued style props, event-handler props, and DOM properties such as value and checked.",
    example: String.raw`<input
  value={query}
  checked={enabled}
  onInput={(event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    setQuery(input.value);
  }}
/>

<button
  className="save-button"
  style={{ backgroundColor: "teal", color: "white" }}
  onClick={save}
>
  Save
</button>`,
    notes: [
      "Style values must be strings. Invalid style objects or non-string style values throw a TypeError.",
      "Changing a DOM event handler removes the previous listener before adding the new one.",
    ],
  },
  {
    id: "shadow-dom",
    group: "Browser platform",
    title: "Shadow DOM boundaries",
    lead:
      "Each function component renders inside an open Shadow Root on its generated Custom Element host. This isolates component styles and DOM queries.",
    example: String.raw`const app = document.querySelector("r-app");
const heading = app?.shadowRoot?.querySelector("h1");`,
    notes: [
      "The element passed to createRoot is the mount point. Nested function component hosts each own their Shadow Root.",
      "Styles must be declared within the component boundary or passed through inherited CSS custom properties.",
    ],
  },
  {
    id: "css-modules",
    group: "Browser platform",
    title: "CSS Modules",
    lead:
      "Import a .module.css file and use its class map with className. The Relement CLI transforms CSS Modules, generates scoped class names, and registers the styles for component Shadow Roots.",
    example: String.raw`import styles from "./counter.module.css";

function Counter() {
  return <button className={styles.button}>Count</button>;
}`,
    notes: [
      "The CLI handles CSS Modules during both relement dev and relement build.",
      "Component styles are injected into the Shadow Root when the component uses one of the module's classes.",
      "If you use another bundler, configure it to transform .module.css files and register their styles with Relement.",
    ],
  },
  {
    id: "custom-elements",
    group: "Browser platform",
    title: "Native Custom Elements",
    lead:
      "Use defineElement when a public HTML tag is useful. Observed attributes arrive as strings or null; parse values explicitly when needed.",
    example: String.raw`import { defineElement } from "@jgluhov/relement";

defineElement(
  "x-greeting",
  ({ name }: { name: string | null }) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = "Hello, " + (name ?? "there");
    return paragraph;
  },
  ["name"],
);`,
    notes: [
      "The registered element uses an open Shadow Root and supports Relement hooks inside its render callback.",
    ],
  },
  {
    id: "cli",
    group: "Tooling",
    title: "CLI commands",
    lead:
      "The relement executable scaffolds projects, runs a watched development server, builds production assets, and previews a production build.",
    example: String.raw`relement --help
relement create my-app
cd my-app
npm install
npm run dev
npm run build
npm run preview`,
    notes: [
      "create <project-name> accepts lowercase letters, numbers, and hyphens.",
      "dev builds the app, serves it on the configured port, watches project files, and reloads the page after changes.",
      "build writes optimized assets and index.html to dist/.",
      "preview requires a production build and serves dist/ at http://127.0.0.1:4173 without HMR.",
      "The generated project provides npm run dev, npm run build, and npm run preview scripts.",
    ],
  },
  {
    id: "cli-config",
    group: "Tooling",
    title: "Configure the CLI",
    lead:
      "The CLI loads relement.config.js from the current project directory. Configure the source entry, HTML file, and development port there.",
    example: String.raw`export default {
  base: "/",
  root: ".",
  html: "index.html",
  entry: "src/main.tsx",
  port: 3000,
};`,
    notes: [
      "root, html, entry, and port are required. html and entry are resolved relative to root.",
      "base is optional and defaults to /. For deployment under a subpath, use a leading and trailing slash, such as /docs/.",
      "port controls the development server. The preview server uses port 4173.",
    ],
  },
  {
    id: "api",
    group: "Reference",
    title: "Public API",
    lead: "The current public entry point exports these core helpers and types.",
    notes: [
      "createRoot(host) — mount and render a child.",
      "h(type, props, ...children) — create a typed JSX-compatible VNode.",
      "Fragment — group children without a DOM wrapper.",
      "useState(initialValue) — store state per component instance.",
      "useEffect(effect, dependencies?) — run effects and optional cleanup.",
      "useRef(initialValue) — keep a stable mutable value.",
      "defineElement(name, render, attributes?) — register a native Custom Element.",
      "VNodeChild — type for supported renderable children.",
    ],
  },
  {
    id: "scope",
    group: "Reference",
    title: "Current project scope",
    lead:
      "Relement is an early-stage framework, not a React compatibility layer. These guides describe features implemented in this repository today.",
    notes: [
      "Context, reducers, memoization, routing, server-side rendering, and automatic DOM refs are not currently implemented.",
    ],
  },
];

export const groups = [
  "Start",
  "Build interfaces",
  "Browser platform",
  "Tooling",
  "Reference",
] as const;
