import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { afterEach,expect,test } from 'vitest';
import { LoyaltyPanel } from './RelationshipPanels';
afterEach(cleanup);
test('loyalty editing retains the proposed rule when saving fails',async()=>{
  render(<LoyaltyPanel tiers={[{id:1,name:'Prata',min_months:3,min_completed_bookings_year:6,discount_percent:'5.00',order:1,active:true}]} loading={false} onCreate={async()=>false} onUpdate={async()=>false}/>);
  fireEvent.click(screen.getByRole('button',{name:'Editar Prata'}));
  fireEvent.change(screen.getByPlaceholderText('Digite o nome'),{target:{value:'Prata Plus'}});
  fireEvent.click(screen.getByRole('button',{name:'Salvar nível'}));
  expect((await screen.findByPlaceholderText('Digite o nome') as HTMLInputElement).value).toBe('Prata Plus');
});
