import styles from "./styles.module.css";

type TopicSupplementProps = {
  topicId: string;
};

export function TopicSupplement({ topicId }: TopicSupplementProps) {
  if (topicId === "quick-start") {
    return (
      <p className={styles.callout}>
        <strong>Before you begin</strong>
        The package is private and is not available from npm yet. The scoped
        import examples will work after the first public release.
      </p>
    );
  }

  if (topicId === "scope") {
    return (
      <a
        className={styles.sourceLink}
        href="https://github.com/EVGlukhov/Relement"
        target="_blank"
        rel="noreferrer"
      >
        Explore the source and report an issue <span aria-hidden="true">↗</span>
      </a>
    );
  }

  return null;
}
