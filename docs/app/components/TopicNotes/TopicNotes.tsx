import styles from "./styles.module.css";

type TopicNotesProps = {
  notes: readonly string[];
};

export function TopicNotes({ notes }: TopicNotesProps) {
  return (
    <ul className={styles.notes}>
      {notes.map((note) => (
        <li key={note}>{note}</li>
      ))}
    </ul>
  );
}
