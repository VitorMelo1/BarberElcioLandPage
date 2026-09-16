import styles from './Planos.module.css';
import { getDiscountTiers,getPlans } from '../../../../services/catalogService';
import { usePublicCatalog,publicMoney } from '../../usePublicCatalog';
export function Planos(){
  const plans=usePublicCatalog(getPlans);const tiers=usePublicCatalog(getDiscountTiers);
  return <section id="planos" className={styles.section}><div className={styles.container}>
    <p className={styles.kicker}>Cuidados com frequência</p><h2 className={styles.title}>Pacotes do Studio</h2><p className={styles.lead}>Consulte disponibilidade e condições diretamente com o Studio. Os pacotes são combinados pelo WhatsApp; a contratação não acontece pelo site.</p>
    {tiers.error&&<p role="alert">Não foi possível consultar as faixas de desconto. <button className={styles.retry} onClick={tiers.retry}>Tentar novamente</button></p>}
    {!tiers.loading&&!tiers.error&&tiers.items.length>0&&<div className={styles.tiers}><span className={styles.tiersLabel}>Condições para consulta:</span>{tiers.items.map(t=><span className={styles.tier} key={t.id}><b>{t.discount_label}</b> {t.range_label}</span>)}</div>}
    {plans.loading?<p role="status">Carregando pacotes…</p>:plans.error?<p role="alert">{plans.error} <button className={styles.retry} onClick={plans.retry}>Tentar novamente</button></p>:plans.items.length===0?<p>Nenhum pacote publicado no momento.</p>:<div className={styles.grid}>{plans.items.map(p=><article key={p.id} className={styles.card}><h3 className={styles.planName}>{p.name}</h3><p className={styles.items}>{p.items}</p><div className={styles.pricing}>{Number(p.price_from)>Number(p.price)&&<span className={styles.from}>De {publicMoney(p.price_from)}</span>}<span className={styles.por}>{publicMoney(p.price)}</span></div>{Number(p.price_from)>Number(p.price)&&<span className={styles.save}>Economia de {publicMoney(Number(p.price_from)-Number(p.price))}</span>}<a href={`https://wa.me/5562993397680?text=${encodeURIComponent(`Olá! Gostaria de consultar o pacote ${p.name}, anunciado por ${publicMoney(p.price)}. Quais são as condições?`)}`} className={styles.cta} target="_blank" rel="noreferrer">Consultar este pacote</a></article>)}</div>}
  </div></section>;
}
