import { useState } from "@jgluhov/relement";
import styles from "./App.module.css";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <section className={styles.counterCard} id="demo">
      <div>
        <p className={styles.cardLabel}>INTERACTIVE DEMO</p>
        <h2>Your first reactive state</h2>
        <p className={styles.counterCopy}>
          Button clicked <strong>{count}</strong> times
        </p>
      </div>
      <button
        className={`${styles.button} ${styles.buttonSecondary}`}
        onClick={() => setCount((value) => value + 1)}
      >
        Increment counter
      </button>
    </section>
  );
}

export function App() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="#">
          <span className={styles.brandMark}>R</span>
          <span>Relement</span>
        </a>
        <a
          className={styles.githubLink}
          href="https://github.com/EVGlukhov/Relement"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>A LITTLE ELEMENT OF A BIG IDEA</p>
        <h1 className={styles.title}>
          Build for the web.
          <br />
          <span className={styles.titleAccent}>Keep it native.</span>
        </h1>
        <p className={styles.intro}>
          A lightweight UI framework built on Custom Elements, with reactive
          state and a tiny hooks API. Your next idea starts here.
        </p>
        <div className={styles.actions}>
          <a
            className={`${styles.button} ${styles.buttonPrimary}`}
            href="#demo"
          >
            Try the counter
          </a>
          <a
            className={styles.textLink}
            href="https://github.com/EVGlukhov/Relement"
          >
            Explore Relement
          </a>
        </div>
      </section>

      <Counter />
    </main>
  );
}
