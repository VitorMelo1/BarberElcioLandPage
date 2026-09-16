import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { ServicosSection } from './ServicesManager';

test('catalog editor links an artistic specialty and labels evaluation time separately', async () => {
  const create = vi.fn().mockResolvedValue(true);
  render(<ServicosSection services={[]} loading={false} onCreate={create} onUpdate={async()=>true} onDelete={async()=>true} />);
  fireEvent.click(screen.getByRole('button', { name: 'Novo serviço' }));
  fireEvent.change(screen.getByPlaceholderText('Digite o nome do serviço'), { target: { value: 'Avaliação de cor' } });
  fireEvent.click(screen.getByRole('button', { name: /Sob consulta/ }));
  fireEvent.change(screen.getByLabelText('Especialidade artística'), { target: { value: 'colorimetry' } });
  fireEvent.change(screen.getByLabelText('Duração da avaliação'), { target: { value: '30' } });
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
  await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ specialty: 'colorimetry', price_type: 'quote', duration_min: 30 })));
  expect(screen.queryByLabelText('Especialidade artística')).toBeNull();
});
