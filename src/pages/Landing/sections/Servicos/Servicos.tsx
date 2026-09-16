import styles from './Servicos.module.css';
import { getServices } from '../../../../services/catalogService';
import { usePublicCatalog,publicMoney } from '../../usePublicCatalog';
export function Servicos(){
  const {items,loading,error,retry}=usePublicCatalog(getServices);
  return <section id="servicos" className={styles.section}><div className={styles.container}>
    <h2 className={styles.title}>Serviços e horários</h2><p className={styles.lead}>Os cuidados da sua rotina também têm lugar aqui. Confira os valores publicados pelo Studio; nos serviços sob consulta, o tempo indicado é o da avaliação.</p>
    {loading?<p role="status">Carregando serviços…</p>:error?<div role="alert"><p>{error}</p><button type="button" className={styles.retry} onClick={retry}>Tentar novamente</button></div>:items.length===0?<p>Nenhum serviço publicado no momento. Consulte o Studio pelo WhatsApp.</p>:<div className={styles.grid}>{items.map(s=><article className={styles.card} key={s.id}><h3 className={styles.cardTitle}>{s.name}</h3><p className={styles.cardDesc}>{s.description}</p><p className={styles.serviceMeta}>{s.duration_min} minutos · {s.price_type==='quote'?'Avaliação e orçamento':'Preço do atendimento'}</p><strong className={styles.price}>{s.price_type==='quote'?'Sob consulta':publicMoney(s.price)}</strong><a className={styles.book} href={`/app?servicos=${s.id}`}>{s.price_type==='quote'?'Agendar avaliação':'Ver horários'}</a></article>)}</div>}
  </div></section>;
}
