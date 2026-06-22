import { AnimatedTitle } from "../../../../components/AnimatedTitle/AnimatedTitle";
import { testimonials } from "../../../../data/testimonials";
import styles from "./Depoimentos.module.css";

export function Depoimentos() {
  return (
    <section id="depoimentos" className={styles.section}>
      <div className={styles.container}>
        <p className={styles.kicker}>Quem senta, volta</p>
        <AnimatedTitle title={"O que dizem<br/>na <b>cadeira</b>"} className={styles.title} align="left" />

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
