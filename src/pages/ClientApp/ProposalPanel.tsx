import { useRef, useState } from "react";
import { useResource } from "../../hooks/useResource";
import { acceptProposal, declineProposal, getProposalSlots, type Proposal, type SlotsResponse } from "../../services/schedulingService";
import { appointmentDate, localDate, money, time } from "../../utils/format";
import styles from "./ClientApp.module.css";

const STATUS = { accepted: "Orçamento aceito · procedimento reservado", declined: "Orçamento recusado", expired: "Orçamento vencido · peça uma revisão ao studio", superseded: "Versão anterior" };
export function ProposalPanel({ proposal: p, consultationStatus, onChanged }: { proposal: Proposal; consultationStatus: string; onChanged: (message?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const evaluationAllowsResponse = ["quote", "completed"].includes(consultationStatus);
  const valid = evaluationAllowsResponse && p.status === "sent" && Date.parse(p.expires_at) > Date.now();
  const unavailableReason = consultationStatus === "cancelled"
    ? "Esta avaliação foi cancelada. O orçamento fica no histórico e não pode ser aceito."
    : "Foi registrada falta nesta avaliação. O orçamento fica no histórico e não pode ser aceito.";
  const slots = useResource<SlotsResponse>(signal => open && day && valid ? getProposalSlots(p.id, day, signal) : Promise.resolve({ date: "", duration_min: p.duration_min, slots: [] as string[] }), [open, day, p.id, p.version, valid]);
  async function submit(accept: boolean) {
    if (saving.current || !valid || (accept && (!slot || slots.loading || !slots.data?.slots.includes(slot)))) return;
    saving.current = true; setPending(true); setError("");
    try {
      if (accept) await acceptProposal(p.id, p.version, slot);
      else await declineProposal(p.id, p.version);
      onChanged(accept ? "Procedimento reservado. A avaliação permanece no seu histórico." : "Orçamento recusado. Fale com o studio para rever o plano.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o orçamento.");
      setSlot(""); slots.reload();
    } finally { saving.current = false; setPending(false); }
  }
  return <section className={styles.proposal} aria-label={`Orçamento do procedimento, versão ${p.version}`}>
    <div><h4>Orçamento do procedimento</h4><p className={styles.muted}>Versão {p.version} · {p.status === "sent" ? evaluationAllowsResponse ? `Válido até ${appointmentDate(p.expires_at)}` : "Orçamento no histórico" : STATUS[p.status]}</p></div>
    <dl className={styles.proposalFacts}><div><dt>Total</dt><dd>{money(p.price)}</dd></div><div><dt>Sinal de 50%</dt><dd>{money(p.deposit_amount)}</dd></div><div><dt>Tempo reservado</dt><dd>{p.duration_min} min</dd></div></dl>
    {p.notes && <p className={styles.planNote}>{p.notes}</p>}
    {valid && <><p className={styles.muted}>O procedimento terá outro dia e horário. A reserva ocupará os {p.duration_min} minutos completos na agenda do Elcio.</p>
      <div className={styles.bookingActions}><button className={styles.cta} disabled={pending} aria-expanded={open} onClick={() => { setOpen(v => !v); setDeclining(false); setSlot(""); }}>Escolher horário do procedimento</button><button className={styles.secondary} disabled={pending} onClick={() => { setDeclining(true); setOpen(false); }}>Recusar orçamento</button></div>
    </>}
    {p.status === "sent" && !evaluationAllowsResponse && <p className={styles.muted}>{unavailableReason}</p>}
    {p.status === "sent" && evaluationAllowsResponse && !valid && <p className={styles.muted}>{STATUS.expired}</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {declining && <div className={styles.confirmBox}><p>Quer recusar este orçamento? Você pode combinar uma nova proposta com o Elcio.</p><div className={styles.bookingActions}><button className={styles.danger} disabled={pending} onClick={() => void submit(false)}>Confirmar recusa</button><button className={styles.secondary} disabled={pending} onClick={() => setDeclining(false)}>Voltar</button></div></div>}
    {open && valid && <fieldset className={styles.reBox} disabled={pending}>
      <legend>Agendar o procedimento</legend>
      <label className={styles.dateField}>Data do procedimento<input type="date" className={styles.input} min={localDate()} value={day} onChange={e => { setDay(e.target.value); setSlot(""); }} /></label>
      <p className={styles.muted}>Horário de Brasília · {p.duration_min} minutos reservados</p>
      {slots.error && <div className={styles.error} role="alert"><p>{slots.error}</p><button className={styles.secondary} type="button" onClick={slots.reload}>Consultar horários novamente</button></div>}
      {day && (slots.loading ? <p role="status">Buscando horários para o procedimento…</p> : !slots.error && !slots.data?.slots.length ? <p>{slots.data?.reason || "Sem espaço para o procedimento completo. Escolha outro dia."}</p> : <div className={styles.slots}>{slots.data?.slots.map(value => <button type="button" key={value} className={slot === value ? styles.slotOn : styles.slot} aria-pressed={slot === value} onClick={() => setSlot(value)}>{time(value)}</button>)}</div>)}
      {slot && <div className={styles.proposalReview}><p><strong>{appointmentDate(slot)} até {time(new Date(Date.parse(slot) + p.duration_min * 60_000).toISOString())}</strong></p><p>Total de {money(p.price)}. Sinal de {money(p.deposit_amount)} após reservar.</p><button className={styles.cta} disabled={pending || slots.loading || !slots.data?.slots.includes(slot)} onClick={() => void submit(true)}>{pending ? "Reservando procedimento…" : "Aceitar e agendar procedimento"}</button></div>}
    </fieldset>}
  </section>;
}
