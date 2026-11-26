import styles from "./styles.module.css";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchField({ value, onChange }: SearchFieldProps) {
  return (
    <label className={styles.searchField}>
      <span className={styles.searchLabel}>
        Find a guide
      </span>
      <input
        aria-label="Find a guide"
        className={styles.searchInput}
        type="search"
        value={value}
        placeholder="Search topics..."
        onInput={(event: Event) =>
          onChange((event.currentTarget as HTMLInputElement).value)
        }
      />
    </label>
  );
}
