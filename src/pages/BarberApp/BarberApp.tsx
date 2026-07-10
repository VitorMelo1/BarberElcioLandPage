import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  Gift,
  Globe,
  ImagePlus,
  LogOut,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Trash2,
  Trophy,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import {
  disconnectGoogle,
  getGoogleConnectUrl,
  getGoogleStatus,
  type GoogleStatus,
} from "../../services/integrationsService";
import { FinanceiroPanel } from "./FinanceiroPanel";
import {
  cancelBarberBooking,
  completeBarberBooking,
  getBarberBookings,
  getBarberCustomers,
  rescheduleBarberBooking,
  type BarberCustomer,
} from "../../services/barberService";
import { createLoyaltyTier, getLoyaltyTiers, type LoyaltyTier } from "../../services/loyaltyService";
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
import type { Booking } from "../../services/schedulingService";
import styles from "./BarberApp.module.css";

type Tab = "agenda" | "clientes" | "fidelidade" | "promocoes" | "caixa" | "site";
type AsyncState = "idle" | "loading" | "error";

const NAV = [
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "fidelidade", label: "Fidelidade", icon: Trophy },
  { id: "promocoes", label: "Promos", icon: Gift },
  { id: "caixa", label: "Caixa", icon: Wallet },
  { id: "site", label: "Site", icon: Globe },
] as const;

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Finalizado",
  cancelled: "Cancelado",
};

const today = () => new Date().toISOString().slice(0, 10);

const timeLabel = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const moneyLabel = (value?: string) => {
  const parsed = Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parsed);
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `item-${Date.now()}`;

function statusClass(status: string) {
  if (status === "completed") return styles.pillDone;
  if (status === "cancelled") return styles.pillOff;
  return styles.pillLive;
}

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className={styles.skeleton} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}

function Empty({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>{icon}</span>
      <p>{text}</p>
    </div>
  );
}

export function BarberApp() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("agenda");
  const [date, setDate] = useState(today());
  const [bookings, setBookings] = useState<Booking[]>([]);
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

  const metrics = useMemo(() => {
    const active = bookings.filter((booking) => booking.status !== "cancelled");
    const completed = bookings.filter((booking) => booking.status === "completed").length;
    const revenue = active.reduce((sum, booking) => sum + Number(booking.total_price || 0), 0);
    return { pending: active.length, completed, revenue };
  }, [bookings]);

  useEffect(() => {
    void loadAgenda();
  }, [date]);

  useEffect(() => {
    if (tab === "clientes") void loadCustomers();
    if (tab === "fidelidade") void loadTiers();
    if (tab === "promocoes") void loadPromotions();
    if (tab === "site") void loadSiteContent();
  }, [tab]);

  async function run(action: () => Promise<void>, success?: string) {
    setState("loading");
    setMessage("");
    try {
      await action();
      if (success) setMessage(success);
      setState("idle");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível completar a ação.");
      setState("error");
    }
  }

  async function loadAgenda() {
    await run(async () => {
      setBookings(await getBarberBookings(date));
    });
  }

  async function loadCustomers() {
    await run(async () => {
      setCustomers(await getBarberCustomers());
    });
  }

  async function loadTiers() {
    await run(async () => {
      setTiers(await getLoyaltyTiers());
    });
  }

  async function loadPromotions() {
    await run(async () => {
      const [nextPromotions, nextGifts] = await Promise.all([getAdminPromotions(), getAdminGifts()]);
      setPromotions(nextPromotions);
      setGifts(nextGifts);
    });
  }

  async function loadSiteContent() {
    await run(async () => {
      const [services, plans, discounts, images] = await Promise.all([
        getAdminServices(),
        getAdminPlans(),
        getAdminDiscountTiers(),
        getAdminPortfolioImages(),
      ]);
      setSiteServices(services);
      setSitePlans(plans);
      setSiteDiscounts(discounts);
      setSiteImages(images);
    });
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
        <nav className={styles.nav}>
          {NAV.map((n) => (
            <button
              key={n.id}
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

        <div className={styles.stats} aria-label="Resumo do dia">
          <article className={styles.statCard}>
            <span className={styles.statIcon}>
              <CalendarDays size={19} />
            </span>
            <div>
              <strong className={styles.statValue}>{metrics.pending}</strong>
              <small>horários no dia</small>
            </div>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statIcon}>
              <CheckCircle2 size={19} />
            </span>
            <div>
              <strong className={styles.statValue}>{metrics.completed}</strong>
              <small>finalizados</small>
            </div>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statIcon}>
              <Wallet size={19} />
            </span>
            <div>
              <strong className={styles.statValue}>{moneyLabel(String(metrics.revenue))}</strong>
              <small>caixa do dia</small>
            </div>
          </article>
        </div>

        {message && (
          <p className={state === "error" ? styles.toastErr : styles.toastOk} role="status">
            {message}
          </p>
        )}

        <div className={styles.content}>
          {tab === "agenda" && <GoogleCalendarCard />}
          {tab === "agenda" && (
            <AgendaPanel
              bookings={bookings}
              date={date}
              loading={loading}
              onDateChange={setDate}
              onCancel={(booking) =>
                void run(async () => {
                  await cancelBarberBooking(booking.id, "Cancelado pelo painel do barbeiro");
                  await loadAgenda();
                }, "Horário cancelado.")
              }
              onComplete={(booking) =>
                void run(async () => {
                  await completeBarberBooking(booking.id);
                  await loadAgenda();
                }, "Atendimento finalizado.")
              }
              onReschedule={(booking, newStart) =>
                void run(async () => {
                  await rescheduleBarberBooking(booking.id, newStart);
                  await loadAgenda();
                }, "Horário reagendado.")
              }
            />
          )}

          {tab === "clientes" && <CustomersPanel customers={customers} loading={loading} />}

          {tab === "fidelidade" && (
            <LoyaltyPanel
              tiers={tiers}
              loading={loading}
              onCreate={(payload) =>
                void run(async () => {
                  await createLoyaltyTier(payload);
                  await loadTiers();
                }, "Nível de fidelidade criado.")
              }
            />
          )}

          {tab === "promocoes" && (
            <PromotionsPanel
              promotions={promotions}
              gifts={gifts}
              customers={customers}
              loading={loading}
              onCreatePromotion={(payload) =>
                void run(async () => {
                  await createPromotion(payload);
                  await loadPromotions();
                }, "Promoção publicada.")
              }
              onCreateGift={(payload) =>
                void run(async () => {
                  await createGift(payload);
                  await loadPromotions();
                }, "Brinde liberado.")
              }
              onNeedCustomers={loadCustomers}
            />
          )}

          {tab === "caixa" && <FinanceiroPanel />}

          {tab === "site" && (
            <SiteContentPanel
              services={siteServices}
              plans={sitePlans}
              discounts={siteDiscounts}
              images={siteImages}
              loading={loading}
              onCreateService={(payload) =>
                void run(async () => {
                  await createService(payload);
                  await loadSiteContent();
                }, "Serviço publicado no site.")
              }
              onUpdateService={(id, payload) =>
                void run(async () => {
                  await updateService(id, payload);
                  await loadSiteContent();
                }, "Serviço atualizado.")
              }
              onDeleteService={(id) =>
                void run(async () => {
                  await deleteService(id);
                  await loadSiteContent();
                }, "Serviço removido do site.")
              }
              onCreatePlan={(payload) =>
                void run(async () => {
                  await createPlan(payload);
                  await loadSiteContent();
                }, "Plano publicado no site.")
              }
              onUpdatePlan={(id, payload) =>
                void run(async () => {
                  await updatePlan(id, payload);
                  await loadSiteContent();
                }, "Plano atualizado.")
              }
              onDeletePlan={(id) =>
                void run(async () => {
                  await deletePlan(id);
                  await loadSiteContent();
                }, "Plano removido do site.")
              }
              onCreateDiscount={(payload) =>
                void run(async () => {
                  await createDiscountTier(payload);
                  await loadSiteContent();
                }, "Faixa de desconto publicada.")
              }
              onUpdateDiscount={(id, payload) =>
                void run(async () => {
                  await updateDiscountTier(id, payload);
                  await loadSiteContent();
                }, "Faixa de desconto atualizada.")
              }
              onDeleteDiscount={(id) =>
                void run(async () => {
                  await deleteDiscountTier(id);
                  await loadSiteContent();
                }, "Faixa de desconto removida.")
              }
              onCreateImage={(payload) =>
                void run(async () => {
                  await createPortfolioImage(payload);
                  await loadSiteContent();
                }, "Imagem publicada no portfólio.")
              }
              onUpdateImage={(id, payload) =>
                void run(async () => {
                  await updatePortfolioImage(id, payload);
                  await loadSiteContent();
                }, "Imagem atualizada.")
              }
              onDeleteImage={(id) =>
                void run(async () => {
                  await deletePortfolioImage(id);
                  await loadSiteContent();
                }, "Imagem removida do portfólio.")
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── GOOGLE CALENDAR ─────────────────── */

function GoogleCalendarCard() {
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("google");
    if (flag === "conectado") setNotice("Google Calendar conectado! Agendamentos entram sozinhos na sua agenda.");
    if (flag === "erro") setNotice("Não rolou conectar o Google Calendar — tenta de novo.");
    if (flag) window.history.replaceState({}, "", "/barber");
    getGoogleStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  async function connect() {
    try {
      const { auth_url } = await getGoogleConnectUrl();
      window.location.href = auth_url;
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Não deu pra iniciar a conexão.");
    }
  }

  async function disconnect() {
    try {
      await disconnectGoogle();
      setStatus((current) => (current ? { ...current, connected: false, email: "" } : current));
      setNotice("Google Calendar desconectado.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Não deu pra desconectar.");
    }
  }

  // Enquanto o Google não estiver liberado no servidor, nem mostra o card —
  // nada de mensagem técnica pro barbeiro. Quando liberar, ele conecta sozinho.
  if (!status || !status.configured) return null;

  return (
    <div className={styles.googleStrip}>
      <span className={styles.googleIcon}>
        <CalendarDays size={17} />
      </span>
      {status.connected ? (
        <>
          <div className={styles.googleInfo}>
            <b>Google Calendar sincronizado</b>
            <small>{status.email || "conta conectada"} — cada horário vira evento na sua agenda</small>
          </div>
          <button className={styles.btnGhost} onClick={() => void disconnect()}>
            Desconectar
          </button>
        </>
      ) : (
        <>
          <div className={styles.googleInfo}>
            <b>Conecte seu Google Calendar</b>
            <small>Todo agendamento entra sozinho na agenda do seu celular</small>
          </div>
          <button className={styles.btnSmall} onClick={() => void connect()}>
            Conectar
          </button>
        </>
      )}
      {notice && <em className={styles.googleNotice}>{notice}</em>}
    </div>
  );
}

/* ─────────────────── AGENDA ─────────────────── */

function AgendaPanel({
  bookings,
  date,
  loading,
  onDateChange,
  onCancel,
  onComplete,
  onReschedule,
}: {
  bookings: Booking[];
  date: string;
  loading: boolean;
  onDateChange: (date: string) => void;
  onCancel: (booking: Booking) => void;
  onComplete: (booking: Booking) => void;
  onReschedule: (booking: Booking, newStart: string) => void;
}) {
  const [rescheduleFor, setRescheduleFor] = useState<number | null>(null);
  const [newStart, setNewStart] = useState("");

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <p className={styles.panelEyebrow}>Operação</p>
          <h2 className={styles.panelTitle}>Agenda do dia</h2>
        </div>
        <input
          className={styles.dateInput}
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
        />
      </div>

      {loading && <Skeleton />}
      {!loading && bookings.length === 0 && (
        <Empty icon={<CalendarDays size={26} />} text="Nenhum horário nesse dia. Cadeira livre pra criar." />
      )}

      <div className={styles.timeline}>
        {bookings.map((booking) => (
          <article className={styles.bookingCard} key={booking.id}>
            <div className={styles.bookingTime}>
              <strong>{timeLabel(booking.start)}</strong>
              <span>{timeLabel(booking.end)}</span>
            </div>
            <div className={styles.bookingInfo}>
              <h3>{booking.client_username || "Cliente"}</h3>
              <p>
                <Phone size={12} /> {booking.client_phone || "Sem telefone cadastrado"}
              </p>
              <div className={styles.bookingMeta}>
                <span className={statusClass(booking.status)}>
                  {STATUS_LABEL[booking.status] || booking.status}
                </span>
                <span className={styles.price}>{moneyLabel(booking.total_price)}</span>
              </div>
            </div>
            <div className={styles.actionGrid}>
              <button
                className={styles.actDone}
                onClick={() => onComplete(booking)}
                aria-label="Finalizar"
                title="Finalizar atendimento"
              >
                <CheckCircle2 size={18} />
              </button>
              <button
                className={styles.actMove}
                onClick={() => setRescheduleFor(rescheduleFor === booking.id ? null : booking.id)}
                aria-label="Reagendar"
                title="Reagendar"
              >
                <RotateCcw size={18} />
              </button>
              <button
                className={styles.actKill}
                onClick={() => onCancel(booking)}
                aria-label="Cancelar"
                title="Cancelar horário"
              >
                <XCircle size={18} />
              </button>
            </div>
            {rescheduleFor === booking.id && (
              <form
                className={styles.inlineForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!newStart) return;
                  onReschedule(booking, newStart);
                  setRescheduleFor(null);
                  setNewStart("");
                }}
              >
                <input
                  type="datetime-local"
                  value={newStart}
                  onChange={(event) => setNewStart(event.target.value)}
                />
                <button type="submit" className={styles.btnSmall}>
                  Mover
                </button>
              </form>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────── CLIENTES ─────────────────── */

function CustomersPanel({ customers, loading }: { customers: BarberCustomer[]; loading: boolean }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <p className={styles.panelEyebrow}>Relacionamento</p>
          <h2 className={styles.panelTitle}>Clientes na mão</h2>
        </div>
      </div>
      {loading && <Skeleton />}
      {!loading && customers.length === 0 && (
        <Empty icon={<Users size={26} />} text="Nenhum cliente com histórico ainda." />
      )}
      <div className={styles.customerList}>
        {customers.map((customer) => (
          <article className={styles.customerCard} key={customer.id}>
            <span className={styles.customerAvatar}>{customer.username.slice(0, 2).toUpperCase()}</span>
            <div className={styles.customerInfo}>
              <h3>{customer.username}</h3>
              <p>{customer.phone || customer.email || "Contato não informado"}</p>
              <div className={styles.customerStats}>
                <span className={customer.loyalty.tier ? styles.tierBadgeOn : styles.tierBadge}>
                  <Crown size={12} />
                  {customer.loyalty.tier?.name || "Sem nível"}
                </span>
                <span>{customer.completed_bookings_year} no ano</span>
                <span>{customer.total_bookings} total</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────── FIDELIDADE ─────────────────── */

function LoyaltyPanel({
  tiers,
  loading,
  onCreate,
}: {
  tiers: LoyaltyTier[];
  loading: boolean;
  onCreate: (payload: Omit<LoyaltyTier, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [months, setMonths] = useState(1);
  const [bookings, setBookings] = useState(3);
  const [discount, setDiscount] = useState("5.00");

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <p className={styles.panelEyebrow}>Recorrência</p>
          <h2 className={styles.panelTitle}>Níveis de fidelidade</h2>
        </div>
      </div>

      <form
        className={styles.editorForm}
        onSubmit={(event) => {
          event.preventDefault();
          onCreate({
            name: name || "Cliente fiel",
            min_months: months,
            min_completed_bookings_year: bookings,
            discount_percent: discount,
            order: tiers.length + 1,
            active: true,
          });
          setName("");
        }}
      >
        <div className={styles.formHeader}>
          <Plus size={16} />
          <strong>Novo nível</strong>
        </div>
        <Field label="Nome do nível" hint="Ex.: Aprendiz, Feiticeiro, Bruxo Supremo">
          <input placeholder="Digite o nome" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <div className={styles.formRow}>
          <Field label="Meses de casa">
            <input type="number" min={0} value={months} onChange={(event) => setMonths(Number(event.target.value))} />
          </Field>
          <Field label="Cortes no ano">
            <input type="number" min={0} value={bookings} onChange={(event) => setBookings(Number(event.target.value))} />
          </Field>
          <Field label="Desconto %">
            <input value={discount} onChange={(event) => setDiscount(event.target.value)} />
          </Field>
        </div>
        <button type="submit" className={styles.btn}>
          Criar nível
        </button>
      </form>

      {loading && <Skeleton />}
      {!loading && tiers.length === 0 && (
        <Empty icon={<Trophy size={26} />} text="Nenhum nível criado ainda. Monte a escada de fidelidade." />
      )}
      <div className={styles.tierList}>
        {tiers.map((tier, index) => (
          <article className={styles.tierCard} key={tier.id}>
            <span className={styles.tierRank}>{index + 1}</span>
            <div className={styles.tierInfo}>
              <h3>{tier.name}</h3>
              <p>
                {tier.min_months} meses de casa · {tier.min_completed_bookings_year} cortes no ano
              </p>
            </div>
            <strong className={styles.tierDiscount}>{Number(tier.discount_percent)}% OFF</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────── PROMOÇÕES ─────────────────── */

function PromotionsPanel({
  promotions,
  gifts,
  customers,
  loading,
  onCreatePromotion,
  onCreateGift,
  onNeedCustomers,
}: {
  promotions: Promotion[];
  gifts: ClientGift[];
  customers: BarberCustomer[];
  loading: boolean;
  onCreatePromotion: (payload: Omit<Promotion, "id">) => void;
  onCreateGift: (payload: Pick<ClientGift, "client" | "title" | "description" | "valid_until">) => void;
  onNeedCustomers: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [discount, setDiscount] = useState("10.00");
  const [giftTitle, setGiftTitle] = useState("");
  const [client, setClient] = useState(0);

  useEffect(() => {
    if (customers.length === 0) void onNeedCustomers();
  }, []);

  const firstCustomer = client || customers[0]?.id || 0;

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <p className={styles.panelEyebrow}>Venda rápida</p>
          <h2 className={styles.panelTitle}>Promoções e brindes</h2>
        </div>
      </div>

      <div className={styles.formPair}>
        <form
          className={styles.editorForm}
          onSubmit={(event) => {
            event.preventDefault();
            const now = new Date();
            const ends = new Date(now);
            ends.setDate(now.getDate() + 30);
            onCreatePromotion({
              title: title || "Promoção relâmpago",
              description: "Campanha criada pelo painel do barbeiro.",
              discount_percent: discount,
              starts_at: now.toISOString(),
              ends_at: ends.toISOString(),
              active: true,
            });
            setTitle("");
          }}
        >
          <div className={styles.formHeader}>
            <Gift size={16} />
            <strong>Nova promoção</strong>
          </div>
          <Field label="Título da campanha" hint="Ex.: Terça do Bruxo">
            <input placeholder="Digite o título" value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <div className={styles.formRow}>
            <Field label="Desconto %">
              <input value={discount} onChange={(event) => setDiscount(event.target.value)} aria-label="Desconto da promoção" />
            </Field>
            <button type="submit" className={styles.btn}>
              Publicar
            </button>
          </div>
        </form>

        <form
          className={styles.editorForm}
          onSubmit={(event) => {
            event.preventDefault();
            if (!firstCustomer) return;
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + 45);
            onCreateGift({
              client: firstCustomer,
              title: giftTitle || "Brinde surpresa",
              description: "Liberado pelo painel do barbeiro.",
              valid_until: validUntil.toISOString(),
            });
            setGiftTitle("");
          }}
        >
          <div className={styles.formHeader}>
            <Crown size={16} />
            <strong>Brinde pra cliente</strong>
          </div>
          <Field label="Nome do brinde" hint="Ex.: Sobrancelha por conta da casa">
            <input placeholder="Digite o brinde" value={giftTitle} onChange={(event) => setGiftTitle(event.target.value)} />
          </Field>
          <div className={styles.formRow}>
            <Field label="Cliente">
              <select value={firstCustomer} onChange={(event) => setClient(Number(event.target.value))}>
                {customers.length === 0 && <option value={0}>Sem clientes</option>}
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.username}
                  </option>
                ))}
              </select>
            </Field>
            <button type="submit" className={styles.btn} disabled={!firstCustomer}>
              Liberar
            </button>
          </div>
        </form>
      </div>

      {loading && <Skeleton />}
      {!loading && promotions.length === 0 && gifts.length === 0 && (
        <Empty icon={<Gift size={26} />} text="Nenhuma campanha no ar. Lança a primeira magia." />
      )}
      <div className={styles.promoGrid}>
        {promotions.map((promotion) => (
          <article className={styles.promoCard} key={promotion.id}>
            <span className={styles.promoBadge}>{Number(promotion.discount_percent)}% OFF</span>
            <h3>{promotion.title}</h3>
            <p>{promotion.description}</p>
          </article>
        ))}
        {gifts.map((gift) => (
          <article className={styles.giftCard} key={gift.id}>
            <span className={styles.giftBadge}>
              <Crown size={12} /> Brinde ativo
            </span>
            <h3>{gift.title}</h3>
            <p>{gift.client_username || `Cliente #${gift.client}`}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────── CAMPO ─────────────────── */

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className={styles.fieldLabel}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

/* ─────────────────── SITE / VITRINE ─────────────────── */

type SiteSection = "fotos" | "servicos" | "planos" | "descontos";

const SITE_SECTIONS = [
  { id: "fotos", label: "Fotos" },
  { id: "servicos", label: "Serviços" },
  { id: "planos", label: "Planos" },
  { id: "descontos", label: "Descontos" },
] as const;

const SITE_HINTS: Record<SiteSection, string> = {
  fotos: "Fotos do portfólio da landing — adicione, edite, oculte ou remova.",
  servicos: "Cortes e preços que o cliente vê na landing e no agendamento.",
  planos: "Planos mensais que aparecem na landing e na aba Planos do cliente.",
  descontos: "Faixas de economia que ajudam o cliente a fechar plano.",
};

function SiteContentPanel({
  services,
  plans,
  discounts,
  images,
  loading,
  onCreateService,
  onUpdateService,
  onDeleteService,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan,
  onCreateDiscount,
  onUpdateDiscount,
  onDeleteDiscount,
  onCreateImage,
  onUpdateImage,
  onDeleteImage,
}: {
  services: ApiService[];
  plans: ApiPlan[];
  discounts: ApiDiscountTier[];
  images: ApiPortfolioImage[];
  loading: boolean;
  onCreateService: (payload: Omit<ApiService, "id">) => void;
  onUpdateService: (id: number, payload: Partial<Omit<ApiService, "id">>) => void;
  onDeleteService: (id: number) => void;
  onCreatePlan: (payload: Omit<ApiPlan, "id">) => void;
  onUpdatePlan: (id: number, payload: Partial<Omit<ApiPlan, "id">>) => void;
  onDeletePlan: (id: number) => void;
  onCreateDiscount: (payload: Omit<ApiDiscountTier, "id">) => void;
  onUpdateDiscount: (id: number, payload: Partial<Omit<ApiDiscountTier, "id">>) => void;
  onDeleteDiscount: (id: number) => void;
  onCreateImage: (payload: FormData) => void;
  onUpdateImage: (
    id: number,
    payload: Partial<Omit<ApiPortfolioImage, "id" | "image" | "image_url">>,
  ) => void;
  onDeleteImage: (id: number) => void;
}) {
  const [section, setSection] = useState<SiteSection>("fotos");
  const counts: Record<SiteSection, number> = {
    fotos: images.length,
    servicos: services.length,
    planos: plans.length,
    descontos: discounts.length,
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <p className={styles.panelEyebrow}>Vitrine</p>
          <h2 className={styles.panelTitle}>Controle do site</h2>
        </div>
      </div>

      <div className={styles.subnav} role="tablist" aria-label="Seções do site">
        {SITE_SECTIONS.map((s) => (
          <button
            key={s.id}
            className={section === s.id ? styles.subTabOn : styles.subTab}
            onClick={() => setSection(s.id)}
            aria-label={s.label}
          >
            {s.label}
            <i>{counts[s.id]}</i>
          </button>
        ))}
      </div>
      <p className={styles.sectionHint}>{SITE_HINTS[section]}</p>

      {loading && <Skeleton />}

      {section === "fotos" && (
        <FotosSection images={images} onCreate={onCreateImage} onUpdate={onUpdateImage} onDelete={onDeleteImage} />
      )}
      {section === "servicos" && (
        <ServicosSection
          services={services}
          loading={loading}
          onCreate={onCreateService}
          onUpdate={onUpdateService}
          onDelete={onDeleteService}
        />
      )}
      {section === "planos" && (
        <PlanosSection
          plans={plans}
          loading={loading}
          onCreate={onCreatePlan}
          onUpdate={onUpdatePlan}
          onDelete={onDeletePlan}
        />
      )}
      {section === "descontos" && (
        <DescontosSection
          discounts={discounts}
          loading={loading}
          onCreate={onCreateDiscount}
          onUpdate={onUpdateDiscount}
          onDelete={onDeleteDiscount}
        />
      )}
    </section>
  );
}

/* ── Fotos ── */

function FotosSection({
  images,
  onCreate,
  onUpdate,
  onDelete,
}: {
  images: ApiPortfolioImage[];
  onCreate: (payload: FormData) => void;
  onUpdate: (
    id: number,
    payload: Partial<Omit<ApiPortfolioImage, "id" | "image" | "image_url">>,
  ) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className={styles.photoGrid}>
      <AddPhotoCard onCreate={onCreate} nextOrder={images.length + 1} />
      {images.map((image) => (
        <PhotoCard key={image.id} image={image} onSave={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
}

function AddPhotoCard({ onCreate, nextOrder }: { onCreate: (payload: FormData) => void; nextOrder: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [look, setLook] = useState("");
  const [alt, setAlt] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    try {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } catch {
      setPreview(null); // ambiente sem createObjectURL (testes) — mostra o nome do arquivo
    }
  }, [file]);

  if (!file) {
    return (
      <label className={styles.addCard}>
        <ImagePlus size={26} />
        <span>Adicionar foto</span>
        <small>Entra direto no portfólio da landing</small>
        <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      </label>
    );
  }

  return (
    <form
      className={styles.photoCard}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData();
        data.append("image", file);
        data.append("alt", alt || look || "Corte do portfólio");
        data.append("look", look || "Novo corte");
        data.append("mandala", "false");
        data.append("active", "true");
        data.append("order", String(nextOrder));
        onCreate(data);
        setFile(null);
        setLook("");
        setAlt("");
      }}
    >
      {preview ? (
        <img src={preview} alt="Prévia da nova foto" className={styles.photoImg} />
      ) : (
        <div className={styles.photoImgPlaceholder}>{file.name}</div>
      )}
      <div className={styles.photoFields}>
        <Field label="Nome do corte/look">
          <input placeholder="Ex.: Freestyle" value={look} onChange={(event) => setLook(event.target.value)} />
        </Field>
        <Field label="Descrição da imagem">
          <input
            placeholder="Ex.: Corte freestyle finalizado"
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
          />
        </Field>
        <div className={styles.pairActions}>
          <button type="submit" className={styles.btnSmall}>
            Publicar
          </button>
          <button type="button" className={styles.btnGhost} onClick={() => setFile(null)}>
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}

function PhotoCard({
  image,
  onSave,
  onDelete,
}: {
  image: ApiPortfolioImage;
  onSave: (
    id: number,
    payload: Partial<Omit<ApiPortfolioImage, "id" | "image" | "image_url">>,
  ) => void;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [look, setLook] = useState(image.look);
  const [alt, setAlt] = useState(image.alt);

  return (
    <article className={styles.photoCard}>
      <img
        src={image.image_url || image.image}
        alt={image.alt || image.look}
        className={image.active ? styles.photoImg : styles.photoImgOff}
      />
      {!editing && (
        <div className={styles.photoOverlay}>
          <div className={styles.photoMeta}>
            <b>{image.look}</b>
            <small>{image.active ? "No ar na landing" : "Oculta do site"}</small>
          </div>
          <div className={styles.photoActions}>
            <button
              className={styles.iconBtn}
              onClick={() => setEditing(true)}
              aria-label={`Editar ${image.look}`}
              title="Editar"
            >
              <Pencil size={15} />
            </button>
            <button
              className={styles.iconBtn}
              onClick={() => onSave(image.id, { active: !image.active })}
              aria-label={image.active ? `Ocultar ${image.look}` : `Mostrar ${image.look}`}
              title={image.active ? "Ocultar do site" : "Mostrar no site"}
            >
              {image.active ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button
              className={styles.iconBtnDanger}
              onClick={() => onDelete(image.id)}
              aria-label="Remover imagem"
              title="Remover"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      )}
      {editing && (
        <div className={styles.photoFields}>
          <Field label="Nome do look">
            <input value={look} onChange={(event) => setLook(event.target.value)} aria-label={`Look ${image.id}`} />
          </Field>
          <Field label="Descrição da foto">
            <input value={alt} onChange={(event) => setAlt(event.target.value)} aria-label={`Alt ${image.id}`} />
          </Field>
          <div className={styles.pairActions}>
            <button
              type="button"
              className={styles.btnSmall}
              onClick={() => {
                onSave(image.id, { look, alt });
                setEditing(false);
              }}
            >
              Salvar
            </button>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => {
                setEditing(false);
                setLook(image.look);
                setAlt(image.alt);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

/* ── Serviços ── */

function ServicosSection({
  services,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}: {
  services: ApiService[];
  loading: boolean;
  onCreate: (payload: Omit<ApiService, "id">) => void;
  onUpdate: (id: number, payload: Partial<Omit<ApiService, "id">>) => void;
  onDelete: (id: number) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("70.00");
  const [duration, setDuration] = useState(45);

  return (
    <>
      {!creating && (
        <button className={styles.ghostAdd} onClick={() => setCreating(true)}>
          <Plus size={16} /> Novo serviço
        </button>
      )}
      {creating && (
        <form
          className={styles.editorForm}
          onSubmit={(event) => {
            event.preventDefault();
            const finalName = name || "Novo serviço";
            onCreate({
              slug: slugify(finalName),
              name: finalName,
              description: "Serviço criado pelo painel do barbeiro.",
              price,
              duration_min: duration,
              tool: "tesoura",
              active: true,
              order: services.length + 1,
            });
            setName("");
            setCreating(false);
          }}
        >
          <div className={styles.formHeader}>
            <Plus size={16} />
            <strong>Novo serviço</strong>
          </div>
          <Field label="Nome que aparece no site" hint="Ex.: Corte masculino curto">
            <input
              placeholder="Digite o nome do serviço"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <div className={styles.formRow}>
            <Field label="Preço">
              <input aria-label="Preço do serviço" value={price} onChange={(event) => setPrice(event.target.value)} />
            </Field>
            <Field label="Duração em minutos">
              <input
                aria-label="Duração do serviço"
                type="number"
                min={10}
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
              />
            </Field>
          </div>
          <div className={styles.pairActions}>
            <button type="submit" className={styles.btn}>
              Adicionar
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => setCreating(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
      {!loading && services.length === 0 && (
        <Empty icon={<Globe size={26} />} text="Nenhum serviço publicado ainda." />
      )}
      <div className={styles.rows}>
        {services.map((service) => (
          <ServiceRow key={service.id} service={service} onSave={onUpdate} onDelete={onDelete} />
        ))}
      </div>
    </>
  );
}

function ServiceRow({
  service,
  onSave,
  onDelete,
}: {
  service: ApiService;
  onSave: (id: number, payload: Partial<Omit<ApiService, "id">>) => void;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(service.name);
  const [price, setPrice] = useState(service.price);
  const [duration, setDuration] = useState(service.duration_min);

  return (
    <article className={styles.row}>
      <div className={styles.rowTop}>
        <div className={styles.rowMain}>
          <b>{service.name}</b>
          <small>{service.duration_min} min</small>
        </div>
        <strong className={styles.rowPrice}>{moneyLabel(service.price)}</strong>
        <div className={styles.rowActions}>
          <button
            className={styles.iconBtn}
            onClick={() => setEditing((value) => !value)}
            aria-label={`Editar ${service.name}`}
            title="Editar"
          >
            <Pencil size={15} />
          </button>
          <button
            className={styles.iconBtnDanger}
            onClick={() => onDelete(service.id)}
            aria-label="Remover serviço"
            title="Remover"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {editing && (
        <div className={styles.rowEdit}>
          <Field label="Nome no site">
            <input value={name} onChange={(event) => setName(event.target.value)} aria-label={`Nome ${service.name}`} />
          </Field>
          <div className={styles.editGrid}>
            <Field label="Preço">
              <input value={price} onChange={(event) => setPrice(event.target.value)} aria-label={`Preço ${service.name}`} />
            </Field>
            <Field label="Duração">
              <input
                type="number"
                min={10}
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                aria-label={`Duração ${service.name}`}
              />
            </Field>
          </div>
          <div className={styles.pairActions}>
            <button
              type="button"
              className={styles.btnSmall}
              onClick={() => {
                onSave(service.id, { name, price, duration_min: duration });
                setEditing(false);
              }}
            >
              Salvar
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => setEditing(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

/* ── Planos ── */

function PlanosSection({
  plans,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}: {
  plans: ApiPlan[];
  loading: boolean;
  onCreate: (payload: Omit<ApiPlan, "id">) => void;
  onUpdate: (id: number, payload: Partial<Omit<ApiPlan, "id">>) => void;
  onDelete: (id: number) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [items, setItems] = useState("1 corte por mês");
  const [priceFrom, setPriceFrom] = useState("100.00");
  const [price, setPrice] = useState("80.00");

  return (
    <>
      {!creating && (
        <button className={styles.ghostAdd} onClick={() => setCreating(true)}>
          <Plus size={16} /> Novo plano
        </button>
      )}
      {creating && (
        <form
          className={styles.editorForm}
          onSubmit={(event) => {
            event.preventDefault();
            const finalName = name || "Novo plano";
            onCreate({
              slug: slugify(finalName),
              name: finalName,
              items,
              price_from: priceFrom,
              price,
              active: true,
              order: plans.length + 1,
            });
            setName("");
            setCreating(false);
          }}
        >
          <div className={styles.formHeader}>
            <Plus size={16} />
            <strong>Novo plano</strong>
          </div>
          <Field label="Nome do plano" hint="Ex.: Mensal do Bruxo">
            <input
              placeholder="Digite o nome do plano"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label="O que vem incluso">
            <input
              placeholder="Ex.: 2 cortes + barba"
              value={items}
              onChange={(event) => setItems(event.target.value)}
            />
          </Field>
          <div className={styles.formRow}>
            <Field label="Preço sem plano">
              <input
                aria-label="Preço antigo do plano"
                value={priceFrom}
                onChange={(event) => setPriceFrom(event.target.value)}
              />
            </Field>
            <Field label="Preço do plano">
              <input
                aria-label="Preço atual do plano"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </Field>
          </div>
          <div className={styles.pairActions}>
            <button type="submit" className={styles.btn}>
              Adicionar
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => setCreating(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
      {!loading && plans.length === 0 && <Empty icon={<Crown size={26} />} text="Nenhum plano publicado ainda." />}
      <div className={styles.rows}>
        {plans.map((plan) => (
          <PlanRow key={plan.id} plan={plan} onSave={onUpdate} onDelete={onDelete} />
        ))}
      </div>
    </>
  );
}

function PlanRow({
  plan,
  onSave,
  onDelete,
}: {
  plan: ApiPlan;
  onSave: (id: number, payload: Partial<Omit<ApiPlan, "id">>) => void;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(plan.name);
  const [items, setItems] = useState(plan.items);
  const [priceFrom, setPriceFrom] = useState(plan.price_from);
  const [price, setPrice] = useState(plan.price);

  return (
    <article className={styles.row}>
      <div className={styles.rowTop}>
        <div className={styles.rowMain}>
          <b>{plan.name}</b>
          <small>{plan.items}</small>
        </div>
        <strong className={styles.rowPrice}>{moneyLabel(plan.price)}</strong>
        <div className={styles.rowActions}>
          <button
            className={styles.iconBtn}
            onClick={() => setEditing((value) => !value)}
            aria-label={`Editar ${plan.name}`}
            title="Editar"
          >
            <Pencil size={15} />
          </button>
          <button
            className={styles.iconBtnDanger}
            onClick={() => onDelete(plan.id)}
            aria-label="Remover plano"
            title="Remover"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {editing && (
        <div className={styles.rowEdit}>
          <Field label="Nome do plano">
            <input value={name} onChange={(event) => setName(event.target.value)} aria-label={`Plano ${plan.name}`} />
          </Field>
          <Field label="Itens inclusos">
            <input value={items} onChange={(event) => setItems(event.target.value)} aria-label={`Itens ${plan.name}`} />
          </Field>
          <div className={styles.editGrid}>
            <Field label="Sem plano">
              <input
                value={priceFrom}
                onChange={(event) => setPriceFrom(event.target.value)}
                aria-label={`De ${plan.name}`}
              />
            </Field>
            <Field label="Com plano">
              <input value={price} onChange={(event) => setPrice(event.target.value)} aria-label={`Por ${plan.name}`} />
            </Field>
          </div>
          <div className={styles.pairActions}>
            <button
              type="button"
              className={styles.btnSmall}
              onClick={() => {
                onSave(plan.id, { name, items, price_from: priceFrom, price });
                setEditing(false);
              }}
            >
              Salvar
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => setEditing(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

/* ── Descontos ── */

function DescontosSection({
  discounts,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}: {
  discounts: ApiDiscountTier[];
  loading: boolean;
  onCreate: (payload: Omit<ApiDiscountTier, "id">) => void;
  onUpdate: (id: number, payload: Partial<Omit<ApiDiscountTier, "id">>) => void;
  onDelete: (id: number) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [rangeLabel, setRangeLabel] = useState("R$100-150");
  const [discountLabel, setDiscountLabel] = useState("10% OFF");

  return (
    <>
      {!creating && (
        <button className={styles.ghostAdd} onClick={() => setCreating(true)}>
          <Plus size={16} /> Nova faixa
        </button>
      )}
      {creating && (
        <form
          className={styles.editorForm}
          onSubmit={(event) => {
            event.preventDefault();
            onCreate({
              range_label: rangeLabel,
              discount_label: discountLabel,
              active: true,
              order: discounts.length + 1,
            });
            setCreating(false);
          }}
        >
          <div className={styles.formHeader}>
            <Plus size={16} />
            <strong>Nova faixa</strong>
          </div>
          <div className={styles.formRow}>
            <Field label="Faixa de valor">
              <input
                aria-label="Faixa de valor"
                value={rangeLabel}
                onChange={(event) => setRangeLabel(event.target.value)}
              />
            </Field>
            <Field label="Chamada do desconto">
              <input
                aria-label="Desconto da faixa"
                value={discountLabel}
                onChange={(event) => setDiscountLabel(event.target.value)}
              />
            </Field>
          </div>
          <div className={styles.pairActions}>
            <button type="submit" className={styles.btn}>
              Adicionar
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => setCreating(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
      {!loading && discounts.length === 0 && (
        <Empty icon={<Gift size={26} />} text="Nenhuma faixa de desconto publicada." />
      )}
      <div className={styles.rows}>
        {discounts.map((discount) => (
          <DiscountRow key={discount.id} discount={discount} onSave={onUpdate} onDelete={onDelete} />
        ))}
      </div>
    </>
  );
}

function DiscountRow({
  discount,
  onSave,
  onDelete,
}: {
  discount: ApiDiscountTier;
  onSave: (id: number, payload: Partial<Omit<ApiDiscountTier, "id">>) => void;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [range, setRange] = useState(discount.range_label);
  const [label, setLabel] = useState(discount.discount_label);

  return (
    <article className={styles.row}>
      <div className={styles.rowTop}>
        <div className={styles.rowMain}>
          <b>{discount.range_label}</b>
          <small>faixa de valor</small>
        </div>
        <strong className={styles.rowPrice}>{discount.discount_label}</strong>
        <div className={styles.rowActions}>
          <button
            className={styles.iconBtn}
            onClick={() => setEditing((value) => !value)}
            aria-label={`Editar faixa ${discount.id}`}
            title="Editar"
          >
            <Pencil size={15} />
          </button>
          <button
            className={styles.iconBtnDanger}
            onClick={() => onDelete(discount.id)}
            aria-label="Remover faixa"
            title="Remover"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {editing && (
        <div className={styles.rowEdit}>
          <div className={styles.editGrid}>
            <Field label="Faixa de valor">
              <input value={range} onChange={(event) => setRange(event.target.value)} aria-label={`Faixa ${discount.id}`} />
            </Field>
            <Field label="Desconto">
              <input value={label} onChange={(event) => setLabel(event.target.value)} aria-label={`Desconto ${discount.id}`} />
            </Field>
          </div>
          <div className={styles.pairActions}>
            <button
              type="button"
              className={styles.btnSmall}
              onClick={() => {
                onSave(discount.id, { range_label: range, discount_label: label });
                setEditing(false);
              }}
            >
              Salvar
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => setEditing(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
