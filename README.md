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

Her Supabase projesinde:

1. Authentication > Providers altında e-posta sağlayıcısını etkinleştirin.
2. Authentication > URL Configuration içindeki Site URL değerini uygulamanın adresine ayarlayın.
3. Redirect URLs listesine yerel adresi (`http://localhost:5173/**`) ve kullanacağınız dağıtım adresini ekleyin. Şifre sıfırlama bağlantısı uygulamanın kök adresine döner.
4. Supabase Dashboard > Project Settings > API bölümünden Project URL ve anon/publishable key değerlerini `.env.local` içine girin.

Ayarlar eklenene kadar giriş ekranı sağlayıcı bağlantısının eksik olduğunu açıkça bildirir; sahte kullanıcı veya sabit şifre kullanmaz. Supabase migration'ı uygulanmadan kayıt ekranı veritabanına erişemez.

## Veritabanı kurulumu

Uygulama Supabase PostgreSQL kullanır. Supabase Dashboard > SQL Editor bölümünde yeni bir sorgu açıp `supabase/migrations/202610190001_initial_workspace_data.sql` dosyasının tamamını çalıştırın. Migration; çalışma alanı, ekip üyeliği, mekân, müşteri ve rezervasyon tablolarını, yeni kullanıcılar için varsayılan çalışma alanı oluşturmayı ve satır düzeyi erişim (RLS) kurallarını ekler. Migration, önceden hesabı olan kullanıcılar için de bir çalışma alanı oluşturur. Prototip için ayrı bir Supabase projesi oluşturun ve migration'ı bu projede de çalıştırın.

Uygulama içinden eklenen mekânlar ve rezervasyonlar bu veritabanında saklanır. Rezervasyonla eklenen müşteri bilgileri aynı çalışma alanında tutulur. Farklı kullanıcıların kayıtları RLS ile ayrılır. Production kullanımında Supabase projeniz için yedekleme politikasını etkinleştirin ve veritabanı değişikliklerini yeni migration dosyalarıyla takip edin.

Migration uygulandıktan sonra `.env.local` içindeki Supabase URL ve publishable key değerlerini ekleyip uygulamayı yeniden başlatın. Tarayıcıya hiçbir zaman `service_role` anahtarı koymayın.

## Prototip ve production yayını

GitHub Pages aynı depoda iki sabit adres sunar:

- Production: `https://oguzozturk77-prog.github.io/mekan-prototype/` (`main` dalı)
- Prototip: `https://oguzozturk77-prog.github.io/mekan-prototype/prototype/` (`prototype` dalı)

Özellik geliştirmelerini `prototype` dalını hedefleyen pull request'lerle yapın. PR'ın Actions özeti değişikliği `/previews/<PR numarası>/` adresinde gösterir. Onaylayıp `prototype` dalına merge ettiğinizde kalıcı prototip adresi güncellenir. Prototipte kabul ettiğiniz sürümü `prototype` dalından `main` dalına açacağınız bir pull request ile production'a aktarın. `main`e merge edildiğinde kök adres güncellenir. Her dağıtım ana dalı kökte, prototip dalını `/prototype/` yolunda korur.

GitHub deposunda Settings > Pages > Build and deployment bölümünde kaynağı GitHub Actions olarak seçin. Settings > Secrets and variables > Actions > Variables bölümünde şu değerleri tanımlayın:

- `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY`: production Supabase projesi.
- `VITE_PROTOTYPE_SUPABASE_URL` ve `VITE_PROTOTYPE_SUPABASE_ANON_KEY`: ayrı prototip/test Supabase projesi.

Publishable/anon anahtarlar tarayıcıya gönderilir. `service_role` anahtarını hiçbir değişkene eklemeyin. Prototip Supabase Authentication ayarlarında Site URL'yi `https://oguzozturk77-prog.github.io/mekan-prototype/prototype/` yapın; Redirect URLs listesine `https://oguzozturk77-prog.github.io/mekan-prototype/prototype/**`, `https://oguzozturk77-prog.github.io/mekan-prototype/previews/**` ve `http://localhost:5173/**` ekleyin. Production Supabase projesinde Site URL `https://oguzozturk77-prog.github.io/mekan-prototype/`, Redirect URL'ler ise bu adres için `/**` ve yerel geliştirme adresi olmalıdır.

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
