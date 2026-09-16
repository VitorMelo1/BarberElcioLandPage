import { useEffect, useRef, useState } from 'react';
import { getPaymentSettings, savePaymentSettings } from '../../services/financeService';
import styles from './BarberApp.module.css';
export function PaymentSettingsPanel(){
  const [data,setData]=useState({pix_key:'',pix_holder:'',pix_city:''});
  const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [message,setMessage]=useState('');
  const [providerReady,setProviderReady]=useState<boolean|undefined>();
  const [pending,setPending]=useState(false);const [ready,setReady]=useState(false);const [retry,setRetry]=useState(0);const [editing,setEditing]=useState(false);
  const saving=useRef(false);
  useEffect(()=>{let active=true;setLoading(true);setError('');setReady(false);getPaymentSettings().then(s=>{if(active){setData({pix_key:s.pix_key,pix_holder:s.pix_holder,pix_city:s.pix_city});setProviderReady((s as typeof s & {mercadopago_ready?:boolean}).mercadopago_ready);setReady(true);}}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Falha ao carregar dados de recebimento.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[retry]);
  async function save(e:React.FormEvent){e.preventDefault();if(!ready||saving.current)return;saving.current=true;setPending(true);setError('');try{const s=await savePaymentSettings(data);setData({pix_key:s.pix_key,pix_holder:s.pix_holder,pix_city:s.pix_city});setEditing(false);setMessage('Dados de recebimento salvos.');}catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar.');}finally{saving.current=false;setPending(false);}}
  return <section className={styles.panel}><h2 className={styles.panelTitle}>Recebimento por PIX</h2><p className={styles.sectionHint}>A chave é usada para gerar o PIX do sinal, de 50% do atendimento.</p>
    {loading&&<p role="status">Carregando dados de recebimento…</p>}{message&&<p className={styles.toastOk} role="status">{message}</p>}{error&&<p className={styles.toastErr} role="alert">{error}{!ready&&<button className={styles.btnGhost} onClick={()=>setRetry(v=>v+1)}>Tentar novamente</button>}</p>}
    {ready&&providerReady!==undefined&&<p>{providerReady?"Confirmação automática de PIX disponível.":"Recebimentos por PIX precisam de conferência manual no painel."}</p>}{ready&&!editing&&<><p>{data.pix_key?`Chave cadastrada: ••••${data.pix_key.slice(-4)}`:'Nenhuma chave cadastrada.'}</p><p>{data.pix_holder} {data.pix_city}</p><button className={styles.btnGhost} onClick={()=>setEditing(true)}>{data.pix_key?'Editar recebimento':'Cadastrar chave PIX'}</button></>}
    {ready&&editing&&<form className={styles.editorForm} onSubmit={save}><fieldset className={styles.formBoundary} disabled={pending}>
      <label className={styles.fieldLabel}>Chave PIX<input required value={data.pix_key} onChange={e=>setData(v=>({...v,pix_key:e.target.value}))}/></label>
      <div className={styles.formRow}><label className={styles.fieldLabel}>Nome do recebedor<input required value={data.pix_holder} onChange={e=>setData(v=>({...v,pix_holder:e.target.value}))}/></label><label className={styles.fieldLabel}>Cidade<input required value={data.pix_city} onChange={e=>setData(v=>({...v,pix_city:e.target.value}))}/></label></div>
      <div className={styles.pairActions}><button className={styles.btn}>{pending?'Salvando…':'Salvar recebimento'}</button><button type="button" className={styles.btnGhost} onClick={()=>{setEditing(false);setRetry(v=>v+1);}}>Cancelar</button></div>
    </fieldset></form>}
  </section>;
}
