import { h } from "../../../../src/index.js";
import type { DocTopic } from "../../docs-content.js";
import styles from "./styles.module.css";
import { Breadcrumb } from "../Breadcrumb/index.js";
import { HeroMeta } from "../HeroMeta/index.js";

type ArticleHeaderProps = {
  topic: DocTopic;
};

export function ArticleHeader({ topic }: ArticleHeaderProps) {
  return (
    <header className={styles.articleHeader}>
      <Breadcrumb group={topic.group} />
      <h1>{topic.title}</h1>
      <p className={styles.lead}>{topic.lead}</p>
      {topic.id === "overview" && <HeroMeta />}
    </header>
  );
}
