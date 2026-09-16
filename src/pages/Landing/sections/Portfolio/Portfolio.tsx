import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Portfolio.module.css';
import { getPortfolioImages, type ApiPortfolioImage } from '../../../../services/catalogService';
import { usePublicCatalog } from '../../usePublicCatalog';

export function Portfolio() {
  const { items, loading, error, retry } = usePublicCatalog(getPortfolioImages);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<ApiPortfolioImage | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const visible = items.filter(item => !filter || item.look.toLocaleLowerCase('pt-BR').includes(filter));
  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); setSelected(null); }
      if (event.key !== 'Tab') return;
      const controls = dialog.current?.querySelectorAll<HTMLElement>('button,a[href]');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      trigger.current?.focus();
    };
  }, [selected]);
  return <section id="portfolio" className={styles.section}>
    <div className={styles.container} aria-hidden={selected ? true : undefined}>
      <h2 className={styles.title}>A arte, de perto.</h2>
      <p className={styles.lead}>Desenhos, cores e texturas feitos no Studio. Abra uma foto para ver os detalhes.</p>
      {loading ? <p role="status">Carregando portfólio…</p> : error ? <p role="alert">{error} <button type="button" className={styles.retry} onClick={retry}>Tentar novamente</button></p> : items.length === 0 ? <p>Nenhuma foto publicada no momento. Veja os trabalhos no Instagram do Studio.</p> : <>
        <div className={styles.filters} role="group" aria-label="Filtrar trabalhos">
          {[['', 'Todos os trabalhos'], ['freestyle', 'Freestyle'], ['colorimetria', 'Colorimetria']].map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}
        </div>
        <div className={styles.masonry}>{visible.map(item => <figure key={item.id} className={styles.item}>
          <button type="button" className={styles.zoom} aria-label={`Ampliar: ${item.alt || item.look}`} onClick={event => { trigger.current = event.currentTarget; setSelected(item); }}>
            <img src={item.image_url || item.image} alt={item.alt || item.look} loading="lazy" className={styles.img} />
            <span className={styles.zoomLabel} aria-hidden="true">Ver de perto</span>
          </button>
          <figcaption className={styles.caption}><span className={styles.look}>{item.look || item.alt}</span></figcaption>
        </figure>)}</div>
        {visible.length === 0 && <p role="status">Nenhum trabalho dessa especialidade publicado no momento.</p>}
      </>}
      <p className={styles.note}>Mais trabalhos em <a href="https://instagram.com/bruxo_dos_cabelos" target="_blank" rel="noreferrer">@bruxo_dos_cabelos</a></p>
    </div>
    {selected && createPortal(<div className={styles.backdrop} onClick={event => { if (event.target === event.currentTarget) setSelected(null); }}>
      <div ref={dialog} className={styles.dialog} role="dialog" aria-modal="true" aria-label={selected.alt || selected.look}>
        <button type="button" className={styles.close} onClick={() => setSelected(null)}>Fechar</button>
        <img src={selected.image_url || selected.image} alt={selected.alt || selected.look} />
        <div className={styles.detail}><p>{selected.look}</p><a href="#avaliacao" onClick={() => setSelected(null)}>Agendar uma avaliação</a></div>
      </div>
    </div>, document.body)}
  </section>;
}
