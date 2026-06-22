import styles from "./Agendamento.module.css";

export function Agendamento() {
  return (
    <section id="agendamento" className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.kicker}>Reserve seu horário</p>
        <h2 className={styles.title}>Pronto pra sentar na cadeira do Bruxo?</h2>
        <p className={styles.lead}>
          Agendamento com sinal de 50%. Em breve direto pelo site, integrado à agenda do Elcio —
          por enquanto, é só chamar no WhatsApp.
        </p>
        <a
          className={styles.cta}
          href="https://wa.me/5562993397680"
          target="_blank"
          rel="noreferrer"
        >
          Agendar no WhatsApp
        </a>
      </div>
    </section>
  );
}
