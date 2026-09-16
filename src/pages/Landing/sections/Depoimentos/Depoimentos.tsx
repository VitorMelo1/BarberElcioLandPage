import { testimonials } from "../../../../data/testimonials";
import styles from "./Depoimentos.module.css";

export function Depoimentos() {
  // Sem depoimentos reais, a seção não aparece (nada de prova social falsa).
  if (testimonials.length === 0) return null;

  return (
    <section id="depoimentos" className={styles.section}>
      <div className={styles.container}>
        <p className={styles.kicker}>Quem senta, volta</p>
          <h2 className={styles.title}>O que dizem na cadeira</h2>

        <div className={styles.grid}>
          {testimonials.map((t) => (
            <blockquote key={t.id} className={styles.card}>
              <span className={styles.quote}>&ldquo;</span>
              <p className={styles.text}>{t.text}</p>
              <footer className={styles.meta}>
                <span className={styles.name}>{t.name}</span>
                {t.tag && <span className={styles.tag}>{t.tag}</span>}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
