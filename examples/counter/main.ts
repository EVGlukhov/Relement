import { defineElement } from "../../src/index.js";

defineElement("x-counter", ({ useState }) => {
  const [count, setCount] = useState(0);
  const button = document.createElement("button");

  button.textContent = `Count: ${count}`;
  button.addEventListener("click", () => setCount(count + 1));

  return button;
});
