import { defineElement } from "../../src/index.js";

defineElement("x-greeting", () => {
  const message = document.createElement("p");
  message.textContent = "Hello, Relement!";
  return message;
});
