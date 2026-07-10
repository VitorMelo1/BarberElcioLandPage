import { Link } from "react-router-dom";

import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer id="contato" className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div>
            <h3 className={styles.brand}>Studio do Bruxo dos Cabelos</h3>
            <p className={styles.tag}>Freestyle · Colorimetria — Anápolis-GO</p>
          </div>
          <div className={styles.col}>
            <h4>Contato</h4>
            <a href="https://wa.me/5562993397680" target="_blank" rel="noreferrer">
              WhatsApp · (62) 99339-7680
            </a>
            <a href="https://instagram.com/bruxo_dos_cabelos" target="_blank" rel="noreferrer">
              @bruxo_dos_cabelos
            </a>
          </div>
          <div className={styles.col}>
            <h4>Onde</h4>
            <p>
              Rua Cristóvão Campos, 257
              <br />
              Setor Central · Anápolis-GO
            </p>
          </div>
          <div className={styles.col}>
            <h4>Agende</h4>
            <a href="#agendamento" className={styles.cta}>
              Agendar horário
            </a>
          </div>
        </div>
        <div className={styles.bottom}>
          <span>© 2026 Studio do Bruxo dos Cabelos · Elcio Barber</span>
          <span className={styles.legal}>
            <Link to="/privacidade">Privacidade</Link>
            <Link to="/termos">Termos</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
