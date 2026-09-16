import { useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import styles from "./ClientApp.module.css";

export function ProfileView() {
  const { user, updateProfile } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault(); if (saving) return;
    setSaving(true); setError(""); setMessage("");
    try { await updateProfile({ email, phone }); setMessage("Dados de contato atualizados."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar os dados."); }
    finally { setSaving(false); }
  }
  return <div className={styles.view}><div className={styles.viewHeading}><div><h2>Minha conta</h2><p>Mantenha seus contatos atualizados para o atendimento.</p></div></div>
    <form className={styles.profileForm} onSubmit={save}><fieldset className={styles.bookingFields} disabled={saving}>
      <p><strong>Usuário:</strong> {user?.username}</p>
      <label htmlFor="profile-email">E-mail<input className={styles.input} id="profile-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
      <p className={styles.muted}>O e-mail pode ser necessário para gerar o pagamento do sinal.</p>
      <label htmlFor="profile-phone">WhatsApp<input className={styles.input} id="profile-phone" type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} maxLength={30} /></label>
      {error && <p className={styles.error} role="alert">{error}</p>}{message && <p className={styles.successMini} role="status">{message}</p>}
      <button className={styles.cta} disabled={saving}>{saving ? "Salvando…" : "Salvar contatos"}</button>
    </fieldset></form>
  </div>;
}
