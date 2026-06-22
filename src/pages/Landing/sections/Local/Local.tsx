import { AnimatedTitle } from "../../../../components/AnimatedTitle/AnimatedTitle";
import styles from "./Local.module.css";

const MAP_SRC =
  "https://www.google.com/maps?q=Rua+Crist%C3%B3v%C3%A3o+Campos+257+Setor+Central+An%C3%A1polis+GO&output=embed";

export function Local() {
  return (
    <section id="local" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.info}>
          <p className={styles.kicker}>Onde a mágica acontece</p>
          <AnimatedTitle title={"Cola no<br/><b>Studio</b>"} className={styles.title} align="left" />
          <ul className={styles.list}>
            <li>
              <span className={styles.label}>Endereço</span>
              Rua Cristóvão Campos, 257 — Setor Central, Anápolis-GO
            </li>
            <li>
              <span className={styles.label}>WhatsApp</span>
              <a href="https://wa.me/5562993397680" target="_blank" rel="noreferrer">
                (62) 99339-7680
              </a>
            </li>
            <li>
              <span className={styles.label}>Instagram</span>
              <a href="https://instagram.com/bruxo_dos_cabelos" target="_blank" rel="noreferrer">
                @bruxo_dos_cabelos
              </a>
            </li>
            <li>
              <span className={styles.label}>Horário</span>
              Segunda a Sábado
            </li>
          </ul>
          <a className={styles.cta} href="#agendamento">
            Agendar horário
          </a>
        </div>

        <div className={styles.mapWrap}>
          <iframe
            className={styles.map}
            src={MAP_SRC}
            title="Mapa do Studio do Bruxo dos Cabelos"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
