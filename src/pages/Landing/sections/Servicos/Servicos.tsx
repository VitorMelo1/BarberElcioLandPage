import { useEffect, useState } from "react";

import styles from "./Servicos.module.css";
import { services } from "../../../../data/services";
import { priceList } from "../../../../data/priceList";
import { getServices, type ApiService } from "../../../../services/catalogService";

const toolLabel: Record<string, string> = {
  tesoura: "Tesoura",
  navalha: "Navalha",
  pente: "Pente",
  maquina: "Máquina",
};

export function Servicos() {
  const [apiServices, setApiServices] = useState<ApiService[]>([]);

  useEffect(() => {
    getServices()
      .then((items) => setApiServices(items))
      .catch(() => setApiServices([]));
  }, []);

  const serviceCards =
    apiServices.length > 0
      ? apiServices.map((service) => ({
          id: service.slug,
          tool: service.tool || "tesoura",
          title: service.name,
          description: service.description,
        }))
      : services;
  const priceGroups =
    apiServices.length > 0
      ? [
          {
            group: "Precos",
            items: apiServices.map((service) => ({
              name: service.name,
              price: `R$ ${Number(service.price).toFixed(0)}`,
            })),
          },
        ]
      : priceList;

  return (
    <section id="servicos" className={styles.section}>
      <div className={styles.container}>
        <p className={styles.kicker}>O que fazemos</p>
        <h2 className={styles.title}>Serviços</h2>
        <p className={styles.lead}>
          Muito além da barbearia tradicional — cada procedimento é arte sob medida.
        </p>

        <div className={styles.grid}>
          {serviceCards.map((s) => (
            <article key={s.id} className={styles.card}>
              <span className={styles.tag}>{toolLabel[s.tool] || "Tesoura"}</span>
              <h3 className={styles.cardTitle}>{s.title}</h3>
              <p className={styles.cardDesc}>{s.description}</p>
            </article>
          ))}
        </div>

        <div className={styles.priceWrap}>
          {priceGroups.map((g) => (
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
