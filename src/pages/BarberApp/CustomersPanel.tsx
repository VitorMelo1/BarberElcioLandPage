import { useState } from 'react';
import { Search, Users } from 'lucide-react';
import type { BarberCustomer } from '../../services/barberService';
import { Empty, Skeleton } from './PanelPrimitives';
import styles from './BarberApp.module.css';
export function CustomersPanel({customers,loading,error,onRetry}:{customers:BarberCustomer[];loading:boolean;error:string;onRetry:()=>Promise<void>}){
  const [query,setQuery]=useState('');
  const normal=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const matches=customers.filter(c=>normal(`${c.username} ${c.phone} ${c.email}`).includes(normal(query.trim())));
  return <section className={styles.panel} aria-busy={loading}>
    <div className={styles.panelHead}><h2 className={styles.panelTitle}>Clientes</h2><span>{customers.length} cadastrados</span></div>
    <label className={styles.fieldLabel}><span><Search size={16}/> Buscar por nome, telefone ou e-mail</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Encontre um cliente"/></label>
    {loading?<Skeleton/>:error?<p className={styles.toastErr} role="alert">{error}<button className={styles.btnGhost} onClick={()=>void onRetry()}>Tentar novamente</button></p>:matches.length===0?<Empty icon={<Users size={24}/>} text={query?'Nenhum cliente corresponde à busca. Tente outro nome ou telefone.':'Nenhum cliente com histórico ainda.'}/>:<div className={styles.customerList}>{matches.map(c=><details className={styles.customerCard} key={c.id}>
      <summary className={styles.customerSummary}><span className={styles.customerAvatar}>{c.username.slice(0,2).toUpperCase()}</span><span className={styles.customerInfo}><strong>{c.username}</strong><small>{c.phone||c.email||'Contato não informado'}</small><span className={styles.customerStats}>{c.total_bookings} reservas · {c.loyalty.tier?.name||'Sem nível de fidelidade'}</span></span></summary>
      <div className={styles.customerDetail}><h3>Dados do cliente</h3>{c.phone&&<p><a href={`tel:${c.phone.replace(/[^+\d]/g,'')}`}>Ligar: {c.phone}</a></p>}{c.email&&<p><a href={`mailto:${c.email}`}>{c.email}</a></p>}<p>{c.completed_bookings_year} atendimentos concluídos neste ano.</p><p>{c.loyalty.months_active} meses de relacionamento.</p>{c.loyalty.tier&&<p>Desconto de fidelidade: {Number(c.loyalty.tier.discount_percent)}%.</p>}{c.plans?.map(plan=><p key={plan.id}><strong>{plan.name}</strong> · {plan.status==='active'?'ativo':plan.status==='pending'?'aguardando pagamento':'conferir pagamento'}{plan.ends_at?` até ${new Date(plan.ends_at).toLocaleDateString('pt-BR')}`:''}</p>)}</div>
    </details>)}</div>}
  </section>;
}
