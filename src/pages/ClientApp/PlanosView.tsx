import { useEffect, useState } from "react";

import { plans } from "../../data/plans";
import { getPlans, type ApiPlan } from "../../services/catalogService";
import styles from "./ClientApp.module.css";

export function PlanosView() {
  const [apiPlans, setApiPlans] = useState<ApiPlan[]>([]);

  useEffect(() => {
    getPlans()
      .then((items) => setApiPlans(items))
      .catch(() => setApiPlans([]));
  }, []);

  const visiblePlans =
    apiPlans.length > 0
      ? apiPlans.map((plan) => ({
          id: String(plan.id),
          name: plan.name,
          items: plan.items,
          from: Number(plan.price_from),
          price: Number(plan.price),
        }))
      : plans;

  return (
    <div className={styles.view}>
      <p className={styles.muted}>
        Assine e economize todo mês. (Pagamento da assinatura entra em breve.)
      </p>
      <div className={styles.cards}>
        {visiblePlans.map((p) => (
          <div key={p.id} className={styles.plan}>
            <h4 className={styles.planName}>{p.name}</h4>
            <p className={styles.planItems}>{p.items}</p>
            <div className={styles.planPrice}>
              <span className={styles.from}>de R$ {p.from}</span>
              <b>
                R$ {p.price}
                <small>/mês</small>
              </b>
            </div>
            <button className={styles.ctaOutline} disabled>
              Assinar (em breve)
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
