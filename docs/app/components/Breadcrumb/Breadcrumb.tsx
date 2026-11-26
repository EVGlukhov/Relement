import { useState } from "../../../../src/index.js";
import styles from "./styles.module.css";

type BreadcrumbProps = {
  group: string;
};

export function Breadcrumb({ group }: BreadcrumbProps) {
  const [count, setCount] = useState(0);
  return (
    <div className={styles.breadcrumb}>
      <button onClick={() => setCount((current) => current + 1)}>
        {count}
      </button>
      <span className={styles.breadcrumbDot} aria-hidden="true" />
      {group}
      <span className={styles.breadcrumbDivider} aria-hidden="true">
        /
      </span>
      Documentation
    </div>
  );
}
