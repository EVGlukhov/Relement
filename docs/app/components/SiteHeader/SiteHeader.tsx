import styles from "./styles.module.css";

type SiteHeaderProps = {
  menuOpen: boolean;
  onHome: () => void;
  onToggleMenu: () => void;
};

export function SiteHeader({
  menuOpen,
  onHome,
  onToggleMenu,
}: SiteHeaderProps) {
  return (
    <header className={styles.topbar}>
      <button className={styles.brand} type="button" onClick={onHome}>
        <span className={styles.brandMark} aria-hidden="true">
          R
        </span>
        <span>Relement</span>
      </button>
      <div className={styles.topbarLinks}>
        <span className={styles.version}>Documentation · v0.1</span>
        <a
          href="https://github.com/EVGlukhov/Relement"
          target="_blank"
          rel="noreferrer"
        >
          GitHub <span aria-hidden="true">↗</span>
        </a>
      </div>
      <button
        className={styles.menuToggle}
        type="button"
        aria-label="Toggle documentation navigation"
        aria-expanded={String(menuOpen)}
        onClick={onToggleMenu}
      >
        <span className={styles.menuIcon} aria-hidden="true">
          {menuOpen ? "×" : "☰"}
        </span>
        <span>{menuOpen ? "Close" : "Menu"}</span>
      </button>
    </header>
  );
}
