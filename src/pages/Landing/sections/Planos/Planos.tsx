import styles from "./Planos.module.css";
import { plans, buildYourPlan } from "../../../../data/plans";

export function Planos() {
  return (
    <section id="planos" className={styles.section}>
      <div className={styles.container}>
        <p className={styles.kicker}>Vire da casa do Bruxo</p>
        <h2 className={styles.title}>Planos mensais</h2>
        <p className={styles.lead}>
          Escolha um pacote pronto ou monte o seu — quanto mais procedimentos no mês, maior o
          feitiço de desconto.
        </p>

        <div className={styles.tiers}>
          <span className={styles.tiersLabel}>Monte seu plano:</span>
          {buildYourPlan.map((t) => (
            <span key={t.range} className={styles.tier}>
              <b>{t.discount}</b> {t.range}
            </span>
          ))}
        </div>

        <div className={styles.grid}>
          {plans.map((p) => (
            <article key={p.id} className={styles.card}>
              <h3 className={styles.planName}>{p.name}</h3>
              <p className={styles.items}>{p.items}</p>
              <div className={styles.pricing}>
                <span className={styles.from}>de R$ {p.from}</span>
                <span className={styles.por}>
                  R$ {p.price}
                  <small>/mês</small>
                </span>
              </div>
              <span className={styles.save}>economize R$ {p.from - p.price}</span>
              <a href="#agendamento" className={styles.cta}>
                Quero esse
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
