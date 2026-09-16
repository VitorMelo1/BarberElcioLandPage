import { useMemo } from "react";
import { localDate, nextDays } from "../../utils/format";
import styles from "./ClientApp.module.css";

export function DatePicker({ value, onChange, id = "booking-date" }: { value: string; onChange: (date: string) => void; id?: string }) {
  const days = useMemo(() => nextDays(), []);
  return <div className={styles.datePicker}>
    <div className={styles.dayChips} aria-label="Próximos dias">
      {days.map(day => <button type="button" key={day.iso} aria-pressed={value === day.iso} className={value === day.iso ? styles.dayChipOn : styles.dayChip} onClick={() => onChange(day.iso)}><b>{day.label}</b><small>{day.sub}</small></button>)}
    </div>
    <label className={styles.dateField} htmlFor={id}>Outra data<input className={styles.input} id={id} type="date" min={localDate()} value={value} onChange={e => onChange(e.target.value)} /></label>
  </div>;
}
