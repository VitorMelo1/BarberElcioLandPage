import styles from "./Portfolio.module.css";
import { gallery } from "../../../../data/gallery";

export function Portfolio() {
  return (
    <section id="portfolio" className={styles.section}>
      <div className={styles.container}>
        <p className={styles.kicker}>A galeria do Bruxo</p>
        <h2 className={styles.title}>Portfólio</h2>
        <p className={styles.lead}>
          Cada cabeça é uma tela. Freestyle, colorimetria e cortes que viram arte — vários no
          backdrop da mandala da casa.
        </p>

        <div className={styles.masonry}>
          {gallery.map((item) => (
            <figure key={item.id} className={styles.item}>
              <img src={item.src} alt={item.alt} loading="lazy" className={styles.img} />
              <figcaption className={styles.caption}>
                {item.mandala && <span className={styles.badge}>★ Mandala</span>}
                <span className={styles.look}>{item.look}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className={styles.note}>
          Quer ver mais?{" "}
          <a href="https://instagram.com/bruxo_dos_cabelos" target="_blank" rel="noreferrer">
            @bruxo_dos_cabelos
          </a>
        </p>
      </div>
    </section>
  );
}
