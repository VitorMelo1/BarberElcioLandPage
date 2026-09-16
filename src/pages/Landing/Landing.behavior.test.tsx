import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { afterEach,expect,test,vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../../components/Header/Header';
import { Servicos } from './sections/Servicos/Servicos';
const response=(data:unknown,status=200)=>({ok:status<400,status,json:async()=>data}) as Response;
afterEach(()=>{cleanup();vi.restoreAllMocks();});
test('closed mobile navigation has no focusable menu items',()=>{
  render(<MemoryRouter><Header/></MemoryRouter>);
  expect(screen.getAllByRole('button',{name:'Serviços'})).toHaveLength(1);
  fireEvent.click(screen.getByRole('button',{name:'Abrir menu'}));
  expect(screen.getAllByRole('button',{name:'Serviços'})).toHaveLength(2);
  fireEvent.keyDown(document,{key:'Escape'});
  expect(screen.getAllByRole('button',{name:'Serviços'})).toHaveLength(1);
});
test('empty published catalog does not show bundled stale services',async()=>{
  vi.spyOn(globalThis,'fetch').mockResolvedValue(response([]));render(<Servicos/>);
  expect(await screen.findByText(/Nenhum serviço publicado/)).toBeTruthy();
  expect(screen.queryAllByRole('article')).toHaveLength(0);
});
test('published service prices preserve cents and quote services never imply a zero price',async()=>{
  vi.spyOn(globalThis,'fetch').mockResolvedValue(response([{id:1,slug:'corte',name:'Corte especial',description:'',price:'49.90',price_type:'fixed',duration_min:30,tool:'tesoura',active:true,order:1},{id:2,slug:'cor',name:'Cor especial',description:'',price:'0.00',price_type:'quote',duration_min:30,tool:'tesoura',active:true,order:2}]));render(<Servicos/>);
  expect(await screen.findByText('R$ 49,90',{exact:false})).toBeTruthy();
  expect(screen.getByText('Sob consulta')).toBeTruthy();
  expect(screen.queryByText(/R\$\s*0,00/)).toBeNull();
});
