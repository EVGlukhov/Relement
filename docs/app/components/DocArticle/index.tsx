import { h } from "../../../../src/index.js";
import type { DocTopic } from "../../docs-content.js";
import styles from "./styles.module.css";
import { ArticleHeader } from "../ArticleHeader/index.js";
import { CodeExample } from "../CodeExample/index.js";
import { OverviewHighlights } from "../OverviewHighlights/index.js";
import { TopicSupplement } from "../TopicSupplement/index.js";
import { TopicNotes } from "../TopicNotes/index.js";

type DocArticleProps = {
  topic: DocTopic;
};

export function DocArticle({ topic }: DocArticleProps) {
  return (
    <article className={styles.article}>
      <ArticleHeader topic={topic} />

      {topic.example && (
        <CodeExample code={topic.example} />
      )}

      {topic.notes && <TopicNotes notes={topic.notes} />}

      {topic.id === "overview" && <OverviewHighlights />}
      <TopicSupplement topicId={topic.id} />
    </article>
  );
}
