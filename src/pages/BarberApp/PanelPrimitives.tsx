import { type ReactNode } from "react";
import styles from "./BarberApp.module.css";
export const moneyLabel = (value?: string) => {
  const parsed = Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parsed);
};

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `item-${Date.now()}`;

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className={styles.skeleton} role="status" aria-label="Carregando dados">
      {Array.from({ length: rows }).map((_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}

export function Empty({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>{icon}</span>
      <p>{text}</p>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className={styles.fieldLabel}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

/* ─────────────────── SITE / VITRINE ─────────────────── */

