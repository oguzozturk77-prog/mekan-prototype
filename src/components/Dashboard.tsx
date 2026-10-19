import { useState, type ComponentType } from "react";
import {
  ArrowDownRight,
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
  Wallet,
  X,
} from "lucide-react";

type Section = "overview" | "spaces" | "reservations" | "calendar" | "customers" | "team" | "reports";

const navGroups = [
  {
    label: "ÇALIŞMA ALANI",
    items: [
      { id: "overview" as const, label: "Genel Bakış", icon: LayoutDashboard },
      { id: "spaces" as const, label: "Mekânlar", icon: DoorOpen, badge: "4" },
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

const reservations = [
  { initials: "AD", color: "lilac", name: "Aslı Demir", place: "Kıyı Loft · Salon A", date: "Bugün, 14:30", status: "Onaylandı" },
  { initials: "MK", color: "peach", name: "Mert Kaya", place: "Sahil Stüdyo", date: "Bugün, 16:00", status: "Onay bekliyor" },
  { initials: "SY", color: "mint", name: "Selin Yılmaz", place: "Kıyı Loft · Teras", date: "Yarın, 10:00", status: "Onaylandı" },
];

const places = [
  { name: "Kıyı Loft", address: "Moda, Kadıköy", occupancy: 82, color: "place-art--coast", type: "Etkinlik alanı" },
  { name: "Sahil Stüdyo", address: "Caddebostan, Kadıköy", occupancy: 64, color: "place-art--studio", type: "Yaratıcı stüdyo" },
  { name: "Mimoza Bahçe", address: "Polonezköy, Beykoz", occupancy: 48, color: "place-art--garden", type: "Bahçe & davet" },
];

const sectionCopy: Record<Exclude<Section, "overview" | "spaces" | "reservations">, { title: string; description: string }> = {
  calendar: { title: "Takvim", description: "Mekânlarınızın yaklaşan programını tek bakışta görün." },
  customers: { title: "Müşteriler", description: "İletişim bilgileri ve geçmiş rezervasyonlar tek yerde." },
  team: { title: "Ekibiniz", description: "Ekip arkadaşlarınızın erişimlerini ve sorumluluklarını yönetin." },
  reports: { title: "Raporlar", description: "Doluluk ve gelir görünümünüzü dönemlere göre inceleyin." },
};

function Brand({ light = false }: { light?: boolean }) {
  return <a className={`brand ${light ? "brand--light" : ""}`} href="#genel-bakis" aria-label="MEKAN ana sayfa"><span className="brand-mark">m.</span><span>MEKAN</span></a>;
}

function MetricCard({ title, value, change, positive = true, icon }: { title: string; value: string; change: string; positive?: boolean; icon: ComponentType<{ size?: number }> }) {
  const Icon = icon;
  return (
    <article className="metric-card">
      <div className="metric-card__top"><span>{title}</span><span className="metric-icon"><Icon size={17} /></span></div>
      <strong>{value}</strong>
      <div className={`metric-change ${positive ? "metric-change--up" : "metric-change--down"}`}>
        {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        <b>{change}</b><span>geçen aya göre</span>
      </div>
    </article>
  );
}

function Overview({ onNavigate, displayName }: { onNavigate: (section: Section) => void; displayName: string }) {
  const today = new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return (
    <>
      <div className="dashboard-intro">
        <div><span className="eyebrow">{today}</span><h1>Merhaba, {displayName} <span className="wave">✳</span></h1><p>Bugün mekânlarınızda neler oluyor, birlikte bakalım.</p></div>
        <button className="button button--primary" onClick={() => onNavigate("reservations")}><Plus size={17} /> Yeni rezervasyon</button>
      </div>

      <div className="sample-note"><span className="sample-note__dot" /> Örnek çalışma alanı <span>·</span> Kıyı Kolektif</div>

      <section className="metrics-grid" aria-label="Aylık özet">
        <MetricCard title="Toplam rezervasyon" value="128" change="%12,8" icon={CalendarDays} />
        <MetricCard title="Doluluk oranı" value="76,4%" change="%8,2" icon={ChartNoAxesCombined} />
        <MetricCard title="Bu ayın geliri" value="₺284.650" change="%14,6" icon={Wallet} />
        <MetricCard title="Aktif mekân" value="4" change="1 yeni" positive={false} icon={DoorOpen} />
      </section>

      <div className="dashboard-columns">
        <section className="panel occupancy-panel">
          <div className="panel-heading"><div><span className="eyebrow">PERFORMANS</span><h2>Doluluk görünümü</h2></div><button className="select-button">Bu hafta <ChevronDown size={15} /></button></div>
          <div className="chart-summary"><strong>76,4%</strong><span className="positive-tag"><ArrowUpRight size={13} /> 8,2%</span><span>geçen haftaya göre</span></div>
          <div className="bar-chart" role="img" aria-label="Pazartesiden pazara haftalık doluluk grafiği">
            {[{day:"Pzt",val:48},{day:"Sal",val:72},{day:"Çar",val:58},{day:"Per",val:85},{day:"Cum",val:65},{day:"Cmt",val:96},{day:"Paz",val:76}].map((item) => <div className="bar-chart__column" key={item.day}><span className="bar-chart__track"><i style={{ height: `${item.val}%` }} /></span><span className="bar-chart__label">{item.day}</span></div>)}
          </div>
          <div className="chart-legend"><span><i /> Bu hafta</span><span><i /> Geçen hafta</span></div>
        </section>

        <section className="panel today-panel">
          <div className="panel-heading"><div><span className="eyebrow">{today}</span><h2>Bugün mekânlarda</h2></div><button className="icon-button" aria-label="Günün ayrıntıları"><MoreHorizontal size={19} /></button></div>
          <div className="today-count"><strong>08</strong><span>rezervasyon<br />planlandı</span><span className="today-count__divider" /><strong>03</strong><span>mekân<br />aktif</span></div>
          <div className="today-timeline"><div className="timeline-time">14:30</div><div className="timeline-dot timeline-dot--peach" /><div className="timeline-detail"><b>Kıyı Loft · Salon A</b><span>Aslı Demir · Ürün çekimi</span></div></div>
          <div className="today-timeline"><div className="timeline-time">16:00</div><div className="timeline-dot timeline-dot--lilac" /><div className="timeline-detail"><b>Sahil Stüdyo</b><span>Mert Kaya · Yaratıcı atölye</span></div></div>
          <button className="panel-link" onClick={() => onNavigate("calendar")}>Günlük takvimi gör <ArrowRight size={15} /></button>
        </section>
      </div>

      <section className="panel reservations-panel">
        <div className="panel-heading"><div><span className="eyebrow">SON HAREKETLER</span><h2>Yaklaşan rezervasyonlar</h2></div><button className="panel-link" onClick={() => onNavigate("reservations")}>Tümünü gör <ArrowRight size={15} /></button></div>
        <div className="reservation-table-wrap">
          <table className="reservation-table"><thead><tr><th>MÜŞTERİ</th><th>MEKÂN</th><th>TARİH & SAAT</th><th>DURUM</th><th /></tr></thead><tbody>
            {reservations.map((reservation) => <tr key={reservation.name}><td><span className={`avatar avatar--${reservation.color}`}>{reservation.initials}</span><span className="customer-name">{reservation.name}</span></td><td>{reservation.place}</td><td><span className="date-cell"><Clock3 size={14} /> {reservation.date}</span></td><td><span className={`status-pill ${reservation.status === "Onaylandı" ? "status-pill--confirmed" : "status-pill--pending"}`}><i />{reservation.status}</span></td><td><button className="icon-button row-more" aria-label={`${reservation.name} rezervasyon seçenekleri`}><MoreHorizontal size={18} /></button></td></tr>)}
          </tbody></table>
        </div>
      </section>

      <section className="spaces-section"><div className="section-title-row"><div><span className="eyebrow">MEKÂNLARINIZ</span><h2>Her yer yolunda.</h2></div><button className="panel-link" onClick={() => onNavigate("spaces")}>Mekânları yönet <ArrowRight size={15} /></button></div>
        <div className="places-grid">{places.slice(0, 2).map((place) => <article className="place-card" key={place.name}><div className={`place-art ${place.color}`}><span>{place.type}</span><button className="place-more" aria-label={`${place.name} seçenekleri`}><MoreHorizontal size={18} /></button><div className="art-sun" /><div className="art-shape art-shape--one" /><div className="art-shape art-shape--two" /></div><div className="place-card__body"><div><h3>{place.name}</h3><p>{place.address}</p></div><div className="place-occupancy"><strong>{place.occupancy}%</strong><span>doluluk</span></div></div></article>)}</div>
      </section>
    </>
  );
}

function SpacesPage() {
  return <section className="page-content"><div className="section-title-row"><div><span className="eyebrow">PORTFÖYÜNÜZ</span><h2>Mekânlar</h2><p className="section-description">Mekânlarınızın güncel doluluk ve konum bilgileri.</p></div><button className="button button--primary"><Plus size={17} /> Mekân ekle</button></div><div className="places-grid places-grid--full">{places.map((place) => <article className="place-card" key={place.name}><div className={`place-art ${place.color}`}><span>{place.type}</span><button className="place-more" aria-label={`${place.name} seçenekleri`}><MoreHorizontal size={18} /></button><div className="art-sun" /><div className="art-shape art-shape--one" /><div className="art-shape art-shape--two" /></div><div className="place-card__body"><div><h3>{place.name}</h3><p>{place.address}</p></div><div className="place-occupancy"><strong>{place.occupancy}%</strong><span>doluluk</span></div></div></article>)}</div></section>;
}

function ReservationsPage() {
  const month = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(new Date());
  return <section className="panel full-reservations"><div className="panel-heading"><div><span className="eyebrow">{month}</span><h2>Tüm rezervasyonlar</h2></div><button className="button button--primary"><Plus size={17} /> Yeni rezervasyon</button></div><div className="reservation-table-wrap"><table className="reservation-table"><thead><tr><th>MÜŞTERİ</th><th>MEKÂN</th><th>TARİH & SAAT</th><th>DURUM</th><th /></tr></thead><tbody>{[...reservations, ...reservations].map((reservation, index) => <tr key={`${reservation.name}-${index}`}><td><span className={`avatar avatar--${reservation.color}`}>{reservation.initials}</span><span className="customer-name">{reservation.name}</span></td><td>{reservation.place}</td><td><span className="date-cell"><Clock3 size={14} />{reservation.date}</span></td><td><span className={`status-pill ${reservation.status === "Onaylandı" ? "status-pill--confirmed" : "status-pill--pending"}`}><i />{reservation.status}</span></td><td><button className="icon-button row-more" aria-label={`${reservation.name} rezervasyon seçenekleri`}><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table></div></section>;
}

export default function Dashboard({ email, displayName = "Yönetici", onSignOut }: { email: string; displayName?: string; onSignOut: () => void | Promise<void> }) {
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const userInitial = email.trim().charAt(0).toLocaleUpperCase("tr-TR") || "A";

  function navigate(section: Section) {
    setActiveSection(section);
    setMobileNavOpen(false);
  }

  async function handleSignOut() {
    setSignOutError("");
    try {
      await onSignOut();
    } catch {
      setSignOutError("Oturum kapatılamadı. Lütfen yeniden deneyin.");
    }
  }

  const title = activeSection === "overview" ? "Genel Bakış" : activeSection === "spaces" ? "Mekânlar" : activeSection === "reservations" ? "Rezervasyonlar" : sectionCopy[activeSection].title;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar-brand-row"><Brand /><button className="icon-button sidebar-close" aria-label="Menüyü kapat" onClick={() => setMobileNavOpen(false)}><X size={20} /></button></div>
        <button className="workspace-switch"><span className="workspace-monogram">K</span><span><b>Kıyı Kolektif</b><small>Ücretsiz çalışma alanı</small></span><ChevronDown size={15} /></button>
        <nav className="side-nav" aria-label="Ana gezinme">
          {navGroups.map((group) => <div className="nav-group" key={group.label}><span className="nav-group-label">{group.label}</span>{group.items.map((item) => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${activeSection === item.id ? "nav-item--active" : ""}`} onClick={() => navigate(item.id)} aria-current={activeSection === item.id ? "page" : undefined}><Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>{"badge" in item && <span className="nav-badge">{item.badge}</span>}</button>; })}</div>)}
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
          {activeSection === "overview" && <Overview displayName={displayName} onNavigate={navigate} />}
          {activeSection === "spaces" && <SpacesPage />}
          {activeSection === "reservations" && <ReservationsPage />}
          {!(activeSection === "overview" || activeSection === "spaces" || activeSection === "reservations") && <section className="page-content"><div className="section-title-row"><div><span className="eyebrow">ÇALIŞMA ALANI</span><h2>{sectionCopy[activeSection].title}</h2><p className="section-description">{sectionCopy[activeSection].description}</p></div><button className="select-button">Bu ay <ChevronDown size={15} /></button></div><div className="coming-soon panel"><div className="coming-soon__icon"><Settings2 size={24} /></div><span className="eyebrow">YAKINDA</span><h3>{sectionCopy[activeSection].title} alanı hazırlanıyor.</h3><p>Bu bölüm için gerekli araçlar ve ayrıntılar bir sonraki adımda eklenecek.</p><button className="panel-link" onClick={() => navigate("overview")}>Genel bakışa dön <ArrowRight size={15} /></button></div></section>}
          <footer className="dashboard-footer"><span>MEKAN <span>·</span> Mekânınıza iyi bakın.</span><button><CircleHelp size={14} /> Yardım merkezi</button></footer>
        </div>
      </main>
    </div>
  );
}
