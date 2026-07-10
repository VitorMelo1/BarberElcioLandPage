import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  CreditCard,
  Percent,
  Plus,
  QrCode,
  Receipt,
  Trash2,
  TrendingUp,
} from "lucide-react";

import {
  createExpense,
  deleteExpense,
  getExpenses,
  getFinanceSummary,
  getPaymentSettings,
  savePaymentSettings,
  type Expense,
  type FinanceSummary,
} from "../../services/financeService";
import styles from "./BarberApp.module.css";

const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const money = (value: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

const todayIso = () => new Date().toISOString().slice(0, 10);

export function FinanceiroPanel() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [addingExpense, setAddingExpense] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("50.00");
  const [expenseDate, setExpenseDate] = useState(todayIso());

  const [pixKey, setPixKey] = useState("");
  const [pixHolder, setPixHolder] = useState("");
  const [pixCity, setPixCity] = useState("ANAPOLIS");
  const [pixActive, setPixActive] = useState(false);
  const [pixSaved, setPixSaved] = useState(false);
  const [mpConfigured, setMpConfigured] = useState(false);
  const [mpToken, setMpToken] = useState("");
  const [mpEditing, setMpEditing] = useState(false);

  async function load() {
    setError("");
    try {
      const [nextSummary, nextExpenses] = await Promise.all([
        getFinanceSummary(year, month),
        getExpenses(year, month),
      ]);
      setSummary(nextSummary);
      setExpenses(nextExpenses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu pra carregar o financeiro.");
    }
  }

  useEffect(() => {
    void load();
  }, [year, month]);

  useEffect(() => {
    getPaymentSettings()
      .then((settings) => {
        setPixKey(settings.pix_key);
        setPixHolder(settings.pix_holder);
        setPixCity(settings.pix_city || "ANAPOLIS");
        setPixActive(Boolean(settings.pix_key));
        setMpConfigured(settings.mercadopago_configured);
      })
      .catch(() => {});
  }, []);

  function shiftMonth(delta: number) {
    const index = year * 12 + (month - 1) + delta;
    setYear(Math.floor(index / 12));
    setMonth((index % 12) + 1);
    setMessage("");
  }

  async function submitExpense(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createExpense({
        name: expenseName || "Custo",
        amount: expenseAmount,
        incurred_on: expenseDate,
      });
      setExpenseName("");
      setAddingExpense(false);
      setMessage("Custo lançado.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu pra lançar o custo.");
    }
  }

  async function removeExpense(id: number) {
    try {
      await deleteExpense(id);
      setMessage("Custo removido.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu pra remover o custo.");
    }
  }

  async function submitPix(event: React.FormEvent) {
    event.preventDefault();
    try {
      const saved = await savePaymentSettings({
        pix_key: pixKey,
        pix_holder: pixHolder,
        pix_city: pixCity,
      });
      setPixActive(Boolean(saved.pix_key));
      setMessage("Recebimento salvo — clientes já veem o PIX do sinal.");
      setPixSaved(true);
      window.setTimeout(() => setPixSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu pra salvar o PIX.");
    }
  }

  async function submitMp(event: React.FormEvent) {
    event.preventDefault();
    try {
      const saved = await savePaymentSettings({ mercadopago_access_token: mpToken });
      setMpConfigured(saved.mercadopago_configured);
      setMpEditing(false);
      setMpToken("");
      setMessage(
        saved.mercadopago_configured
          ? "Token do Mercado Pago salvo. Falta só ligar o checkout de cartão."
          : "Mercado Pago desconectado.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu pra salvar o Mercado Pago.");
    }
  }

  const maxBar = Math.max(
    1,
    ...(summary?.series.flatMap((point) => [Number(point.revenue), Number(point.expenses)]) ?? [1]),
  );
  const profitNegative = Number(summary?.profit ?? 0) < 0;

  return (
    <div className={styles.stack}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <p className={styles.panelEyebrow}>Financeiro</p>
            <h2 className={styles.panelTitle}>Caixa do Bruxo</h2>
          </div>
          <div className={styles.monthNav}>
            <button onClick={() => shiftMonth(-1)} aria-label="Mês anterior">
              <ChevronLeft size={17} />
            </button>
            <span className={styles.monthLabel}>
              {MONTHS_PT[month - 1]} {year}
            </span>
            <button onClick={() => shiftMonth(1)} aria-label="Próximo mês">
              <ChevronRight size={17} />
            </button>
          </div>
        </div>

        {error && <p className={styles.toastErr}>{error}</p>}
        {message && <p className={styles.toastOk}>{message}</p>}

        {!summary && <div className={styles.skeleton} aria-hidden><span /><span /><span /></div>}

        {summary && (
          <>
            <div className={styles.finTiles}>
              <article className={styles.finTile}>
                <span className={styles.finIcon}>
                  <Coins size={18} />
                </span>
                <small>Receita</small>
                <strong className={styles.finValue}>{money(summary.revenue)}</strong>
                <small>{summary.completed_count} atendimentos</small>
              </article>
              <article className={styles.finTile}>
                <span className={styles.finIcon}>
                  <Receipt size={18} />
                </span>
                <small>Custos</small>
                <strong className={styles.finValueMuted}>{money(summary.expenses)}</strong>
                <small>{expenses.length} lançamentos</small>
              </article>
              <article className={styles.finTile}>
                <span className={styles.finIcon}>
                  <TrendingUp size={18} />
                </span>
                <small>Lucro</small>
                <strong className={profitNegative ? styles.finValueNeg : styles.finValue}>
                  {money(summary.profit)}
                </strong>
                <small>receita − custos</small>
              </article>
              <article className={styles.finTileHero}>
                <span className={styles.finIcon}>
                  <Percent size={18} />
                </span>
                <small>Margem de lucro</small>
                <strong className={styles.finMargin}>{summary.margin}%</strong>
                <small>{profitNegative ? "mês no vermelho" : "do que entrou, ficou com você"}</small>
              </article>
            </div>

            <div className={styles.chartBlock}>
              <p className={styles.chartTitle}>Últimos 6 meses</p>
              <div className={styles.chart}>
                {summary.series.map((point) => (
                  <div key={point.label} className={styles.chartCol}>
                    <div className={styles.chartBars}>
                      <span
                        className={styles.barRev}
                        style={{ height: `${Math.max(4, (Number(point.revenue) / maxBar) * 100)}%` }}
                        title={`Receita ${money(point.revenue)}`}
                      />
                      <span
                        className={styles.barExp}
                        style={{ height: `${Math.max(4, (Number(point.expenses) / maxBar) * 100)}%` }}
                        title={`Custos ${money(point.expenses)}`}
                      />
                    </div>
                    <small>{point.label}</small>
                  </div>
                ))}
              </div>
              <div className={styles.chartLegend}>
                <span className={styles.legRev} /> Receita
                <span className={styles.legExp} /> Custos
              </div>
            </div>

            {summary.breakdown.length > 0 && (
              <div className={styles.breakBlock}>
                <p className={styles.chartTitle}>Receita por serviço</p>
                <div className={styles.rows}>
                  {summary.breakdown.map((row) => (
                    <article className={styles.row} key={row.name}>
                      <div className={styles.rowTop}>
                        <div className={styles.rowMain}>
                          <b>{row.name}</b>
                          <small>{row.count}× no mês</small>
                        </div>
                        <strong className={styles.rowPrice}>{money(row.total)}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <p className={styles.panelEyebrow}>Saídas</p>
            <h2 className={styles.panelTitle}>Custos do mês</h2>
          </div>
        </div>

        {!addingExpense && (
          <button className={styles.ghostAdd} onClick={() => setAddingExpense(true)}>
            <Plus size={16} /> Lançar custo
          </button>
        )}
        {addingExpense && (
          <form className={styles.editorForm} onSubmit={submitExpense}>
            <div className={styles.formHeader}>
              <Receipt size={16} />
              <strong>Novo custo</strong>
            </div>
            <label className={styles.fieldLabel}>
              <span>O que foi</span>
              <input
                placeholder="Ex.: Pomadas, aluguel, energia"
                value={expenseName}
                onChange={(event) => setExpenseName(event.target.value)}
              />
            </label>
            <div className={styles.formRow}>
              <label className={styles.fieldLabel}>
                <span>Valor (R$)</span>
                <input
                  aria-label="Valor do custo"
                  value={expenseAmount}
                  onChange={(event) => setExpenseAmount(event.target.value)}
                />
              </label>
              <label className={styles.fieldLabel}>
                <span>Data</span>
                <input
                  aria-label="Data do custo"
                  type="date"
                  value={expenseDate}
                  onChange={(event) => setExpenseDate(event.target.value)}
                />
              </label>
            </div>
            <div className={styles.pairActions}>
              <button type="submit" className={styles.btn}>
                Lançar
              </button>
              <button type="button" className={styles.btnGhost} onClick={() => setAddingExpense(false)}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {expenses.length === 0 && !addingExpense && (
          <p className={styles.sectionHint}>Nenhum custo lançado nesse mês — margem 100% por enquanto.</p>
        )}
        <div className={styles.rows}>
          {expenses.map((expense) => (
            <article className={styles.row} key={expense.id}>
              <div className={styles.rowTop}>
                <div className={styles.rowMain}>
                  <b>{expense.name}</b>
                  <small>
                    {new Date(`${expense.incurred_on}T12:00:00`).toLocaleDateString("pt-BR")}
                  </small>
                </div>
                <strong className={styles.rowPrice}>{money(expense.amount)}</strong>
                <div className={styles.rowActions}>
                  <button
                    className={styles.iconBtnDanger}
                    onClick={() => removeExpense(expense.id)}
                    aria-label={`Remover custo ${expense.name}`}
                    title="Remover"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <p className={styles.panelEyebrow}>Entradas</p>
            <h2 className={styles.panelTitle}>Como você recebe</h2>
          </div>
          {pixActive && (
            <span className={styles.pillLive}>
              <Check size={12} /> PIX ativo
            </span>
          )}
        </div>

        <form className={styles.editorForm} onSubmit={submitPix}>
          <div className={styles.formHeader}>
            <QrCode size={16} />
            <strong>PIX do sinal (50%)</strong>
          </div>
          <p className={styles.sectionHint}>
            Com a chave salva, o cliente recebe o código copia-e-cola na hora de agendar — o sinal
            cai direto na sua conta, sem taxa.
          </p>
          <label className={styles.fieldLabel}>
            <span>Chave PIX</span>
            <input
              placeholder="CPF, celular, e-mail ou chave aleatória"
              value={pixKey}
              onChange={(event) => setPixKey(event.target.value)}
            />
          </label>
          <div className={styles.formRow}>
            <label className={styles.fieldLabel}>
              <span>Nome do recebedor</span>
              <input
                placeholder="Como aparece no banco"
                value={pixHolder}
                onChange={(event) => setPixHolder(event.target.value)}
              />
            </label>
            <label className={styles.fieldLabel}>
              <span>Cidade</span>
              <input value={pixCity} onChange={(event) => setPixCity(event.target.value)} />
            </label>
          </div>
          <button type="submit" className={pixSaved ? styles.btnSaved : styles.btn}>
            {pixSaved ? (
              <>
                <Check size={16} /> Salvo!
              </>
            ) : (
              "Salvar recebimento"
            )}
          </button>
        </form>

        <div className={styles.mpStrip}>
          <span className={styles.finIcon}>
            <CreditCard size={17} />
          </span>
          <div className={styles.mpBody}>
            <b>Mercado Pago — cartão e assinatura</b>
            {mpConfigured && !mpEditing ? (
              <small>
                <Check size={12} /> Token salvo. O checkout de cartão entra na próxima etapa (é a
                parte que precisa da sua conta pra testar de verdade).
              </small>
            ) : (
              <small>
                Cole o <b>access token</b> do Mercado Pago pra deixar a conta conectada. O cartão e a
                assinatura entram na próxima etapa — o PIX acima já funciona 100% sem isso.
              </small>
            )}

            {mpEditing ? (
              <form className={styles.mpForm} onSubmit={submitMp}>
                <input
                  type="password"
                  placeholder="APP_USR-..."
                  value={mpToken}
                  onChange={(event) => setMpToken(event.target.value)}
                  aria-label="Access token do Mercado Pago"
                />
                <div className={styles.pairActions}>
                  <button type="submit" className={styles.btnSmall}>
                    Salvar token
                  </button>
                  <button type="button" className={styles.btnGhost} onClick={() => setMpEditing(false)}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button className={styles.btnGhost} onClick={() => setMpEditing(true)}>
                {mpConfigured ? "Trocar token" : "Conectar Mercado Pago"}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
