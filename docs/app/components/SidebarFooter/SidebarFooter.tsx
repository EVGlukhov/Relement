import styles from "./styles.module.css";

export function SidebarFooter() {
  return (
    <div className={styles.sidebarFooter}>
      <span className={styles.statusDot} aria-hidden="true" />
      Early access · v0.1
    </div>
  );
}
