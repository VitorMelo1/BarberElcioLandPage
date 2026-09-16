import { getServices } from '../../../../services/catalogService';
import { usePublicCatalog } from '../../usePublicCatalog';
import styles from './Especialidades.module.css';

const arts = [
  { id: 'freestyle', name: 'Freestyle', image: '/images/portfolio/look-09.jpg', alt: 'Desenho de leopardo sobre cabelo claro, trabalho do Studio', title: 'Uma ideia vira desenho.', text: 'Linhas, formas e cor para criar um trabalho com a sua identidade. Traga uma referência ou construa a ideia com o Elcio.' },
  { id: 'colorimetry', name: 'Colorimetria', image: '/images/portfolio/look-08.jpg', alt: 'Cabelo rosa intenso com parte superior escura, trabalho do Studio', title: 'Sua próxima cor começa aqui.', text: 'Do desejo de mudar à escolha da cor, a avaliação ajuda a entender o trabalho necessário no seu cabelo e planejar o procedimento.' },
];

export function Especialidades() {
  const { items } = usePublicCatalog(getServices);
  return <section className={styles.section} id="especialidades" aria-label="Freestyle e Colorimetria">
    <div className={styles.container}>{arts.map(art => {
      const service = items.find(item => item.price_type === 'quote' && item.specialty === art.id);
      return <article className={styles.scene} key={art.id}>
        <figure className={styles.photo}><img src={art.image} alt={art.alt} loading="lazy" width="1050" height="1400" /><figcaption>{art.name} por Elcio</figcaption></figure>
        <div className={styles.copy}><p className={styles.specialty}>{art.name}</p><h2>{art.title}</h2><p>{art.text}</p>
          <p className={styles.process}>Primeiro a avaliação. Depois, uma proposta com valor, duração e o dia do procedimento.</p>
          <a className={styles.primary} aria-label={`Avaliar ${art.name}`} href={service ? `/app?servicos=${service.id}` : `https://wa.me/5562993397680?text=${encodeURIComponent(`Olá! Quero combinar uma avaliação de ${art.name} com o Elcio.`)}`} target={service ? undefined : '_blank'} rel={service ? undefined : 'noreferrer'}>{service ? 'Agendar avaliação' : 'Combinar avaliação pelo WhatsApp'}</a>
          <a className={styles.secondary} href="#portfolio">Ver os trabalhos</a>
        </div>
      </article>;
    })}</div>
  </section>;
}

export function Avaliacao() {
  const { items, loading, error, retry } = usePublicCatalog(getServices);
  const evaluations = items.filter(service => service.price_type === 'quote');
  return <section className={styles.evaluation} id="avaliacao">
    <div className={styles.container}><div className={styles.heading}><h2>Vamos planejar sua transformação.</h2><p>A avaliação e o procedimento têm horários separados. Assim, você conhece a proposta e o Elcio reserva o tempo que o seu trabalho precisa.</p></div>
      <ol className={styles.steps}><li><span>01</span><h3>Converse com o Elcio</h3><p>Agende a avaliação e conte sua ideia. O tempo mostrado nesta etapa é o da avaliação.</p></li><li><span>02</span><h3>Receba sua proposta</h3><p>Confira o plano, o valor, o sinal e a duração reservada para o procedimento.</p></li><li><span>03</span><h3>Escolha o dia da arte</h3><p>Aceite a proposta e escolha um horário que comporte a sessão inteira.</p></li></ol>
      <div className={styles.options}>{loading ? <p role="status">Buscando avaliações disponíveis…</p> : error ? <div role="alert"><p>{error}</p><button type="button" onClick={retry} className={styles.primary}>Tentar novamente</button></div> : evaluations.length ? evaluations.map(service => <a key={service.id} href={`/app?servicos=${service.id}`} className={styles.option} aria-label={`Agendar ${service.name}`}><strong>{service.name}</strong><span>{service.duration_min} min para a avaliação</span><span className={styles.optionAction}>Escolher horário</span></a>) : <p>Consulte o Studio para combinar sua avaliação.</p>}</div>
      <p className={styles.contact}>Quer conversar antes? <a href="https://wa.me/5562993397680" target="_blank" rel="noreferrer">Fale com o Studio pelo WhatsApp</a>.</p>
    </div>
  </section>;
}
