# MEKAN

Mekân yönetimi için Türkçe, responsive web uygulaması prototipi. İlk sürüm; giriş ekranı, Supabase Auth bağlantısı, korumalı kullanıcı paneli ve Supabase PostgreSQL üzerinde kalıcı mekân, müşteri ve rezervasyon kayıtlarını içerir.

## Geliştirme

Gereksinimler: Node.js 20.19+ veya 22.12+, npm.

```sh
npm install
cp .env.example .env.local
# .env.local dosyasına Supabase proje bilgilerini ekleyin
npm run dev
```

Yerel geliştirme sunucusu `http://localhost:5173` adresinde açılır.

## Kimlik doğrulama kurulumu

Kimlik doğrulama istemcisi [Supabase Auth](https://supabase.com/docs/guides/auth) kullanır; e-posta/şifre ile giriş, kalıcı oturumun geri yüklenmesi, oturumdan çıkış ve şifre sıfırlama akışları gerçek Supabase SDK çağrılarına bağlıdır. Geliştirme ortamında `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerini `.env.local` içine ekleyin. Bu değerleri kaynak koda veya Git’e eklemeyin.

Supabase projesinde:

1. Authentication > Providers altında e-posta sağlayıcısını etkinleştirin.
2. Authentication > URL Configuration içindeki Site URL değerini uygulamanın adresine ayarlayın.
3. Redirect URLs listesine yerel adresi (`http://localhost:5173/**`) ve kullanacağınız dağıtım adresini ekleyin. Şifre sıfırlama bağlantısı uygulamanın kök adresine döner.
4. Supabase Dashboard > Project Settings > API bölümünden Project URL ve anon/publishable key değerlerini `.env.local` içine girin.

Ayarlar eklenene kadar giriş ekranı sağlayıcı bağlantısının eksik olduğunu açıkça bildirir; sahte kullanıcı veya sabit şifre kullanmaz. Supabase migration'ı uygulanmadan kayıt ekranı veritabanına erişemez.

## Veritabanı kurulumu

Uygulama Supabase PostgreSQL kullanır. Supabase Dashboard > SQL Editor bölümünde yeni bir sorgu açıp `supabase/migrations/202610190001_initial_workspace_data.sql` dosyasının tamamını çalıştırın. Migration; çalışma alanı, ekip üyeliği, mekân, müşteri ve rezervasyon tablolarını, yeni kullanıcılar için varsayılan çalışma alanı oluşturmayı ve satır düzeyi erişim (RLS) kurallarını ekler. Migration, önceden hesabı olan kullanıcılar için de bir çalışma alanı oluşturur.

Uygulama içinden eklenen mekânlar ve rezervasyonlar bu veritabanında saklanır. Rezervasyonla eklenen müşteri bilgileri aynı çalışma alanında tutulur. Farklı kullanıcıların kayıtları RLS ile ayrılır. Production kullanımında Supabase projeniz için yedekleme politikasını etkinleştirin ve veritabanı değişikliklerini yeni migration dosyalarıyla takip edin.

Migration uygulandıktan sonra `.env.local` içindeki Supabase URL ve publishable key değerlerini ekleyip uygulamayı yeniden başlatın. Tarayıcıya hiçbir zaman `service_role` anahtarı koymayın.

## GitHub Pages yayını

Ana dala yapılan her güncelleme GitHub Actions üzerinden GitHub Pages yayını başlatır. Depo ayarlarında:

1. Settings > Pages > Build and deployment bölümünde kaynak olarak GitHub Actions'ı seçin.
2. Settings > Secrets and variables > Actions > Variables bölümüne `VITE_SUPABASE_URL` (Project URL) ve `VITE_SUPABASE_ANON_KEY` (publishable veya anon public key) değişkenlerini ekleyin. Bu değerler tarayıcıya gönderilir; `service_role` anahtarını eklemeyin.
3. Supabase Authentication > URL Configuration bölümünde Site URL'yi `https://oguzozturk77-prog.github.io/mekan-prototype/` yapın. Redirect URLs listesine bu adres için `/**` ve yerel geliştirme için `http://localhost:5173/**` ekleyin.

Ana dalın yayını `https://oguzozturk77-prog.github.io/mekan-prototype/` adresinde kalır. Açık pull request'ler ayrıca kendi önizlemelerini `/previews/<PR numarası>/` yolunda yayınlar; PR önizlemesi aynı Pages dağıtımında ana dalın mevcut üretim çıktısını da korur. Önizleme, ana yayının dal korumasını değiştirmemek için ayrı bir `github-pages-preview` Actions ortamı kullanır. Önizlemeyi kontrol edip PR'ı merge ettiğinizde ana dalın yeni sürümü kök adrese yayınlanır.

Ana dal ve PR önizlemesi şimdilik aynı `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değişkenlerini kullanır. Önizlemede yapılan kayıt değişiklikleri aynı Supabase veritabanına yazılır.

GitHub Free planında Pages için depo herkese açık olmalıdır; özel depoda Pages için uygun ücretli plan gerekir. Depo görünürlüğünü bu dosyalar değiştirmez.

## Komutlar

```sh
npm run dev       # Vite geliştirme sunucusu
npm test          # Vitest ve Testing Library
npm run build     # TypeScript kontrolü ve üretim derlemesi
npm run preview   # Üretim çıktısını yerelde sun
```

## Takvim

Takvim görünümü ayı Türkçe gösterir ve haftayı pazartesi günü başlatır. Rezervasyonlar takvimden eklenebilir, düzenlenebilir, durumları değiştirilebilir ve silinebilir; kayıtlar Supabase'de saklanır. Türkiye'deki resmî tatiller, anma günleri ve bazı yaygın özel günler takvimde yer alır. Değişken tarihli Ramazan ve Kurban Bayramı günleri tarayıcının Hicrî Umm al-Qura takvim hesabıyla belirlenir; Diyanet'in resmî takvimi bir gün farklılık gösterebilir.

## İlk sürümdeki gezinme

Genel Bakış, Mekânlar, Rezervasyonlar, Takvim ve Müşteriler görünümleri Supabase kayıtlarını kullanır. Ekip ve Raporlar için responsive navigasyon ve sonraki geliştirme adımında doldurulabilecek başlangıç ekranları bulunur.
