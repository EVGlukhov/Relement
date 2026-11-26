import { createRoot } from "@jgluhov/relement";
import { App } from "./App";
import "./styles.css";

const host = document.querySelector("#root");

if (!(host instanceof HTMLElement)) {
  throw new Error('Root element "#root" was not found.');
}

createRoot(host).render(<App />);
