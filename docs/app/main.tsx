import { createRoot, h } from "../../src/index.js";
import { App } from "./components/App/index.js";
import { topics } from "./docs-content.js";

const host = document.querySelector("#root");

if (!(host instanceof HTMLElement)) {
  throw new Error('Root element "#root" was not found.');
}

const rootElement = host;

function getAppShadowRoot(): ShadowRoot {
  const appHost = rootElement.querySelector("r-app");

  if (!(appHost instanceof HTMLElement) || !appHost.shadowRoot) {
    throw new Error("The documentation app shadow root was not created.");
  }

  return appHost.shadowRoot;
}

function scrollToTopic(topicId: string): void {
  const target = getAppShadowRoot().getElementById(topicId);

  if (!(target instanceof HTMLElement)) {
    throw new Error(`Documentation topic "${topicId}" was not found.`);
  }

  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";

  target.scrollIntoView({ behavior, block: "start" });
}

function syncTopicFromLocation(): void {
  const requestedId = window.location.hash.slice(1);
  const topicId = topics.some((topic) => topic.id === requestedId)
    ? requestedId
    : "overview";

  scrollToTopic(topicId);
}

createRoot(rootElement).render(<App onNavigate={scrollToTopic} />);

window.addEventListener("hashchange", syncTopicFromLocation);
window.addEventListener("popstate", syncTopicFromLocation);

const appShadowRoot = getAppShadowRoot();
const topicSections = Array.from(
  appShadowRoot.querySelectorAll<HTMLElement>("[data-topic-id]"),
);

if (topicSections.length === 0) {
  throw new Error("No documentation topics were rendered.");
}

let activeTopicUpdateScheduled = false;

function updateActiveTopic(): void {
  const marker = window.innerHeight * 0.3;
  const activeSection =
    topicSections
      .filter((section) => section.getBoundingClientRect().top <= marker)
      .at(-1) ?? topicSections[0];
  const topicId = activeSection.dataset.topicId;

  if (topicId) {
    window.dispatchEvent(
      new CustomEvent("docs-active-topic", { detail: topicId }),
    );
  }
}

function scheduleActiveTopicUpdate(): void {
  if (activeTopicUpdateScheduled) return;

  activeTopicUpdateScheduled = true;
  requestAnimationFrame(() => {
    activeTopicUpdateScheduled = false;
    updateActiveTopic();
  });
}

window.addEventListener("scroll", scheduleActiveTopicUpdate, {
  passive: true,
});
scheduleActiveTopicUpdate();

if (window.location.hash) {
  requestAnimationFrame(syncTopicFromLocation);
}
