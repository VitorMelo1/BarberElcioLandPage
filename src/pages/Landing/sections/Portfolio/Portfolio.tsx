import { useEffect, useState } from "react";

import styles from "./Portfolio.module.css";
import { gallery } from "../../../../data/gallery";
import { getPortfolioImages, type ApiPortfolioImage } from "../../../../services/catalogService";

export function Portfolio() {
  const [apiGallery, setApiGallery] = useState<ApiPortfolioImage[]>([]);

  useEffect(() => {
    getPortfolioImages()
      .then((items) => setApiGallery(items))
      .catch(() => setApiGallery([]));
  }, []);

  const visibleGallery =
    apiGallery.length > 0
      ? apiGallery.map((item) => ({
          id: String(item.id),
          src: item.image_url || item.image,
          alt: item.alt,
          look: item.look,
          mandala: item.mandala,
        }))
      : gallery;

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
          {visibleGallery.map((item) => (
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
