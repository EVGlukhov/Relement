import { h, useEffect, useState } from "../../../../src/index.js";
import { groups, topics } from "../../docs-content.js";
import styles from "./styles.module.css";
import { DocArticle } from "../DocArticle/index.js";
import { DocSidebar } from "../DocSidebar/index.js";
import { SiteHeader } from "../SiteHeader/index.js";

function getTopicFromHash(): string {
  const topicId = window.location.hash.slice(1);
  return topics.some((topic) => topic.id === topicId) ? topicId : "overview";
}

type AppProps = {
  onNavigate: (id: string) => void;
};

export function App({ onNavigate }: AppProps) {
  const [activeId, setActiveId] = useState(getTopicFromHash());
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function syncTopicFromLocation(): void {
      setActiveId(getTopicFromHash());
      setMenuOpen(false);
    }

    function syncActiveTopic(event: Event): void {
      const topicId = (event as CustomEvent<string>).detail;

      if (topics.some((topic) => topic.id === topicId)) {
        setActiveId(topicId);
      }
    }

    window.addEventListener("hashchange", syncTopicFromLocation);
    window.addEventListener("popstate", syncTopicFromLocation);
    window.addEventListener("docs-active-topic", syncActiveTopic);

    return () => {
      window.removeEventListener("hashchange", syncTopicFromLocation);
      window.removeEventListener("popstate", syncTopicFromLocation);
      window.removeEventListener("docs-active-topic", syncActiveTopic);
    };
  }, []);

  function selectTopic(id: string): void {
    if (id !== activeId) {
      window.history.pushState(null, "", `#${id}`);
      setActiveId(id);
    }

    onNavigate(id);
    setMenuOpen(false);
  }

  return (
    <div className={styles.app}>
      <SiteHeader
        menuOpen={menuOpen}
        onHome={() => selectTopic("overview")}
        onToggleMenu={() => setMenuOpen((open) => !open)}
      />
      <div className={styles.layout}>
        <DocSidebar
          activeId={activeId}
          groups={groups}
          menuOpen={menuOpen}
          query={query}
          topics={topics}
          onQueryChange={setQuery}
          onSelect={selectTopic}
        />
        <main className={styles.content}>
          {topics.map((topic) => (
            <section
              className={styles.topicSection}
              id={topic.id}
              data-topic-id={topic.id}
              aria-label={topic.title}
              key={topic.id}
            >
              <DocArticle topic={topic} />
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
