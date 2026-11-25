import { h, useState } from "../../../../src/index.js";
import styles from "./styles.module.css";

type CodeExampleProps = {
  code: string;
};

export function CodeExample({ code }: CodeExampleProps) {
  const [copyStatus, setCopyStatus] = useState("Copy");

  async function copyCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("Copied");
    } catch (error) {
      console.error("Could not copy the example to the clipboard.", error);
      setCopyStatus("Copy failed");
    }
  }

  return (
    <section className={styles.example} aria-label="Code example">
      <div className={styles.exampleHeader}>
        <div className={styles.codeFile}>
          <span className={styles.codeFileIcon} aria-hidden="true">
            {"</>"}
          </span>
          <span>Example</span>
        </div>
        <button type="button" onClick={copyCode}>
          {copyStatus === "Copied" ? "✓ Copied" : copyStatus}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </section>
  );
}
