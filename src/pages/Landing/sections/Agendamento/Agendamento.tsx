import { useBooking } from "../../../../context/BookingContext";
import styles from "./Agendamento.module.css";

export function Agendamento() {
  const { openBooking } = useBooking();

  return (
    <section id="agendamento" className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.kicker}>Reserve seu horário</p>
        <h2 className={styles.title}>Pronto pra sentar na cadeira do Bruxo?</h2>
        <p className={styles.lead}>
          Agende direto pelo site: escolha o serviço, veja os horários livres e confirme. O sinal de
          50% você combina com o Elcio.
        </p>
        <button className={styles.cta} onClick={openBooking}>
          Agendar online
        </button>
        <a
          style={{
            display: "block",
            marginTop: "1.1rem",
            color: "rgba(240,234,248,0.55)",
            fontSize: "0.85rem",
          }}
          href="https://wa.me/5562993397680"
          target="_blank"
          rel="noreferrer"
        >
          ou chamar no WhatsApp →
        </a>
      </div>
    </section>
  );
}
