import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Eye, EyeOff, KeyRound, Mail, MoveUpRight } from "lucide-react";

type LoginScreenProps = {
  isConfigured: boolean;
  notice?: string;
  onSignIn: (email: string, password: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
};

function localizeAuthError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("invalid login credentials")) return "E-posta adresi veya şifre hatalı.";
  if (message.includes("email not confirmed")) return "Devam etmek için e-posta adresinizi doğrulayın.";
  if (message.includes("rate limit")) return "Çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.";
  if (message.includes("fetch") || message.includes("network")) return "Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin.";
  return error instanceof Error ? error.message : "Bir şeyler ters gitti. Lütfen yeniden deneyin.";
}

export default function LoginScreen({
  isConfigured,
  notice = "",
  onSignIn,
  onResetPassword,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      if (isResetMode) {
        await onResetPassword(email);
        setSuccess("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
      } else {
        await onSignIn(email, password);
      }
    } catch (submitError) {
      setError(localizeAuthError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story" aria-label="MEKAN hakkında">
        <div className="auth-story__top">
          <a className="brand brand--light" href="#giris" aria-label="MEKAN ana sayfa">
            <span className="brand-mark">m.</span>
            <span>MEKAN</span>
          </a>
          <span className="story-edition">MEKÂN YÖNETİMİ · İSTANBUL</span>
        </div>

        <div className="story-copy">
          <span className="eyebrow eyebrow--light"><span /> HER ŞEY YERLİ YERİNDE</span>
          <h1>Mekânınıza<br />iyi bakın.</h1>
          <p>Rezervasyonlardan ekibe, tüm mekânlarınızın düzeni tek bir yerde.</p>
          <div className="story-points">
            <div><span className="story-check"><Check size={13} /></span><span>Günlük işlerinize daha çok zaman</span></div>
            <div><span className="story-check"><Check size={13} /></span><span>Ekibinizle aynı takvimde buluşun</span></div>
          </div>
        </div>

        <div className="story-scene" aria-hidden="true">
          <div className="scene-glow" />
          <div className="scene-window"><span /><span /><span /></div>
          <div className="scene-shelf" />
          <div className="scene-plant"><i /><i /><i /><b /></div>
          <div className="scene-chair"><i /><b /></div>
          <div className="scene-table" />
          <div className="scene-caption"><span>01 / 04</span><span>Gününüzün ritmini bulun <ArrowRight size={14} /></span></div>
        </div>
        <div className="story-footer"><span>© {new Date().getFullYear()} MEKAN</span><span>Güzel mekânlar, iyi yönetilir.</span></div>
      </section>

      <section className="auth-panel" id="giris">
        <div className="auth-panel__utility"><span>Yeni misiniz?</span><a href="mailto:merhaba@mekan.app">Bize ulaşın <MoveUpRight size={13} /></a></div>
        <div className="auth-form-wrap">
          <div className="auth-form-heading">
            <span className="eyebrow">YÖNETİM PANELİ</span>
            <h2>{isResetMode ? "Yeni bir başlangıç." : "Tekrar hoş geldiniz."}</h2>
            <p>{isResetMode ? "Şifre yenileme bağlantısı için e-posta adresinizi yazın." : "Hesabınıza giriş yaparak kaldığınız yerden devam edin."}</p>
          </div>

          {!isConfigured && (
            <div className="setup-notice" role="status">
              <KeyRound size={16} />
              <span>Giriş altyapısını etkinleştirmek için <code>.env.local</code> dosyasına Supabase proje bilgilerinizi ekleyin.</span>
            </div>
          )}
          {notice && <div className="form-message form-message--error" role="status">{notice}</div>}
          {error && <div className="form-message form-message--error" role="alert">{error}</div>}
          {success && <div className="form-message form-message--success" role="status">{success}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="email">E-posta adresi</label>
            <div className="input-wrap">
              <Mail size={17} aria-hidden="true" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="ornek@mekan.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            {!isResetMode && <>
              <div className="password-label-row">
                <label className="field-label" htmlFor="password">Şifre</label>
                <button className="text-button" type="button" onClick={() => { setIsResetMode(true); setError(""); setSuccess(""); }}>
                  Şifremi unuttum
                </button>
              </div>
              <div className="input-wrap">
                <KeyRound size={17} aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Şifrenizi girin"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                />
                <button className="icon-button password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </>}

            <button className="button button--primary auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Lütfen bekleyin…" : isResetMode ? "Sıfırlama bağlantısı gönder" : "Giriş yap"}
              {!isSubmitting && <ArrowRight size={17} />}
            </button>
          </form>

          {isResetMode && <button className="back-to-login" type="button" onClick={() => { setIsResetMode(false); setError(""); setSuccess(""); }}>Giriş ekranına dön</button>}

          <div className="auth-divider"><span>güvenli ve size özel</span></div>
          <div className="security-note"><span className="security-dot" /> Oturumunuz şifrelenmiş bağlantı ile korunur.</div>
        </div>
        <div className="auth-panel__footer"><a href="mailto:destek@mekan.app">Yardıma mı ihtiyacınız var?</a><span>Gizlilik · Kullanım koşulları</span></div>
      </section>
    </main>
  );
}
