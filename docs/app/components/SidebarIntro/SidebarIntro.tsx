import { h } from "../../../../src/index.js";
import styles from "./styles.module.css";

export function SidebarIntro() {
  return (
    <div className={styles.sidebarIntro}>
      <span className={styles.sidebarKicker}>Explore</span>
      <p>Everything you need to build with Relement.</p>
    </div>
  );
}
