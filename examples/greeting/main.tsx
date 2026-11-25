import appStyles from "./app.module.css";
import greetingStyles from "./greeting.module.css";
import counterStyles from "./counter.module.css";

import { createRoot, h, useState } from "../../src/index.js";

type GreetingProps = {
  name: string | null;
};

function Greeting({ name }: GreetingProps) {
  return <p className={greetingStyles.greeting}>Hello, {name}</p>;
}

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button
      className={counterStyles.button}
      onClick={() => setCount((value) => value + 1)}
    >
      Count: {count}
    </button>
  );
}

function App() {
  return (
    <main className={appStyles.app}>
      <h1 className={appStyles.title}>Relement greeting example</h1>
      <Greeting name="Evgeny" />
      <Counter />
    </main>
  );
}

const host = document.querySelector("#root");

if (!(host instanceof HTMLElement)) {
  throw new Error('Root element "#root" was not found.');
}

createRoot(host).render(<App />);
