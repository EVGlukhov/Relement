import { h } from "../../../../src/index.js";
import type { DocTopic } from "../../docs-content.js";
import styles from "./styles.module.css";
import { NavigationGroup } from "../NavigationGroup/index.js";
import { SearchField } from "../SearchField/index.js";
import { SidebarFooter } from "../SidebarFooter/index.js";
import { SidebarIntro } from "../SidebarIntro/index.js";

type DocSidebarProps = {
  activeId: string;
  groups: readonly string[];
  menuOpen: boolean;
  query: string;
  topics: readonly DocTopic[];
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
};

export function DocSidebar({
  activeId,
  groups,
  menuOpen,
  query,
  topics,
  onQueryChange,
  onSelect,
}: DocSidebarProps) {
  const normalizedQuery = query.trim().toLowerCase();
  const visibleTopics = topics.filter((topic) =>
    `${topic.group} ${topic.title} ${topic.lead}`
      .toLowerCase()
      .includes(normalizedQuery),
  );

  return (
    <aside
      className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}
    >
      <SidebarIntro />
      <SearchField value={query} onChange={onQueryChange} />

      <nav aria-label="Documentation">
        {groups.map((group) => {
          const groupTopics = visibleTopics.filter(
            (topic) => topic.group === group,
          );

          if (groupTopics.length === 0) return null;

          return (
            <NavigationGroup
              activeId={activeId}
              group={group}
              topics={groupTopics}
              key={group}
              onSelect={onSelect}
            />
          );
        })}
        {visibleTopics.length === 0 && (
          <p className={styles.noResults}>No guides match your search.</p>
        )}
      </nav>
      <SidebarFooter />
    </aside>
  );
}
