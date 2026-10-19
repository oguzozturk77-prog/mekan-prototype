import { useCallback, useEffect, useState, type ComponentType, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CalendarRange,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  Clock3,
  DoorOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  UsersRound,
  X,
} from "lucide-react";
import {
  createReservation,
  createSpace,
  loadWorkspaceSnapshot,
  type NewReservation,
  type NewSpace,
  type ReservationRecord,
  type SpaceRecord,
  type WorkspaceSnapshot,
} from "../data/workspace";

type Section = "overview" | "spaces" | "reservations" | "calendar" | "customers" | "team" | "reports";
type DashboardPage = Exclude<Section, "overview" | "spaces" | "reservations" | "customers">;

const navGroups = [
  {
    label: "ÇALIŞMA ALANI",
    items: [
      { id: "overview" as const, label: "Genel Bakış", icon: LayoutDashboard },
      { id: "spaces" as const, label: "Mekânlar", icon: DoorOpen },
      { id: "reservations" as const, label: "Rezervasyonlar", icon: CalendarDays },
      { id: "calendar" as const, label: "Takvim", icon: CalendarRange },
    ],
  },
  {
    label: "YÖNETİM",
    items: [
      { id: "customers" as const, label: "Müşteriler", icon: UsersRound },
      { id: "team" as const, label: "Ekip", icon: UsersRound },
      { id: "reports" as const, label: "Raporlar", icon: ChartNoAxesCombined },
    ],
  },
];

const sectionCopy: Record<DashboardPage, { title: string; description: string }> = {
  calendar: { title: "Takvim", description: "Mekânlarınızın yaklaşan programını tek bakışta görün." },
  team: { title: "Ekibiniz", description: "Ekip arkadaşlarınızın erişimlerini ve sorumluluklarını yönetin." },
  reports: { title: "Raporlar", description: "Doluluk ve gelir görünümünüzü dönemlere göre inceleyin." },
};

const reservationStatusLabels = {
  pending: "Onay bekliyor",
  confirmed: "Onaylandı",
  cancelled: "İptal edildi",
} satisfies Record<ReservationRecord["status"], string>;

function Brand({ light = false }: { light?: boolean }) {
  return <a className={`brand ${light ? "brand--light" : ""}`} href="#genel-bakis" aria-label="MEKAN ana sayfa"><span className="brand-mark">m.</span><span>MEKAN</span></a>;
}

function MetricCard({ title, value, detail, icon }: { title: string; value: string; detail: string; icon: ComponentType<{ size?: number }> }) {
  const Icon = icon;
  return (
    <article className="metric-card">
      <div className="metric-card__top"><span>{title}</span><span className="metric-icon"><Icon size={17} /></span></div>
      <strong>{value}</strong>
      <div className="metric-change metric-change--up"><span>{detail}</span></div>
    </article>
  );
}

function formatDate(value: string, includeYear = false) {
  const options: Intl.DateTimeFormatOptions = includeYear
    ? { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" };
  return new Intl.DateTimeFormat("tr-TR", options).format(new Date(value));
}

function getSpaceArt(index: number) {
  return ["place-art--coast", "place-art--studio", "place-art--garden"][index % 3];
}

function ReservationTable({ reservations, emptyText }: { reservations: ReservationRecord[]; emptyText: string }) {
  if (reservations.length === 0) return <div className="empty-state"><CalendarDays size={20} /><p>{emptyText}</p></div>;

  return (
    <div className="reservation-table-wrap">
      <table className="reservation-table">
        <thead><tr><th>MÜŞTERİ</th><th>MEKÂN</th><th>TARİH & SAAT</th><th>DURUM</th></tr></thead>
        <tbody>{reservations.map((reservation) => (
          <tr key={reservation.id}>
            <td><span className="customer-name">{reservation.customerName}</span><span className="reservation-title">{reservation.title}</span></td>
            <td>{reservation.spaceName}</td>
            <td><span className="date-cell"><Clock3 size={14} />{formatDate(reservation.startsAt)}</span></td>
            <td><span className={`status-pill status-pill--${reservation.status}`}><i />{reservationStatusLabels[reservation.status]}</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function SpaceCard({ space, index }: { space: SpaceRecord; index: number }) {
  return (
    <article className="place-card">
      <div className={`place-art ${getSpaceArt(index)}`}>
        <span>{space.kind}</span><div className="art-sun" /><div className="art-shape art-shape--one" /><div className="art-shape art-shape--two" />
      </div>
      <div className="place-card__body"><div><h3>{space.name}</h3><p>{space.address || "Adres eklenmedi"}</p></div><div className="place-occupancy"><strong>{space.isActive ? "Aktif" : "Pasif"}</strong><span>durum</span></div></div>
    </article>
  );
}

function Overview({
  onNavigate,
  displayName,
  workspace,
  spaces,
  reservations,
}: {
  onNavigate: (section: Section) => void;
  displayName: string;
  workspace: WorkspaceSnapshot | null;
  spaces: SpaceRecord[];
  reservations: ReservationRecord[];
}) {
  const today = new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const now = Date.now();
  const upcoming = reservations.filter((reservation) => new Date(reservation.startsAt).getTime() >= now && reservation.status !== "cancelled");
  const todayReservations = reservations.filter((reservation) => reservation.status !== "cancelled" && new Date(reservation.startsAt).toDateString() === new Date().toDateString());
  const pending = reservations.filter((reservation) => reservation.status === "pending").length;

  return (
    <>
      <div className="dashboard-intro">
        <div><span className="eyebrow">{today}</span><h1>Merhaba, {displayName} <span className="wave">✳</span></h1><p>Bugün mekânlarınızda neler oluyor, birlikte bakalım.</p></div>
        <button className="button button--primary" onClick={() => onNavigate("reservations")}><Plus size={17} /> Yeni rezervasyon</button>
      </div>

      <div className="sample-note"><span className="sample-note__dot" /> Çalışma alanı <span>·</span> {workspace?.name ?? "Yükleniyor"}</div>

      <section className="metrics-grid" aria-label="Çalışma alanı özeti">
        <MetricCard title="Toplam rezervasyon" value={String(reservations.length)} detail="Kayıtlı rezervasyon" icon={CalendarDays} />
        <MetricCard title="Yaklaşan rezervasyon" value={String(upcoming.length)} detail="İptal edilmemiş" icon={Clock3} />
        <MetricCard title="Onay bekleyen" value={String(pending)} detail="İşlem gerekiyor" icon={ChartNoAxesCombined} />
        <MetricCard title="Aktif mekân" value={String(spaces.filter((space) => space.isActive).length)} detail={`${spaces.length} mekân kayıtlı`} icon={DoorOpen} />
      </section>

      <div className="dashboard-columns">
        <section className="panel occupancy-panel">
          <div className="panel-heading"><div><span className="eyebrow">PROGRAM</span><h2>Yaklaşan rezervasyonlar</h2></div><button className="panel-link" onClick={() => onNavigate("reservations")}>Tümünü gör <ArrowRight size={15} /></button></div>
          {upcoming.length > 0 ? <div className="overview-upcoming">{upcoming.slice(0, 4).map((reservation) => (
            <div className="today-timeline" key={reservation.id}><div className="timeline-time">{new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(reservation.startsAt))}</div><div className="timeline-dot timeline-dot--peach" /><div className="timeline-detail"><b>{reservation.spaceName} · {reservation.title}</b><span>{reservation.customerName} · {formatDate(reservation.startsAt)}</span></div></div>
          ))}</div> : <div className="empty-state"><CalendarDays size={20} /><p>Henüz yaklaşan rezervasyon yok.</p></div>}
        </section>

        <section className="panel today-panel">
          <div className="panel-heading"><div><span className="eyebrow">{today}</span><h2>Bugün mekânlarda</h2></div><button className="icon-button" aria-label="Günün ayrıntıları"><MoreHorizontal size={19} /></button></div>
          <div className="today-count"><strong>{String(todayReservations.length).padStart(2, "0")}</strong><span>rezervasyon<br />planlandı</span><span className="today-count__divider" /><strong>{String(spaces.filter((space) => space.isActive).length).padStart(2, "0")}</strong><span>mekân<br />aktif</span></div>
          {todayReservations.slice(0, 2).map((reservation) => <div className="today-timeline" key={reservation.id}><div className="timeline-time">{new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(reservation.startsAt))}</div><div className="timeline-dot timeline-dot--lilac" /><div className="timeline-detail"><b>{reservation.spaceName}</b><span>{reservation.customerName} · {reservation.title}</span></div></div>)}
          <button className="panel-link" onClick={() => onNavigate("calendar")}>Günlük takvimi gör <ArrowRight size={15} /></button>
        </section>
      </div>

      <section className="panel reservations-panel">
        <div className="panel-heading"><div><span className="eyebrow">SON KAYITLAR</span><h2>Yaklaşan rezervasyonlar</h2></div><button className="panel-link" onClick={() => onNavigate("reservations")}>Tümünü gör <ArrowRight size={15} /></button></div>
        <ReservationTable reservations={upcoming.slice(0, 5)} emptyText="Rezervasyon eklediğinizde burada görünecek." />
      </section>

      <section className="spaces-section"><div className="section-title-row"><div><span className="eyebrow">MEKÂNLARINIZ</span><h2>{spaces.length ? "Mekânlarınız" : "İlk mekânınızı ekleyin."}</h2></div><button className="panel-link" onClick={() => onNavigate("spaces")}>Mekânları yönet <ArrowRight size={15} /></button></div>
        {spaces.length > 0 ? <div className="places-grid">{spaces.slice(0, 2).map((space, index) => <SpaceCard key={space.id} space={space} index={index} />)}</div> : <div className="empty-state"><DoorOpen size={20} /><p>Henüz mekân kaydı yok.</p></div>}
      </section>
    </>
  );
}

function SpacesPage({ spaces, onAdd }: { spaces: SpaceRecord[]; onAdd: () => void }) {
  return <section className="page-content"><div className="section-title-row"><div><span className="eyebrow">PORTFÖYÜNÜZ</span><h2>Mekânlar</h2><p className="section-description">Mekânlarınızın güncel konum ve durum bilgileri.</p></div><button className="button button--primary" onClick={onAdd}><Plus size={17} /> Mekân ekle</button></div>
    {spaces.length > 0 ? <div className="places-grid places-grid--full">{spaces.map((space, index) => <SpaceCard key={space.id} space={space} index={index} />)}</div> : <div className="panel empty-state empty-state--large"><DoorOpen size={24} /><h3>Henüz mekân eklenmedi</h3><p>İlk mekânınızı ekleyerek çalışma alanınızı oluşturmaya başlayın.</p><button className="button button--primary" onClick={onAdd}><Plus size={17} /> Mekân ekle</button></div>}
  </section>;
}

function ReservationsPage({ reservations, onAdd }: { reservations: ReservationRecord[]; onAdd: () => void }) {
  const month = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(new Date());
  return <section className="panel full-reservations"><div className="panel-heading"><div><span className="eyebrow">{month}</span><h2>Tüm rezervasyonlar</h2></div><button className="button button--primary" onClick={onAdd}><Plus size={17} /> Yeni rezervasyon</button></div><ReservationTable reservations={reservations} emptyText="Henüz rezervasyon kaydı yok." /></section>;
}

function CustomersPage({ snapshot }: { snapshot: WorkspaceSnapshot | null }) {
  const customers = snapshot?.customers ?? [];
  return <section className="panel full-reservations"><div className="panel-heading"><div><span className="eyebrow">ÇALIŞMA ALANI</span><h2>Müşteriler</h2></div></div>
    {customers.length ? <div className="reservation-table-wrap"><table className="reservation-table"><thead><tr><th>AD SOYAD</th><th>E-POSTA</th><th>TELEFON</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td><span className="customer-name">{customer.name}</span></td><td>{customer.email || "—"}</td><td>{customer.phone || "—"}</td></tr>)}</tbody></table></div> : <div className="empty-state"><UsersRound size={20} /><p>İlk rezervasyonunuzu oluşturduğunuzda müşteriler burada kaydedilir.</p></div>}
  </section>;
}

function localDateTimeInput(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function SpaceDialog({ onClose, onSave, saving, error }: { onClose: () => void; onSave: (input: NewSpace) => Promise<void>; saving: boolean; error: string }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [kind, setKind] = useState("Etkinlik alanı");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSave({ name, address, kind });
  }

  return <div className="data-dialog-backdrop"><section className="data-dialog" role="dialog" aria-modal="true" aria-labelledby="space-dialog-title">
    <div className="data-dialog__heading"><div><span className="eyebrow">PORTFÖYÜNÜZ</span><h2 id="space-dialog-title">Yeni mekân</h2></div><button className="icon-button" aria-label="Kapat" onClick={onClose}><X size={19} /></button></div>
    <form className="data-form" onSubmit={submit}>
      <label className="data-field"><span>Mekân adı</span><input autoFocus required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="Örn. Kıyı Loft" /></label>
      <label className="data-field"><span>Adres</span><input maxLength={240} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="İlçe, şehir" /></label>
      <label className="data-field"><span>Mekân türü</span><select value={kind} onChange={(event) => setKind(event.target.value)}><option>Etkinlik alanı</option><option>Yaratıcı stüdyo</option><option>Bahçe & davet</option><option>Toplantı odası</option><option>Diğer</option></select></label>
      {error && <div className="form-message form-message--error" role="alert">{error}</div>}
      <div className="data-dialog__actions"><button className="button button--secondary" type="button" onClick={onClose}>Vazgeç</button><button className="button button--primary" type="submit" disabled={saving}>{saving ? "Kaydediliyor…" : "Mekânı kaydet"}</button></div>
    </form>
  </section></div>;
}

function ReservationDialog({ spaces, onClose, onSave, saving, error }: { spaces: SpaceRecord[]; onClose: () => void; onSave: (input: NewReservation) => Promise<void>; saving: boolean; error: string }) {
  const start = new Date(Date.now() + 60 * 60_000);
  const end = new Date(start.getTime() + 2 * 60 * 60_000);
  const [spaceId, setSpaceId] = useState(spaces[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [startsAt, setStartsAt] = useState(localDateTimeInput(start));
  const [endsAt, setEndsAt] = useState(localDateTimeInput(end));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSave({ spaceId, title, customerName, customerEmail, customerPhone, startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString() });
  }

  return <div className="data-dialog-backdrop"><section className="data-dialog" role="dialog" aria-modal="true" aria-labelledby="reservation-dialog-title">
    <div className="data-dialog__heading"><div><span className="eyebrow">PROGRAM</span><h2 id="reservation-dialog-title">Yeni rezervasyon</h2></div><button className="icon-button" aria-label="Kapat" onClick={onClose}><X size={19} /></button></div>
    <form className="data-form" onSubmit={submit}>
      <label className="data-field"><span>Mekân</span><select required value={spaceId} onChange={(event) => setSpaceId(event.target.value)}>{spaces.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}</select></label>
      <label className="data-field"><span>Rezervasyon başlığı</span><input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Örn. Ürün çekimi" /></label>
      <label className="data-field"><span>Müşteri adı</span><input required maxLength={160} value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Ad soyad" /></label>
      <div className="data-form__row"><label className="data-field"><span>E-posta <small>isteğe bağlı</small></span><input type="email" maxLength={254} value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="ornek@eposta.com" /></label><label className="data-field"><span>Telefon <small>isteğe bağlı</small></span><input type="tel" maxLength={40} value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="05xx xxx xx xx" /></label></div>
      <div className="data-form__row"><label className="data-field"><span>Başlangıç</span><input type="datetime-local" required value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label><label className="data-field"><span>Bitiş</span><input type="datetime-local" required min={startsAt} value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label></div>
      {error && <div className="form-message form-message--error" role="alert">{error}</div>}
      <div className="data-dialog__actions"><button className="button button--secondary" type="button" onClick={onClose}>Vazgeç</button><button className="button button--primary" type="submit" disabled={saving}>{saving ? "Kaydediliyor…" : "Rezervasyonu kaydet"}</button></div>
    </form>
  </section></div>;
}

function messageFromError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Veriler yüklenemedi. Supabase bağlantınızı ve veritabanı kurulumunu kontrol edin.";
}

export default function Dashboard({ email, displayName = "Yönetici", onSignOut }: { email: string; displayName?: string; onSignOut: () => void | Promise<void> }) {
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [dataState, setDataState] = useState<"loading" | "ready" | "error">("loading");
  const [dataError, setDataError] = useState("");
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const [modal, setModal] = useState<"space" | "reservation" | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const userInitial = email.trim().charAt(0).toLocaleUpperCase("tr-TR") || "A";
  const spaces = snapshot?.spaces ?? [];
  const activeSpaces = spaces.filter((space) => space.isActive);
  const reservations = snapshot?.reservations ?? [];

  const loadData = useCallback(async () => {
    setDataState("loading");
    setDataError("");
    try {
      setSnapshot(await loadWorkspaceSnapshot());
      setDataState("ready");
    } catch (error) {
      setDataError(messageFromError(error));
      setDataState("error");
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  function navigate(section: Section) {
    setActiveSection(section);
    setMobileNavOpen(false);
    setNotice("");
  }

  function openReservationDialog() {
    setNotice("");
    if (activeSpaces.length === 0) {
      navigate("spaces");
      setNotice("Rezervasyon oluşturmadan önce en az bir mekân ekleyin.");
      return;
    }
    setFormError("");
    setModal("reservation");
  }

  async function saveSpace(input: NewSpace) {
    setSaving(true);
    setFormError("");
    try {
      await createSpace(input);
      setModal(null);
      setNotice("Mekân kaydedildi.");
      await loadData();
    } catch (error) {
      setFormError(messageFromError(error));
    } finally {
      setSaving(false);
    }
  }

  async function saveReservation(input: NewReservation) {
    setSaving(true);
    setFormError("");
    try {
      await createReservation(input);
      setModal(null);
      setNotice("Rezervasyon ve müşteri kaydı kaydedildi.");
      await loadData();
    } catch (error) {
      setFormError(messageFromError(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSignOutError("");
    try {
      await onSignOut();
    } catch {
      setSignOutError("Oturum kapatılamadı. Lütfen yeniden deneyin.");
    }
  }

  const title = activeSection === "overview" ? "Genel Bakış" : activeSection === "spaces" ? "Mekânlar" : activeSection === "reservations" ? "Rezervasyonlar" : activeSection === "customers" ? "Müşteriler" : sectionCopy[activeSection].title;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar-brand-row"><Brand /><button className="icon-button sidebar-close" aria-label="Menüyü kapat" onClick={() => setMobileNavOpen(false)}><X size={20} /></button></div>
        <button className="workspace-switch"><span className="workspace-monogram">{(snapshot?.name ?? "M").charAt(0).toLocaleUpperCase("tr-TR")}</span><span><b>{snapshot?.name ?? "Çalışma alanı"}</b><small>{dataState === "ready" ? "Supabase veritabanı" : "Bağlantı bekleniyor"}</small></span><ChevronDown size={15} /></button>
        <nav className="side-nav" aria-label="Ana gezinme">
          {navGroups.map((group) => <div className="nav-group" key={group.label}><span className="nav-group-label">{group.label}</span>{group.items.map((item) => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${activeSection === item.id ? "nav-item--active" : ""}`} onClick={() => navigate(item.id)} aria-current={activeSection === item.id ? "page" : undefined}><Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>{item.id === "spaces" && spaces.length > 0 && <span className="nav-badge">{spaces.length}</span>}</button>; })}</div>)}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-help"><div className="help-icon"><CircleHelp size={17} /></div><div><b>Bir sorunuz mu var?</b><span>Size yardımcı olabiliriz.</span></div><ArrowUpRight size={15} /></div>
        <button className="profile-row" onClick={() => void handleSignOut()} aria-label="Oturumu kapat"><span className="profile-avatar">{userInitial}</span><span className="profile-copy"><b>{email || "Yönetici"}</b><small>Çalışma alanı yöneticisi</small></span><LogOut size={16} /><span className="sr-only">Oturumu kapat</span></button>
      </aside>
      {mobileNavOpen && <button className="mobile-scrim" aria-label="Menüyü kapat" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-leading"><button className="icon-button mobile-menu-button" aria-label="Menüyü aç" onClick={() => setMobileNavOpen(true)}><Menu size={21} /></button><div className="breadcrumbs"><span>Çalışma alanı</span><span>/</span><b>{title}</b></div></div>
          <div className="topbar-actions"><button className={`search-trigger ${searchOpen ? "search-trigger--open" : ""}`} onClick={() => setSearchOpen((open) => !open)} aria-label="Ara"><Search size={17} /><span>Hızlı ara</span><kbd>⌘ K</kbd></button><button className="icon-button notification-button" aria-label="Bildirimler"><Bell size={18} /><i /></button><span className="topbar-divider" /><button className="topbar-avatar" aria-label="Hesap menüsü">{userInitial}</button></div>
        </header>
        {searchOpen && <div className="quick-search"><Search size={17} /><input autoFocus aria-label="Mekân veya rezervasyon ara" placeholder="Mekân, rezervasyon veya müşteri ara…" /><button onClick={() => setSearchOpen(false)} aria-label="Aramayı kapat"><X size={16} /></button></div>}

        <div className="content-wrap">
          {signOutError && <div className="form-message form-message--error" role="alert">{signOutError}</div>}
          {notice && <div className="form-message form-message--success" role="status">{notice}</div>}
          {dataState === "loading" && <div className="data-status" role="status"><span className="loading-line" /> Supabase kayıtları yükleniyor…</div>}
          {dataState === "error" && <div className="form-message form-message--error" role="alert"><b>Veritabanına erişilemiyor.</b><br />{dataError} <button className="text-button" onClick={() => void loadData()}>Yeniden dene</button></div>}
          {activeSection === "overview" && <Overview displayName={displayName} onNavigate={navigate} workspace={snapshot} spaces={spaces} reservations={reservations} />}
          {activeSection === "spaces" && <SpacesPage spaces={spaces} onAdd={() => { setFormError(""); setModal("space"); }} />}
          {activeSection === "reservations" && <ReservationsPage reservations={reservations} onAdd={openReservationDialog} />}
          {activeSection === "customers" && <CustomersPage snapshot={snapshot} />}
          {!(activeSection === "overview" || activeSection === "spaces" || activeSection === "reservations" || activeSection === "customers") && <section className="page-content"><div className="section-title-row"><div><span className="eyebrow">ÇALIŞMA ALANI</span><h2>{sectionCopy[activeSection].title}</h2><p className="section-description">{sectionCopy[activeSection].description}</p></div><button className="select-button">Bu ay <ChevronDown size={15} /></button></div><div className="coming-soon panel"><div className="coming-soon__icon"><Settings2 size={24} /></div><span className="eyebrow">YAKINDA</span><h3>{sectionCopy[activeSection].title} alanı hazırlanıyor.</h3><p>Bu bölüm için gerekli araçlar ve ayrıntılar bir sonraki adımda eklenecek.</p><button className="panel-link" onClick={() => navigate("overview")}>Genel bakışa dön <ArrowRight size={15} /></button></div></section>}
          <footer className="dashboard-footer"><span>MEKAN <span>·</span> Mekânınıza iyi bakın.</span><button><CircleHelp size={14} /> Yardım merkezi</button></footer>
        </div>
      </main>

      {modal === "space" && <SpaceDialog onClose={() => setModal(null)} onSave={saveSpace} saving={saving} error={formError} />}
      {modal === "reservation" && <ReservationDialog spaces={activeSpaces} onClose={() => setModal(null)} onSave={saveReservation} saving={saving} error={formError} />}
    </div>
  );
}
