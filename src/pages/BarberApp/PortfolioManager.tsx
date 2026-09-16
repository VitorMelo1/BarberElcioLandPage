import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Crown,Gift,Eye,EyeOff,Globe,ImagePlus,Pencil,Plus,Trash2 } from "lucide-react";
import type { ApiService,ApiPlan,ApiDiscountTier,ApiPortfolioImage } from "../../services/catalogService";
import { moneyLabel,slugify,Skeleton,Empty,Field } from "./PanelPrimitives";
import styles from "./BarberApp.module.css";
export function FotosSection({
  images,
  onCreate,
  onUpdate,
  onDelete,
}: {
  images: ApiPortfolioImage[];
  onCreate: (payload: FormData) => Promise<boolean>;
  onUpdate: (
    id: number,
    payload: Partial<Omit<ApiPortfolioImage, "id" | "image" | "image_url">>,
  ) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
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

function AddPhotoCard({ onCreate, nextOrder }: { onCreate: (payload: FormData) => Promise<boolean>; nextOrder: number }) {
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
        <small>Entra direto no portfólio do site público</small>
        <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      </label>
    );
  }

  return (
    <form
      className={styles.photoCard}
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData();
        data.append("image", file);
        data.append("alt", alt || look || "Corte do portfólio");
        data.append("look", look || "Novo corte");
        data.append("mandala", "false");
        data.append("active", "true");
        data.append("order", String(nextOrder));
        if (!await onCreate(data)) return;
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
        <Field label="Descrição da imagem" hint="Descreva a foto para quem não pode vê-la.">
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
  ) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
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
            <small>{image.active ? "Publicado no site" : "Oculta do site"}</small>
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
              onClick={() => { if (window.confirm("Remover esta foto do portfólio?")) void onDelete(image.id); }}
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
              onClick={async () => {
                if (!await onSave(image.id, { look, alt })) return;
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

