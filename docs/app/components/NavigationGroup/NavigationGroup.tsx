import { h } from "../../../../src/index.js";
import type { DocTopic } from "../../docs-content.js";
import styles from "./styles.module.css";

type NavigationGroupProps = {
  activeId: string;
  group: string;
  topics: readonly DocTopic[];
  onSelect: (id: string) => void;
};

export function NavigationGroup({
  activeId,
  group,
  topics,
  onSelect,
}: NavigationGroupProps) {
  return (
    <section className={styles.navGroup}>
      <p className={styles.groupTitle}>{group}</p>
      {topics.map((topic) => (
        <a
          className={`${styles.navItem} ${
            activeId === topic.id ? styles.navItemActive : ""
          }`}
          href={`#${topic.id}`}
          aria-current={activeId === topic.id ? "page" : undefined}
          key={topic.id}
          onClick={(event: Event) => {
            event.preventDefault();
            onSelect(topic.id);
          }}
        >
          {topic.title}
        </a>
      ))}
    </section>
  );
}
