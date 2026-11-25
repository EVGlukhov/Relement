import { h } from "../../../../src/index.js";
import styles from "./styles.module.css";

const highlights = [
  {
    number: "01",
    title: "Typed by default",
    description: "Props and children are checked in TSX.",
    icon: "⌘",
  },
  {
    number: "02",
    title: "Native foundations",
    description: "Custom Elements and Shadow DOM at the core.",
    icon: "◈",
  },
  {
    number: "03",
    title: "Small hooks API",
    description: "State, effects, and stable mutable refs.",
    icon: "↗",
  },
];

export function OverviewHighlights() {
  return (
    <section className={styles.highlights} aria-label="Framework features">
      <div className={styles.highlightsHeading}>
        <span>Why Relement</span>
        <span>Small surface. Native power.</span>
      </div>
      <div className={styles.overviewGrid}>
        {highlights.map((highlight) => (
          <article className={styles.highlightCard} key={highlight.number}>
            <div className={styles.highlightTop}>
              <span className={styles.highlightIcon} aria-hidden="true">
                {highlight.icon}
              </span>
              <span className={styles.highlightNumber}>{highlight.number}</span>
            </div>
            <h2>{highlight.title}</h2>
            <p>{highlight.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
