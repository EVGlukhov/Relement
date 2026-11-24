import { defineElement, useState } from "../../src/index.js";

defineElement("x-counter", () => {
  const [count, setCount] = useState(0);
  const button = document.createElement("button");

  button.textContent = `Count: ${count}`;
  button.addEventListener("click", () => {
    setCount((current) => current + 1);
    setCount((current) => current + 1);
  });

  return button;
});
