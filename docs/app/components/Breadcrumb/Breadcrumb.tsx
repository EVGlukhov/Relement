import { h } from "../../../../src/index.js";
import styles from "./styles.module.css";

type BreadcrumbProps = {
  group: string;
};

export function Breadcrumb({ group }: BreadcrumbProps) {
  return (
    <div className={styles.breadcrumb}>
      <span className={styles.breadcrumbDot} aria-hidden="true" />
      {group}
      <span className={styles.breadcrumbDivider} aria-hidden="true">
        /
      </span>
      Documentation
    </div>
  );
}
