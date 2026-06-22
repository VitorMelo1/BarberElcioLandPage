import { AnimatedTitle } from "../../../../components/AnimatedTitle/AnimatedTitle";
import styles from "./OBruxo.module.css";

const SPECIALTIES = ["Freestyle", "Colorimetria", "Barba & Navalha", "Cortes femininos"];

export function OBruxo() {
  return (
    <section id="bruxo" className={styles.section}>
      <div className={styles.grid}>
        <figure className={styles.media}>
          <img
            src="/images/barber.jpg"
            alt="Elcio, o Bruxo dos Cabelos, cortando com a tesoura"
            loading="lazy"
          />
        </figure>

        <div className={styles.body}>
          <p className={styles.kicker}>Quem segura a tesoura</p>
          <AnimatedTitle title={"O <b>Bruxo</b><br/>dos Cabelos"} className={styles.title} align="left" />
          <p className={styles.text}>
            Elcio não corta cabelo — ele desenha. Especialista em freestyle e colorimetria,
            transforma cada cadeira numa tela: do degradê preciso à cor que ninguém mais ousa.
            Aqui, a tesoura é pincel e o cabelo é tela.
          </p>
          <ul className={styles.tags}>
            {SPECIALTIES.map((s) => (
              <li key={s} className={styles.tag}>
                {s}
              </li>
            ))}
          </ul>
          <a className={styles.cta} href="#agendamento">
            Marcar com o Bruxo
          </a>
        </div>
      </div>
    </section>
  );
}
