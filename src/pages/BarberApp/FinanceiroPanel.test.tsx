import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { FinanceiroPanel } from './FinanceiroPanel';
const response=(data:unknown,status=200)=>({ok:status<400,status,json:async()=>data}) as Response;
afterEach(()=>{cleanup();vi.restoreAllMocks();});
test('empty production does not claim a profit margin or received revenue',async()=>{
  vi.spyOn(globalThis,'fetch').mockImplementation(async input=>String(input).includes('/summary/')?response({year:2026,month:9,revenue:'0.00',expenses:'0.00',profit:'0.00',margin:0,completed_count:0,series:[],breakdown:[]}):String(input).includes('/settings/')?response({pix_key:'',pix_holder:'',pix_city:'',mercadopago_configured:false}):response([]));
  render(<FinanceiroPanel/>);
  await screen.findByText('Custos do mês');
  expect(screen.queryByText(/margem 100%/)).toBeNull();
  expect(await screen.findByText(/Atendimentos concluídos/)).toBeTruthy();
});
import { PaymentSettingsPanel } from './PaymentSettingsPanel';

test('failed PIX settings read leaves saving unavailable and exposes a retry',async()=>{
  vi.spyOn(globalThis,'fetch').mockResolvedValue(response({detail:'Falha ao consultar PIX'},503));
  render(<PaymentSettingsPanel/>);
  await screen.findByText('Falha ao consultar PIX');
  expect(screen.queryByRole('button',{name:/Salvar recebimento|Cadastrar chave/})).toBeNull();
  expect(screen.getByRole('button',{name:'Tentar novamente'})).toBeTruthy();
});

test('a failed expense write preserves date, description and amount for retry',async()=>{
  vi.spyOn(globalThis,'fetch').mockImplementation(async(input,init)=>{
    if(String(input).endsWith('/auth/csrf/'))return response({csrfToken:'fixture-csrf'});
    if(init?.method==='POST')return response({detail:'Não foi possível lançar'},503);
    if(String(input).includes('/summary/'))return response({year:2026,month:9,revenue:'0.00',expenses:'0.00',profit:'0.00',margin:0,completed_count:0,series:[],breakdown:[]});
    return response([]);
  });
  render(<FinanceiroPanel/>);
  fireEvent.click(screen.getByRole('button',{name:'Lançar custo'}));
  fireEvent.change(screen.getByLabelText('Descrição do custo'),{target:{value:'Energia'}});
  fireEvent.change(screen.getByLabelText('Valor do custo (R$)'),{target:{value:'125,50'}});
  fireEvent.change(screen.getByLabelText('Data do custo'),{target:{value:'2026-08-20'}});
  fireEvent.click(screen.getByRole('button',{name:'Salvar custo'}));
  await screen.findByText('Não foi possível lançar');
  expect((screen.getByLabelText('Descrição do custo') as HTMLInputElement).value).toBe('Energia');
  expect((screen.getByLabelText('Valor do custo (R$)') as HTMLInputElement).value).toBe('125,50');
  expect((screen.getByLabelText('Data do custo') as HTMLInputElement).value).toBe('2026-08-20');
});
