import { createRoot, defineElement, h, useState } from "../../src/index.js";

type GreetingProps = {
  name: string | null;
};

function Greeting({ name }: GreetingProps) {
  return <p>Hello, {name}</p>;
}

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount((value) => value + 1)}>
      Count: {count}
    </button>
  );
}

function App() {
  return (
    <main>
      <h1>Relement greeting example</h1>
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
