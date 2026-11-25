import { h } from "../../../../src/index.js";
import styles from "./styles.module.css";

export function HeroMeta() {
  return (
    <div className={styles.heroMeta}>
      <span>TypeScript first</span>
      <span>Web standards</span>
      <span>Zero virtual DOM</span>
    </div>
  );
}
