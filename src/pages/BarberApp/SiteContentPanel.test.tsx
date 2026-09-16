import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { afterEach,expect,test } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SiteContentPanel } from './SiteContentPanel';
const fail=async()=>false;
afterEach(cleanup);
test('a failed catalog creation leaves the editor open with the submitted values',async()=>{
  render(<MemoryRouter initialEntries={['/barber?tab=ajustes&settings=site&section=servicos']}><SiteContentPanel services={[]} plans={[]} discounts={[]} images={[]} loading={false} onCreateService={fail} onUpdateService={fail} onDeleteService={fail} onCreatePlan={fail} onUpdatePlan={fail} onDeletePlan={fail} onCreateDiscount={fail} onUpdateDiscount={fail} onDeleteDiscount={fail} onCreateImage={fail} onUpdateImage={fail} onDeleteImage={fail}/></MemoryRouter>);
  fireEvent.click(screen.getByRole('button',{name:/Novo serviço/}));
  fireEvent.change(screen.getByPlaceholderText('Digite o nome do serviço'),{target:{value:'Corte personalizado'}});
  fireEvent.change(screen.getByLabelText('Preço do serviço'),{target:{value:'125.50'}});
  fireEvent.click(screen.getByRole('button',{name:'Adicionar'}));
  expect((await screen.findByPlaceholderText('Digite o nome do serviço') as HTMLInputElement).value).toBe('Corte personalizado');
  expect((screen.getByLabelText('Preço do serviço') as HTMLInputElement).value).toBe('125.50');
});
