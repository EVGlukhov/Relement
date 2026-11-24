import { createRoot, defineElement, h } from "../../src/index.js";

type GreetingProps = {
  name: string | null;
};

defineElement<GreetingProps>(
  "x-greeting",
  (props) => <p>Hello, {props.name ?? "Guest"}</p>,
  ["name"],
);

const host = document.querySelector("#root");

if (!(host instanceof HTMLElement)) {
  throw new Error('Root element "#root" was not found.');
}

createRoot(host).render(
  <main>
    <h1>Relement greeting example</h1>
    <x-greeting name="Evgeny" />
  </main>,
);
