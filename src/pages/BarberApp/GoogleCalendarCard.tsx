import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { disconnectGoogle,getGoogleConnectUrl,getGoogleStatus,type GoogleStatus } from '../../services/integrationsService';
import styles from './BarberApp.module.css';
export function GoogleCalendarCard(){
  const [params,setParams]=useSearchParams();
  const [status,setStatus]=useState<(GoogleStatus & {sync?:{pending:number;failed:number;last_delivered_at:string|null;direction:string}})|null>(null);
  const [notice,setNotice]=useState(params.get('google')==='erro'?'Não foi possível conectar o Google Calendar. Tente novamente.':params.get('google')==='conectado'?'Conta Google conectada.':'');
  const [error,setError]=useState('');const [pending,setPending]=useState(false);const [retry,setRetry]=useState(0);
  useEffect(()=>{let active=true;setError('');getGoogleStatus().then(data=>{if(active)setStatus(data);}).catch(err=>{if(active)setError(err instanceof Error?err.message:'Falha ao consultar conexão.');});return()=>{active=false;};},[retry]);
  useEffect(()=>{if(params.has('google'))setParams(previous=>{previous.delete('google');return previous;},{replace:true});},[]);
  async function run(connect:boolean){if(pending)return;setPending(true);setError('');try{if(connect){const result=await getGoogleConnectUrl();window.location.assign(result.auth_url);}else{await disconnectGoogle();setStatus(current=>current?{...current,connected:false,email:''}:current);setNotice('Conta Google desconectada.');}}catch(err){setError(err instanceof Error?err.message:'Não foi possível alterar a conexão.');}finally{setPending(false);}}
  return <details className={styles.panel}><summary className={styles.detailsTitle}>Google Calendar</summary>
    {notice&&<p role="status">{notice}</p>}{error?<p className={styles.toastErr} role="alert">{error}<button className={styles.btnGhost} onClick={()=>setRetry(v=>v+1)}>Consultar novamente</button></p>:!status?<p role="status">Consultando conexão…</p>:!status.configured?<p>Conexão com Google Calendar indisponível no momento.</p>:<><p>{status.connected?`Conta conectada: ${status.email || 'Google'}`:'Conecte sua conta para enviar os agendamentos ao Google Calendar.'}</p>{status.connected&&<p>A conexão envia os agendamentos do Studio ao Google Calendar.</p>}{status.sync&&<div><p>{status.sync.pending} envios pendentes · {status.sync.failed} envios com falha.</p><p>{status.sync.last_delivered_at?`Último envio: ${new Date(status.sync.last_delivered_at).toLocaleString('pt-BR')}`:'Nenhum envio concluído registrado.'}</p>{status.sync.failed>0&&<p role="alert">Há eventos que precisam de nova tentativa de envio. Os horários continuam disponíveis neste painel.</p>}</div>}<button className={styles.btnGhost} disabled={pending} onClick={()=>void run(!status.connected)}>{pending?'Aguarde…':status.connected?'Desconectar':'Conectar Google Calendar'}</button></>}
  </details>;
}
