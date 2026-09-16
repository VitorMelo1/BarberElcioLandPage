/** Keep only supported client parameters; never follow an external or arbitrary route. */
export function clientDestination(candidate: string | null | undefined): string {
  if (!candidate || !/^\/app(?:\?|$)/.test(candidate)) return "/app";
  const query = new URLSearchParams(candidate.slice(4));
  const safe = new URLSearchParams();
  const services = query.get("servicos");
  if (services && /^\d+(,\d+)*$/.test(services) && services.length <= 200) safe.set("servicos", services);
  const tab = query.get("aba");
  if (tab && ["historico", "planos", "conta"].includes(tab)) safe.set("aba", tab);
  const payment = query.get("pagamento");
  if (payment && /^\d+$/.test(payment)) safe.set("pagamento", payment);
  return `/app${safe.size ? `?${safe}` : ""}`;
}
