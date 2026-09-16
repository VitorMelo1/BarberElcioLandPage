export { localDate, time as timeLabel } from '../../utils/format';
export const money = (value: string | number = 0) => new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'}).format(Number(value));
export const prettyDay = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {weekday:'long', day:'numeric', month:'long'});
export const statusLabel: Record<string,string> = {quote:'Avaliação', pending:'Aguardando confirmação', scheduled:'Agendado', confirmed:'Confirmado', completed:'Finalizado', cancelled:'Cancelado', noshow:'Não compareceu', no_show:'Não compareceu'};
