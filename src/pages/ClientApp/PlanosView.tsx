import { useEffect, useState } from "react";
import { Check, Copy, Crown, RefreshCw } from "lucide-react";
import { useResource } from "../../hooks/useResource";
import { getPlans } from "../../services/catalogService";
import { getPlanPaymentStatus, getPlanSubscriptions, subscribePlan, type PlanPurchase } from "../../services/financeService";
import { money } from "../../utils/format";
import styles from "./ClientApp.module.css";

export function PlanosView() {
  const plans = useResource(() => getPlans(), []);
  const subscriptions = useResource(() => getPlanSubscriptions(), []);
  const [purchase, setPurchase] = useState<PlanPurchase | null>(null);
  const [buying, setBuying] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!purchase || purchase.subscription.status !== "pending" || purchase.requires_review) return;
    const controller = new AbortController();
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      if (controller.signal.aborted || document.visibilityState === "hidden") {
        timer = setTimeout(check, 10_000); return;
      }
      try {
        const result = await getPlanPaymentStatus(purchase.subscription.id, controller.signal);
        if (controller.signal.aborted) return;
        setPurchase(result);
        if (result.subscription.status === "active") { subscriptions.reload(); return; }
        if (++attempts < 30 && result.payment_status === "pending") timer = setTimeout(check, 10_000);
      } catch { if (++attempts < 30) timer = setTimeout(check, 10_000); }
    };
    timer = setTimeout(check, 10_000);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [purchase?.subscription.id, purchase?.subscription.status, purchase?.requires_review]);

  async function buy(planId: number) {
    if (buying !== null) return;
    setBuying(planId); setError(""); setCopied(false);
    try { setPurchase(await subscribePlan(planId)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível preparar o pagamento do plano."); }
    finally { setBuying(null); }
  }
  async function checkNow() {
    if (!purchase || checking) return;
    setChecking(true); setError("");
    try {
      const result = await getPlanPaymentStatus(purchase.subscription.id);
      setPurchase(result);
      if (result.subscription.status === "active") subscriptions.reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível conferir o pagamento."); }
    finally { setChecking(false); }
  }
  async function copy() {
    if (!purchase?.brcode) return;
    try { await navigator.clipboard.writeText(purchase.brcode); setCopied(true); }
    catch { setError("Selecione o código e copie manualmente."); }
  }

  return <div className={styles.view}>
    <div className={styles.viewHeading}><div><h2>Planos do studio</h2><p>Assine e pague por PIX sem sair do aplicativo.</p></div><Crown aria-hidden size={32} /></div>
    <p className={styles.quoteNote}>O valor cobre 30 dias a partir da aprovação do pagamento. A renovação não é automática.</p>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {plans.loading || subscriptions.loading ? <p role="status">Carregando planos…</p> : null}
    {plans.error && <div className={styles.error} role="alert"><p>{plans.error}</p><button className={styles.secondary} onClick={plans.reload}>Tentar novamente</button></div>}
    {!plans.loading && !plans.error && !plans.data?.length && <p className={styles.empty}>Nenhum plano disponível no momento. Você pode agendar um atendimento avulso.</p>}
    <div className={styles.cards}>{plans.data?.filter(plan => plan.active).map(plan => {
      const subscription = subscriptions.data?.find(item => item.plan === plan.id && ["pending", "active", "review"].includes(item.status));
      return <article className={styles.plan} key={plan.id}>
        <h3>{plan.name}</h3><p>{plan.items}</p>
        <div className={styles.planPrice}>{Number(plan.price_from) > Number(plan.price) && <del>{money(plan.price_from)}</del>}<strong>{money(plan.price)}<small>/30 dias</small></strong></div>
        {subscription?.status === "active" ? <p className={styles.successMini}><Check size={18} /> Plano ativo até {subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString("pt-BR") : "a data informada"}</p>
          : <button className={styles.cta} disabled={buying !== null} onClick={() => void buy(plan.id)}>{buying === plan.id ? "Preparando PIX…" : subscription?.status === "pending" ? `Continuar pagamento de ${plan.name}` : `Assinar ${plan.name}`}</button>}
      </article>;
    })}</div>
    {purchase && <section className={styles.planCheckout} aria-label="Pagamento do plano">
      {purchase.subscription.status === "active" ? <p className={styles.successMini} role="status"><Check size={20} /> Pagamento aprovado. Seu plano já está ativo.</p> : purchase.requires_review ? <p role="status">Este pagamento precisa de conferência do studio. Não pague novamente.</p> : <>
        <h3>PIX de {money(purchase.amount)} · {purchase.subscription.plan_name}</h3>
        <p>Abra o banco, pague pelo QR Code ou copie o código abaixo.</p>
        {purchase.qr_code_base64 && <img className={styles.pixQr} src={`data:image/png;base64,${purchase.qr_code_base64}`} alt="QR Code PIX da assinatura" />}
        <code className={styles.pixCode}>{purchase.brcode}</code>
        <div className={styles.bookingActions}><button className={styles.cta} onClick={() => void copy()}>{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "Copiado!" : "Copiar código PIX"}</button><button className={styles.secondary} disabled={checking} onClick={() => void checkNow()}><RefreshCw size={17} />{checking ? "Consultando…" : "Já paguei, consultar"}</button></div>
      </>}
    </section>}
  </div>;
}
