import styles from "./Servicos.module.css";
import { services } from "../../../../data/services";
import { priceList } from "../../../../data/priceList";

const toolLabel: Record<string, string> = {
  tesoura: "Tesoura",
  navalha: "Navalha",
  pente: "Pente",
  maquina: "Máquina",
};

export function Servicos() {
  return (
    <section id="servicos" className={styles.section}>
      <div className={styles.container}>
        <p className={styles.kicker}>O que fazemos</p>
        <h2 className={styles.title}>Serviços</h2>
        <p className={styles.lead}>
          Muito além da barbearia tradicional — cada procedimento é arte sob medida.
        </p>

        <div className={styles.grid}>
          {services.map((s) => (
            <article key={s.id} className={styles.card}>
              <span className={styles.tag}>{toolLabel[s.tool]}</span>
              <h3 className={styles.cardTitle}>{s.title}</h3>
              <p className={styles.cardDesc}>{s.description}</p>
            </article>
          ))}
        </div>

        <div className={styles.priceWrap}>
          {priceList.map((g) => (
            <div key={g.group}>
              <h4 className={styles.priceGroupTitle}>{g.group}</h4>
              <ul className={styles.priceList}>
                {g.items.map((it) => (
                  <li key={it.name} className={styles.priceRow}>
                    <span>{it.name}</span>
                    <span className={styles.price}>{it.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
