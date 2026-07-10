import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import styles from "./Legal.module.css";

const CONTATO = "contato@elciobarbearia.com.br";
const ATUALIZADO = "julho de 2026";

function LegalShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <Link to="/" className={styles.back}>
          <ArrowLeft size={16} /> voltar ao site
        </Link>
        <img src="/images/emblema.png" alt="" className={styles.emblem} />
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>Última atualização: {ATUALIZADO}</p>
        <div className={styles.content}>{children}</div>
        <footer className={styles.foot}>
          Studio do Bruxo dos Cabelos — Anápolis-GO ·{" "}
          <a href={`mailto:${CONTATO}`}>{CONTATO}</a>
        </footer>
      </div>
    </main>
  );
}

export function Privacidade() {
  return (
    <LegalShell title="Política de Privacidade">
      <p>
        Esta política explica como o site do <b>Studio do Bruxo dos Cabelos</b> trata os dados de
        quem usa a plataforma de agendamento. Ao criar uma conta e agendar, você concorda com o
        descrito aqui.
      </p>

      <h2>Quais dados coletamos</h2>
      <ul>
        <li>
          <b>Cadastro:</b> nome de usuário, telefone/WhatsApp e senha (guardada de forma
          criptografada — nunca em texto puro).
        </li>
        <li>
          <b>Agendamentos:</b> serviços escolhidos, datas, horários e histórico de atendimentos.
        </li>
      </ul>

      <h2>Google Calendar</h2>
      <p>
        Se o barbeiro conectar a agenda do Google, o sistema cria, atualiza e remove <b>apenas os
        eventos referentes aos agendamentos feitos por este site</b>. Não lemos, alteramos nem
        compartilhamos outros eventos ou dados da conta Google. O acesso pode ser revogado a
        qualquer momento pelo próprio barbeiro (botão “Desconectar” no painel) ou na conta Google.
      </p>

      <h2>Pagamentos</h2>
      <p>
        O sinal do agendamento é pago via <b>PIX</b> direto na conta do barbeiro. Não armazenamos
        dados de cartão nem senhas bancárias.
      </p>

      <h2>Como usamos os dados</h2>
      <p>
        Os dados servem só para operar o agendamento: identificar você, mostrar seus horários,
        organizar a agenda do barbeiro e melhorar o atendimento. <b>Não vendemos seus dados</b> e
        não enviamos para terceiros fora do necessário para o funcionamento do serviço.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode pedir a correção ou a exclusão dos seus dados a qualquer momento pelo e-mail{" "}
        <a href={`mailto:${CONTATO}`}>{CONTATO}</a>.
      </p>
    </LegalShell>
  );
}

export function Termos() {
  return (
    <LegalShell title="Termos de Serviço">
      <p>
        Estes termos regem o uso da plataforma de agendamento do <b>Studio do Bruxo dos Cabelos</b>.
        Ao usar o site, você concorda com eles.
      </p>

      <h2>O serviço</h2>
      <p>
        A plataforma permite ver serviços e planos, agendar horários e acompanhar seus
        atendimentos na barbearia. O barbeiro controla a agenda, os preços e a disponibilidade.
      </p>

      <h2>Agendamento e sinal</h2>
      <ul>
        <li>Ao agendar, pode ser pedido um sinal de 50% via PIX para garantir o horário.</li>
        <li>O valor final e os serviços são os exibidos no momento do agendamento.</li>
      </ul>

      <h2>Cancelamento e remarcação</h2>
      <p>
        Cancelamentos e remarcações pelo cliente devem ser feitos com <b>pelo menos 24 horas de
        antecedência</b>. Dentro desse prazo, fale direto com a barbearia. O barbeiro pode
        reorganizar horários quando necessário.
      </p>

      <h2>Uso correto</h2>
      <p>
        É proibido usar a plataforma para fraudes, agendamentos falsos ou qualquer atividade
        ilegal. Contas com uso indevido podem ser suspensas.
      </p>

      <h2>Contato</h2>
      <p>
        Dúvidas sobre estes termos: <a href={`mailto:${CONTATO}`}>{CONTATO}</a>.
      </p>
    </LegalShell>
  );
}
