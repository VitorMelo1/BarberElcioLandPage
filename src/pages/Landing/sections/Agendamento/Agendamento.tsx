import { useNavigate } from "react-router-dom";
import styles from "./Agendamento.module.css";

export function Agendamento() {
  const navigate = useNavigate();

  return (
    <section id="agendamento" className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.kicker}>Reserve seu horário</p>
        <h2 className={styles.title}>Pronto pra sentar na cadeira do Bruxo?</h2>
        <p className={styles.lead}>
          Para cortes e outros serviços com preço definido, escolha um horário e confira o sinal de 50%. Para Freestyle e Colorimetria, agende primeiro a avaliação: o valor e o tempo do procedimento serão apresentados na proposta. Das 8h às 11h, consulte a disponibilidade pelo WhatsApp; os horários online aparecem a partir das 11h.
        </p>
        <button className={styles.cta} onClick={() => navigate("/app")}>
          Agendar online
        </button>
        <a
          style={{
            display: "block",
            marginTop: "1.1rem",
            color: "#e2d7ee",
            fontSize: "0.85rem",
          }}
          href="https://wa.me/5562993397680"
          target="_blank"
          rel="noreferrer"
        >
          Conversar pelo WhatsApp
        </a>
      </div>
    </section>
  );
}
