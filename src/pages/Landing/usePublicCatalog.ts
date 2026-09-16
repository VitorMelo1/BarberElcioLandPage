import { useEffect, useState } from 'react';
export function usePublicCatalog<T>(load:()=>Promise<T[]>){
  const [items,setItems]=useState<T[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    let active=true;setLoading(true);setError('');
    load().then(data=>{if(active)setItems(data);}).catch(err=>{if(active)setError(err instanceof Error?err.message:'Não foi possível carregar agora.');}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[load,revision]);
  return {items,loading,error,retry:()=>setRevision(v=>v+1)};
}
export const publicMoney=(value:string|number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value));
