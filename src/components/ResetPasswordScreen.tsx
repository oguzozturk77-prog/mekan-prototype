import { useState, type FormEvent } from "react";
import { ArrowRight, KeyRound } from "lucide-react";

export default function ResetPasswordScreen({ onUpdatePassword }: { onUpdatePassword: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("Girdiğiniz şifreler birbiriyle eşleşmiyor.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onUpdatePassword(password);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Şifreniz güncellenemedi. Lütfen yeniden deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="reset-layout">
      <a className="brand reset-brand" href="#sifre-yenile"><span className="brand-mark">m.</span><span>MEKAN</span></a>
      <section className="reset-card" id="sifre-yenile">
        <span className="reset-icon"><KeyRound size={20} /></span>
        <span className="eyebrow">HESAP GÜVENLİĞİ</span>
        <h1>Yeni şifrenizi belirleyin.</h1>
        <p>Hesabınızı korumak için en az 8 karakterli bir şifre seçin.</p>
        {error && <div className="form-message form-message--error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="new-password">Yeni şifre</label>
          <div className="input-wrap"><KeyRound size={17} aria-hidden="true" /><input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
          <label className="field-label reset-confirm-label" htmlFor="confirm-password">Yeni şifre tekrar</label>
          <div className="input-wrap"><KeyRound size={17} aria-hidden="true" /><input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>
          <button className="button button--primary auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Güncelleniyor…" : "Şifremi güncelle"}{!isSubmitting && <ArrowRight size={17} />}</button>
        </form>
      </section>
    </main>
  );
}
