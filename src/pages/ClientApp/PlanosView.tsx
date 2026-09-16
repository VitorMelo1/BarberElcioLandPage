import { useResource } from "../../hooks/useResource";
import { getPlans } from "../../services/catalogService";
import { money } from "../../utils/format";
import styles from "./ClientApp.module.css";
export function PlanosView() {
  const plans = useResource(() => getPlans(), []);
  return <div className={styles.view}>
    <div className={styles.viewHeading}><div><h2>Cuide do seu estilo todo mês</h2><p>Consulte os planos do studio e combine a contratação com o Elcio.</p></div></div>
    <p className={styles.quoteNote}>A contratação e as condições dos planos são combinadas diretamente com o studio. O agendamento avulso mostra seu próprio valor antes da confirmação.</p>
    {plans.loading && <p role="status">Carregando planos…</p>}
    {plans.error && <div className={styles.error} role="alert"><p>{plans.error}</p><button className={styles.secondary} onClick={plans.reload}>Tentar novamente</button></div>}
    {!plans.loading && !plans.error && !plans.data?.length && <p className={styles.empty}>Nenhum plano disponível no momento. Você pode agendar um atendimento avulso.</p>}
    <div className={styles.cards}>{plans.data?.filter(p => p.active).map(plan => <article className={styles.plan} key={plan.id}><h3>{plan.name}</h3><p>{plan.items}</p><div className={styles.planPrice}>{Number(plan.price_from) > Number(plan.price) && <del>{money(plan.price_from)}</del>}<strong>{money(plan.price)}<small>/mês</small></strong></div><a className={styles.secondary} href={`https://wa.me/5562993397680?text=${encodeURIComponent(`Olá! Gostaria de saber as condições do plano ${plan.name}.`)}`} target="_blank" rel="noreferrer">Consultar este plano</a></article>)}</div>
  </div>;
}
