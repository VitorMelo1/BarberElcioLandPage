import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarDays, Gift, Globe, LogOut, Settings, Trophy, Users, Wallet } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { AgendaCalendar } from "./AgendaCalendar";
import { PaymentSettingsPanel } from "./PaymentSettingsPanel";
import { FinanceiroPanel } from "./FinanceiroPanel";
import { getBarberCustomers, updateBarberPromotion, updateBarberGift, type BarberCustomer } from "../../services/barberService";
import { createLoyaltyTier, updateLoyaltyTier, getLoyaltyTiers, type LoyaltyTier } from "../../services/loyaltyService";
import {
  createGift,
  createPromotion,
  getAdminGifts,
  getAdminPromotions,
  type ClientGift,
  type Promotion,
} from "../../services/promotionsService";
import {
  createDiscountTier,
  createPlan,
  createPortfolioImage,
  createService,
  deleteDiscountTier,
  deletePlan,
  deletePortfolioImage,
  deleteService,
  getAdminDiscountTiers,
  getAdminPlans,
  getAdminPortfolioImages,
  getAdminServices,
  updateDiscountTier,
  updatePlan,
  updatePortfolioImage,
  updateService,
  type ApiDiscountTier,
  type ApiPlan,
  type ApiPortfolioImage,
  type ApiService,
} from "../../services/catalogService";
import { SiteContentPanel } from "./SiteContentPanel";
import { LoyaltyPanel, PromotionsPanel } from "./RelationshipPanels";
import { CustomersPanel } from "./CustomersPanel";
import { GoogleCalendarCard } from "./GoogleCalendarCard";
import styles from "./BarberApp.module.css";

type Tab = "agenda" | "clientes" | "caixa" | "ajustes";
type Ajuste = "fidelidade" | "promocoes" | "site" | "pagamentos";
type AsyncState = "idle" | "loading" | "error";

const NAV = [
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "caixa", label: "Caixa", icon: Wallet },
  { id: "ajustes", label: "Ajustes", icon: Settings },
] as const;

const AJUSTES = [
  { id: "pagamentos", label: "Pagamentos", icon: Wallet },
  { id: "fidelidade", label: "Fidelidade", icon: Trophy },
  { id: "promocoes", label: "Promo\u00e7\u00f5es", icon: Gift },
  { id: "site", label: "Site & Pre\u00e7os", icon: Globe },
] as const;

export function BarberApp() {
  const { user, logout } = useAuth();
  const [params,setParams] = useSearchParams();
  const tab = (NAV.some(item=>item.id===params.get("tab")) ? params.get("tab") : "agenda") as Tab;
  const ajuste = (AJUSTES.some(item=>item.id===params.get("settings")) ? params.get("settings") : "fidelidade") as Ajuste;
  const setTab = (value:Tab)=>setParams(previous=>{previous.set("tab",value);return previous;});
  const setAjuste = (value:Ajuste)=>setParams(previous=>{previous.set("settings",value);return previous;});
  const [customers, setCustomers] = useState<BarberCustomer[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [gifts, setGifts] = useState<ClientGift[]>([]);
  const [siteServices, setSiteServices] = useState<ApiService[]>([]);
  const [sitePlans, setSitePlans] = useState<ApiPlan[]>([]);
  const [siteDiscounts, setSiteDiscounts] = useState<ApiDiscountTier[]>([]);
  const [siteImages, setSiteImages] = useState<ApiPortfolioImage[]>([]);
  const [state, setState] = useState<AsyncState>("idle");
  const [message, setMessage] = useState("");
  const [readFailed,setReadFailed] = useState(false);
  const [reload,setReload] = useState(0);
  const mutating = useRef(false);

  useEffect(() => {
    let active = true;
    if (tab === "agenda" || tab === "caixa") return;
    setState("loading");setMessage("");setReadFailed(false);
    const load = async () => {
      try {
        if(tab === "clientes") { const data = await getBarberCustomers(); if(active)setCustomers(data); }
        else if(ajuste === "fidelidade") { const data = await getLoyaltyTiers(); if(active)setTiers(data); }
        else if(ajuste === "promocoes") { const [promos,gifts,clients] = await Promise.all([getAdminPromotions(),getAdminGifts(),getBarberCustomers()]); if(active){setPromotions(promos);setGifts(gifts);setCustomers(clients);} }
        else if(ajuste === "site") {const [services,plans,discounts,images] = await Promise.all([getAdminServices(),getAdminPlans(),getAdminDiscountTiers(),getAdminPortfolioImages()]);if(active){setSiteServices(services);setSitePlans(plans);setSiteDiscounts(discounts);setSiteImages(images);}}
        if(active)setState("idle");
      } catch(error){if(active){setReadFailed(true);setState("error");setMessage(error instanceof Error ? error.message : "Não foi possível carregar. Tente novamente.");}}
    };
    void load();return()=>{active=false;};
  }, [tab, ajuste, reload]);

  async function run(action: () => Promise<void>, success?: string) {
    if(mutating.current)return false;
    mutating.current=true;
    setState("loading");
    setMessage("");
    try {
      await action();
      if (success) setMessage(success);
      setState("idle");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível completar a ação.");
      setState("error");
      return false;
    } finally {mutating.current=false;}
  }

  const displayName = user?.username?.replace(/_/g, " ") || "Barbeiro";
  const initials = (user?.username || "?").slice(0, 2).toUpperCase();
  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const loading = state === "loading";

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link to="/" className={styles.logoLink}>
          <img src="/images/logo.png" alt="Studio do Bruxo dos Cabelos" className={styles.logo} />
        </Link>
        <nav className={styles.nav} aria-label="Painel do barbeiro">
          {NAV.map((n) => (
            <button
              key={n.id}
              aria-current={tab === n.id ? "page" : undefined}
              className={tab === n.id ? styles.navItemOn : styles.navItem}
              onClick={() => setTab(n.id)}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <p className={styles.sideQuote}>
          “A tesoura é pincel.
          <br />
          O cabelo é tela.”
        </p>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.welcomeBox}>
            <p className={styles.eyebrow}>Painel do barbeiro</p>
            <h1 className={styles.welcome}>Bruxo dos Cabelos</h1>
            <p className={styles.welcomeSub}>{dateLabel}</p>
          </div>
          <div className={styles.userChip}>
            <span className={styles.avatar}>{initials}</span>
            <div className={styles.userInfo}>
              <b>{displayName}</b>
              <small>Barbeiro</small>
            </div>
            <button className={styles.logoutBtn} onClick={() => void logout()} aria-label="Sair">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {message && (
          <p className={state === "error" ? styles.toastErr : styles.toastOk} role="status">
            {message}
          </p>
        )}

        <div className={styles.content}>

          {tab === "agenda" && <AgendaCalendar />}
          {tab === "ajustes" && <GoogleCalendarCard />}

          {tab === "clientes" && <CustomersPanel customers={customers} loading={loading} error={state === "error" ? message : ""} onRetry={async()=>setReload(v=>v+1)} />}

          {tab === "caixa" && <FinanceiroPanel />}

          {tab === "ajustes" && readFailed && <p role="alert">Dados indisponíveis. <button className={styles.btnGhost} onClick={()=>setReload(v=>v+1)}>Tentar novamente</button></p>}
          {tab === "ajustes" && !readFailed && (
            <>
              <div className={styles.subnav} role="group" aria-label="Ajustes">
                {AJUSTES.map((a) => (
                  <button
                    key={a.id}
                    aria-pressed={ajuste === a.id}
                    className={ajuste === a.id ? styles.subTabOn : styles.subTab}
                    onClick={() => setAjuste(a.id)}
                  >
                    <a.icon size={15} />
                    {a.label}
                  </button>
                ))}
              </div>

              {ajuste === "pagamentos" && <PaymentSettingsPanel />}
              {ajuste === "fidelidade" && (
                <LoyaltyPanel
                  tiers={tiers}
                  loading={loading}
                  onUpdate={(id,payload)=>run(async()=>{const item=await updateLoyaltyTier(id,payload);setTiers(current=>current.map(value=>value.id===id?item:value));},"Nível atualizado.")}
                  onCreate={(payload) =>
                    run(async () => {
                      const item = await createLoyaltyTier(payload);
                      setTiers(current=>[...current,item]);
                    }, "Nível de fidelidade criado.")
                  }
                />
              )}

              {ajuste === "promocoes" && (
                <PromotionsPanel
                  promotions={promotions}
                  gifts={gifts}
                  customers={customers}
                  loading={loading}
                  onCreatePromotion={(payload) =>
                    run(async () => {
                      const item = await createPromotion(payload);
                      setPromotions(current=>[...current,item]);
                    }, "Promoção publicada.")
                  }
                  onCreateGift={(payload) =>
                    run(async () => {
                      const item = await createGift(payload);
                      setGifts(current=>[...current,item]);
                    }, "Brinde liberado.")
                  }
                  onUpdatePromotion={(id,payload)=>run(async()=>{const item=await updateBarberPromotion(id,payload);setPromotions(current=>current.map(value=>value.id===id?item:value));},"Promoção atualizada.")}
                  onUpdateGift={(id,payload)=>run(async()=>{const item=await updateBarberGift(id,payload);setGifts(current=>current.map(value=>value.id===id?item:value));},"Brinde atualizado.")}
                />
              )}
            </>
          )}

          {tab === "ajustes" && ajuste === "site" && !readFailed && (
            <SiteContentPanel
              services={siteServices}
              plans={sitePlans}
              discounts={siteDiscounts}
              images={siteImages}
              loading={loading}
              onCreateService={(payload) =>
                run(async () => {
                  const item = await createService(payload);
                      setSiteServices(current=>[...current,item]);
                }, "Serviço publicado no site.")
              }
              onUpdateService={(id, payload) =>
                run(async () => {
                  const item = await updateService(id,payload);
                  setSiteServices(current=>current.map(value=>value.id===id?item:value));
                }, "Serviço atualizado.")
              }
              onDeleteService={(id) =>
                run(async () => {
                  await deleteService(id);
                  setSiteServices(current=>current.map(value=>value.id===id?{...value,active:false}:value));
                }, "Serviço removido do site.")
              }
              onCreatePlan={(payload) =>
                run(async () => {
                  const item = await createPlan(payload);
                      setSitePlans(current=>[...current,item]);
                }, "Plano publicado no site.")
              }
              onUpdatePlan={(id, payload) =>
                run(async () => {
                  const item = await updatePlan(id,payload);
                  setSitePlans(current=>current.map(value=>value.id===id?item:value));
                }, "Plano atualizado.")
              }
              onDeletePlan={(id) =>
                run(async () => {
                  await deletePlan(id);
                  setSitePlans(current=>current.map(value=>value.id===id?{...value,active:false}:value));
                }, "Plano removido do site.")
              }
              onCreateDiscount={(payload) =>
                run(async () => {
                  const item = await createDiscountTier(payload);
                      setSiteDiscounts(current=>[...current,item]);
                }, "Faixa de desconto publicada.")
              }
              onUpdateDiscount={(id, payload) =>
                run(async () => {
                  const item = await updateDiscountTier(id,payload);
                  setSiteDiscounts(current=>current.map(value=>value.id===id?item:value));
                }, "Faixa de desconto atualizada.")
              }
              onDeleteDiscount={(id) =>
                run(async () => {
                  await deleteDiscountTier(id);
                  setSiteDiscounts(current=>current.map(value=>value.id===id?{...value,active:false}:value));
                }, "Faixa de desconto removida.")
              }
              onCreateImage={(payload) =>
                run(async () => {
                  const item = await createPortfolioImage(payload);
                      setSiteImages(current=>[...current,item]);
                }, "Imagem publicada no portfólio.")
              }
              onUpdateImage={(id, payload) =>
                run(async () => {
                  const item = await updatePortfolioImage(id,payload);
                  setSiteImages(current=>current.map(value=>value.id===id?item:value));
                }, "Imagem atualizada.")
              }
              onDeleteImage={(id) =>
                run(async () => {
                  await deletePortfolioImage(id);
                  setSiteImages(current=>current.filter(value=>value.id!==id));
                }, "Imagem removida do portfólio.")
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
