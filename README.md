# MEKAN

Mekân yönetimi için Türkçe, responsive web uygulaması prototipi. İlk sürüm; giriş ekranı, Supabase Auth bağlantısı, korumalı kullanıcı paneli ve temel gezinme alanlarını içerir.

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

Ayarlar eklenene kadar giriş ekranı sağlayıcı bağlantısının eksik olduğunu açıkça bildirir; sahte kullanıcı veya sabit şifre kullanmaz. Paneldeki rezervasyon ve performans verileri prototip amaçlı örnek veridir.

## Komutlar

```sh
npm run dev       # Vite geliştirme sunucusu
npm test          # Vitest ve Testing Library
npm run build     # TypeScript kontrolü ve üretim derlemesi
npm run preview   # Üretim çıktısını yerelde sun
```

## İlk sürümdeki gezinme

Genel Bakış, Mekânlar ve Rezervasyonlar görünümleri etkileşimlidir. Takvim, Müşteriler, Ekip ve Raporlar için responsive navigasyon ve sonraki geliştirme adımında doldurulabilecek başlangıç ekranları bulunur.
