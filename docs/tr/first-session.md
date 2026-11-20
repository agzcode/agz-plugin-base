# İlk oturum

Uygulamayı ilk açtığında altı adımlık bir kurulum sihirbazı çıkar. Her adım tek bir kararı alır. Sihirbaz, hiçbir sağlayıcı kurulmamışken ve kurulum daha önce tamamlanmamışsa açılır; sağlayıcısı olan bir kurulumda hiç görünmez. Her ayarı sonra Ayarlar'dan değiştirebilirsin.

Devam düğmesi sihirbazı sırayla ilerletir. Üçüncü adımdan itibaren "Kalanını atla" proje adımına geçer; atlanan adımlar kendi varsayılan değerlerini korur.

## Hoş geldin

Kurulumun yaklaşık bir dakika sürdüğünü söyler. Anahtarların bu bilgisayarda kalır; yalnız istemlerin ve ajanın okuduğu dosyalar seçtiğin sağlayıcıya gider.

## Sağlayıcı bağlamak

Ajanın cevap vermesi için bir modele ihtiyacı var. İlk açılışta dört sağlayıcı sunulur: Anthropic (Claude hesabı ya da API anahtarı), OpenAI (ChatGPT hesabı ya da API anahtarı), OpenRouter (API anahtarı, çok sayıda model) ve Google (Gemini API anahtarı).

- **Hesapla giriş:** sağlayıcının adını taşıyan "… hesabıyla giriş yap" düğmesi tarayıcıda oturum açma sayfasını açar.
- **Anahtarla giriş:** anahtarı yapıştır ve "Anahtarı bağla" de. Uygulama, anahtarın geçerliliğini sağlayıcıya en çok 10 saniye sorar. Sağlayıcı anahtarı reddederse anahtar kaydedilmez. Sağlayıcıya ulaşılamazsa da kaydedilmez; bağlantını denetleyip yeniden dene. Denetimi olmayan bir sağlayıcının anahtarı kaydedilir, ama doğrulanmamış olarak işaretlenir.

## Ana model ve yardımcı modeller

Sağlayıcının modellerinden birini seç; önerilen model önceden seçilidir. Liste her modelin milyon token başına fiyatını gösterir. Modeli istediğin zaman mesaj kutusundan değiştirebilirsin.

Yardımcı modeller bu adımın "Ayrıntılar" ekranında durur. İkisi de isteğe bağlıdır, ana modelin yerine geçmez ve yeni kurulumda kapalıdır:

| Yardımcı | Ne işe yarar | Maliyet | Ne gönderir |
|---|---|---|---|
| Karar modeli | Beceri seçer ve sonuçları sıralar | Küçük model; günlük token sınırı | İstem parçaları; OpenRouter ya da TypeSafe'e |
| Anlamsal arama (gömme) | Hafıza aramasını anlama göre yapar | Kullanım başına; günde 5 milyon token | Hafıza notları ve beceri metinleri; OpenRouter'a |

Karar modeli için OpenRouter ya da bir TypeSafe anahtarı, gömme için OpenRouter gerekir. Bunları Ayarlar > Sağlayıcı girişleri bölümünde bağlayıp sonra açarsın.

Bunlar kapalıyken:

- Hafıza araması yalnız kelimelerle yapılır. Arama sonucu anlam aramasının kullanılmadığını söyler.
- Karar modeline dayanan değerlendirmeler atlanır. Atlanan bir değerlendirme "hayır" cevabı sayılmaz.

## Harcama tavanı

İsteğe bağlı bir günlük tavan: dolar cinsinden (liste fiyatına göre, bütün oturumlar birlikte). Boş bırakırsan tavan olmaz. Tavana varınca iş durur ve bekler; sürdürebilir ya da tavanı yükseltebilirsin. Gün değiştiğinde günlük tavan yeniden açılır. Oturum ve token tavanlarını Ayarlar > Kullanım ve maliyet bölümünde koyarsın.

## Onaylar

Beş riskli işlem sınıfının her biri için ajanın sana sorup sormayacağını seçersin. Adım, beşini de "İzin ver" ile başlatır. "Bunlardan önce sor" düğmesi beşini birden "Sor" yapar. Sınıfların ne olduğunu ve soru penceresinin nasıl çalıştığını [güvenlik sayfasında](./safety.md#onaylar) bulursun. Ayarları sonra Ayarlar > Onaylar bölümünden değiştirirsin.

## Proje ve güven

Ajanın çalışacağı klasörü seç ("Klasör seç…"). Sonra o klasöre güven kararı ver:

- **Bu klasöre güven:** klasörün `AGENTS.md` dosyası, becerileri ve MCP sunucuları yüklenir.
- **Güvenme:** hiçbiri yüklenmez. Bunu sonra Ayarlar'dan değiştirebilirsin.

Güvenmediğin bir klasördeki talimat dosyaları ve betikler ajanın davranışını değiştirebilir. Güven yalnız tanıdığın klasörlere ver.

## İlk mesajın

Ön tanımlı bir ilk istem önerilir: klasörü incelemesini, ne işe yaradığını, nasıl çalıştırılacağını ve bozuk görünen bir şey olup olmadığını söylemesini ister. Metni düzenleyebilir ya da tamamen değiştirebilirsin. "İlk oturumu başlat" düğmesi oturumu açar.

Oturumda mesajını yazarsın, ana ajan (lider) işi yapar ya da parçalarını uzman ajanlara verir. Ajanların kim olduğunu ve ne yaptığını [ajanlar sayfasında](./agents.md) anlatıyoruz. Ajanın dosyalara yaptığı değişiklikleri Değişiklikler panelinden geri alabilirsin.
