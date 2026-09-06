# Ajan Ajansı

Claude ile çalışan masaüstü ajans. Bir müdür, sekiz takım lideri ve yirmi dört uzman;
sen brief'i yazıyorsun, ajans işi bölüşüp koordineli çalışıyor ve tek teslimatla dönüyor.

Kuruluş planı ve karar gerekçeleri:
https://claude.ai/code/artifact/1ac97b43-d004-47e7-bcad-319061f47069

## Çalıştırma

```bash
npm install        # bir kez
npm run dev        # geliştirme modunda aç
npm run build      # üretim derlemesi
npm start          # derlenmiş sürümü çalıştır
```

## Testler

```bash
npm run typecheck       # iki taraf da tip kontrolünden geçer
npm test                # 53 test, hiçbiri API çağrısı yapmaz (ücretsiz)
npm run test:izin       # onay kapısı kuralları
npm run test:durum      # olay akışı → arayüz durumu dönüşümü
npm run test:teslimat   # dosya değişikliği tespiti (gerçek dosya sistemi)

npm run test:baglanti   # Claude bağlantısı canlı mı (kuruş mertebesinde)
npx tsx betikler/hiyerarsi-testi.ts <klasör>   # uçtan uca (gerçek görev çalıştırır)
```

Uçtan uca test yalnızca zinciri değil, motorun yaydığı olayların arayüzün
beklediği duruma dönüşüp dönüşmediğini de denetler: görev panosu doluyor mu,
teslimat yakalanıyor mu, her ajan bir sonuca ulaşıyor mu.

## Nasıl kurulmuş

### Üç katman

| Katman | Kim | Teknik karşılığı | Model |
| --- | --- | --- | --- |
| 0 | Müdür (1) | ana oturum | Opus |
| 1 | Takım lideri (8) | 1. seviye alt ajan | Opus |
| 2 | Uzman (24) | 2. seviye alt ajan | Sonnet |

Müdür brief'i okur, yalnızca gereken departmanları çağırır. Liderler işi uzmanlarına
böler, çıktıları denetler. Uzmanlar birbirleriyle `SendMessage` ile haberleşir.

Delegasyon derinliği 2, eşzamanlı ajan sayısı 32 ile sınırlı. Dolar cinsinden bir
tavan yok — çalışmayı istediğin an "Ajansı durdur" ile kesebilirsin.

### Giriş — yalnızca Claude oturumu

Ajans bu makinede açık olan Claude oturumuyla çalışır. Ayrı bir API anahtarı
istenmez, saklanmaz ve ajan sürecine enjekte edilmez; SDK kurulu oturumu kendisi
bulur. Kullanım senin aboneliğinden düşer, ayrıca faturalanan bir şey yoktur.

Oturum yoksa uygulama bunu kurulum ekranında söyler: terminalde `claude` komutuyla
giriş yapıp uygulamayı yeniden başlatman yeterli.

> Bu, uygulamayı kişisel bir araç yapar. Anthropic, önceden onay almadan üçüncü
> parti ürünlerde claude.ai girişi sunulmasına izin vermiyor — uygulamayı başkasına
> dağıtmak istersen API anahtarı katmanının geri eklenmesi gerekir.

### Ekranlar

Arayüz `Claude Agency` tasarımına göre kuruldu: solda kenar çubuğu, üstte arama ve
sistem durumu, sağda canlı paneller, altta özet çubuğu.

| Sayfa | Ne yapar |
| --- | --- |
| Ana Sayfa | Kadro özeti, ölçü kartları, canlı ofis, departman durumları, halka grafik, son aktiviteler |
| Ofis | Büyük canlı ofis görünümü ve o an masa başındaki ajanlar |
| Ekip | 33 ajanın tamamı, departman departman, canlı durumlarıyla |
| Görevler | Ajan kartları — devam eden / tamamlanan / takılan, süre ve istatistikle |
| Projeler | Çalışma alanı geçmişi; tek tıkla proje değiştirme |
| Raporlar | Departman yükü ve ajan karnesi: süre, araç, token, satır |
| Toplantılar | Müdür–lider konuşmasının okunabilir transkripti |
| Claude Command Center | Asıl çalışma ekranı: brief verilir, canlı akış izlenir, müdürle konuşulur |
| Dosyalar | Üretilen ve değiştirilen dosyalar |
| Ayarlar | Sistem kontrolleri, Claude bağlantısı, çalışma alanı |

### Canlı ofis

Ofis bir resim değil, veriyle çalışan bir SVG sahnesi (`bilesenler/OfisGorunumu.tsx`).
Sekiz departman adası, her adada o departmanın gerçek ajanları ahtapot olarak durur:

- **hazır** — sakin süzülme
- **çalışıyor** — hızlı süzülme, kolları dalgalanır, başında işlem ışığı yanar, masasındaki ekran parlar
- **takıldı** — kırmızıya döner ve titrer
- **bağlantı yok** — sönükleşir, hareket durur

Ortadaki turuncu ahtapot müdürdür. Bir adaya tıklayınca Ekip sayfasına gider.
`prefers-reduced-motion` açıksa bütün animasyonlar durur.

### Müdürle konuşma

Oturum tek atışlık değil: müdür sözünü bitirdiğinde Komut Merkezi "cevap bekliyor"
durumuna geçer. Üç seçeneğin olur — **Devam et** (eksikleri tamamlat), **Gönder**
(kendi talimatını yaz) veya **Oturumu kapat**. Konuşma aynı bağlamda sürer, ajans
baştan başlamaz.

Bu, sistemin en kritik davranış düzeltmesiydi: önceden müdür işi bitiremediğinde
"bekliyorum" deyip yarım bırakıyor, iş "başarılı" sayılıyordu.

### Teslimat neden dosya sisteminden okunuyor

Ajanların `Write`/`Edit` çağrılarını dinlemek yeterli değil: alt ajanların iç
mesajları her zaman ana akışa düşmüyor, ayrıca bir ajan dosyayı `Bash` ile de
yazabiliyor. Bu yüzden çalışma başında ve sonunda çalışma alanının anlık
görüntüsü alınıp farkı teslimat olarak raporlanıyor (`src/main/agency/teslimat.ts`).
Araç çağrıları hâlâ dinleniyor — canlı akışta anında görünsün diye.

Aynı sebeple görev panosunda iki kapanış kuralı var: bir lider raporunu verdiyse
onun uzmanları da işini bitirmiştir, ve oturum bittiğinde kimse "çalışıyor"
kalamaz. Bu kurallar olmadan alt ajanlar panoda sonsuza kadar çalışır görünüyordu.

### Onay kapıları

Ajanlar şu iki durumda durup sana sorar:

- Çalışma alanı dışına yazma girişimi (`..` ile kaçış dahil)
- Tehlikeli komutlar: `rm -rf`, `del /f`, `git reset --hard`, `git push --force`, `format`, `dd`, ...

Kurallar `src/main/agency/izin.ts` içinde saf fonksiyon olarak durur ve API çağrısı
yapmadan test edilir. `permissionMode` bilerek `default` bırakıldı: `acceptEdits`
yazma araçlarını kapıya uğratmadan onaylıyordu.

## Dosya düzeni

```
src/
  shared/types.ts          iki tarafın paylaştığı sözleşme
  main/
    index.ts               Electron ana süreci, IPC
    agency/
      roster.ts            33 ajanın kadrosu ve promptları
      engine.ts            müdürü çalıştıran motor, olay akışı
      izin.ts              onay kapısı kuralları
      teslimat.ts          çalışma alanı anlık görüntüsü ve farkı
      auth.ts              Claude oturumu kontrolü
      ayarlar.ts           açılışlar arası hatırlanan tercihler
  preload/index.ts         arayüzün ana sürece açılan tek kapısı
  renderer/
    src/ajansDurumu.ts     olay akışını arayüz durumuna çeviren saf katman
    src/components/        ekranlar
betikler/                  testler
```

## Ajanların işi bitirmesi

Dört ayrı hata, ajansın işi yarım bırakmasına yol açıyordu; dördü de düzeltildi:

1. **Tek atışlık oturum** — müdür devam edemiyordu. Açık oturuma geçildi.
2. **Alt ajanlar arka planda** — SDK varsayılanı "ateşle-unut" olduğu için çağıran
   sonucu beklemiyordu. `background: false` ile senkron yapıldı.
3. **Kadro dışına çıkma** — liderler yerleşik `Explore` ajanını çağırıyordu.
   `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS` ile kapatıldı.
4. **Plan ve doğrulama yok** — müdür promptu beş zorunlu adıma çevrildi: kabul
   kriterlerini yaz, dağıt, teslimatı kendi gözünle denetle, eksikleri kapat, sun.

Ölçülen fark (aynı brief: Express REST API + testler):

| | Önce | Sonra |
| --- | --- | --- |
| Üretilen dosya | 3 | 7 |
| server.js | yok | var |
| Testler | yok | birim + uçtan uca |
| Çalışan departman | 1 | 3 |
| Çalışan ajan | 4 | 11 |

## Durum

Faz 1, 2 ve 3 tamam: hiyerarşi motoru, açık oturum, onay kapıları, görev panosu,
teslimat deposu ve `Claude Agency` tasarımının uygulanmış arayüzü.

Sırada Faz 4 var: kalite kapısı ajanı — teslimatı brief'e karşı madde madde
denetleyip eksik işi geri gönderen bağımsız denetçi.
