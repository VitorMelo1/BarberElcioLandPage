import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Crown,Gift,Eye,EyeOff,Globe,ImagePlus,Pencil,Plus,Trash2 } from "lucide-react";
import type { ApiService,ApiPlan,ApiDiscountTier,ApiPortfolioImage } from "../../services/catalogService";
import { moneyLabel,slugify,Skeleton,Empty,Field } from "./PanelPrimitives";
import styles from "./BarberApp.module.css";
export function DescontosSection({
  discounts,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}: {
  discounts: ApiDiscountTier[];
  loading: boolean;
  onCreate: (payload: Omit<ApiDiscountTier, "id">) => Promise<boolean>;
  onUpdate: (id: number, payload: Partial<Omit<ApiDiscountTier, "id">>) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
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
          onSubmit={async (event) => {
            event.preventDefault();
            if (!await onCreate({
              range_label: rangeLabel,
              discount_label: discountLabel,
              active: true,
              order: discounts.length + 1,
            })) return;
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
  onSave: (id: number, payload: Partial<Omit<ApiDiscountTier, "id">>) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
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
        <div className={styles.rowActions}><span className={styles.pillLive}>{discount.active ? "Publicado" : "Oculto"}</span><button className={styles.btnGhost} onClick={() => void onSave(discount.id, {active: !discount.active})}>{discount.active ? "Ocultar" : "Reativar"}</button>
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
            onClick={() => { if (window.confirm("Ocultar este item do site? Você poderá reativá-lo aqui.")) void onDelete(discount.id); }}
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
              onClick={async () => {
                if (!await onSave(discount.id, { range_label: range, discount_label: label })) return;
                setEditing(false);
              }}
            >
              Salvar
            </button>
            <button type="button" className={styles.btnGhost} onClick={() => { setRange(discount.range_label); setLabel(discount.discount_label); setEditing(false); }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
