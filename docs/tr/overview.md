# Eklenti nedir

Eklenti; bir klasör, npm paketi ya da Git deposu olabilen ve `package.json` dosyasında `agzPlugin` manifesti bulunan bir pakettir. Manifest, paketin AGZ Code'a neler eklediğini listeler. Bazı katkılar motorun okuduğu dosyalardır (beceriler, prompt'lar, temalar, ajan tanımları). Bazıları ise motorun, oturum başına ya da bütün motor için bir kez çalıştırdığı koddur (araçlar, kancalar, komutlar, MCP sunucuları, sağlayıcılar).

AGZ Code'un ve AGZ'nin kendi eklentilerinin kaynak depoları özeldir. Bu belgeler, MIT lisanslı npm paketleri ve açık `agzcode/agz-plugin-base` deposundaki şablon ve örneklerle eklenti yazabilirsin. Kendi eklentin açık da olabilir, kapalı da.

Manifest [manifest sayfasında](./manifest.md) anlatılır. İlk eklentini yapmak için [hızlı başlangıca](./quickstart.md) geç.

## Bir eklenti neler ekleyebilir

Manifest kaynakları düz dosyalardır. Eklenti bunları `agzPlugin` içinde listeler.

| Kaynak | Nedir | AGZ Code ne yapar |
|---|---|---|
| `skills` | İçinde `SKILL.md` bulunan klasör; isteğe bağlı araçlar, betikler ve örnekler | Ajanlar skill_route ile bulur, skill_load ile yükler. Araçları Code Mode'dan çağrılır. Bkz. [beceri eklentileri](./skill-plugins.md). |
| `prompts` | Markdown prompt şablonu | Dosyanın adını taşıyan bir slash komutu olur. Metni, yazdığın argümanlarla açılır. |
| `themes` | Tema JSON dosyası | Yükleyici çözer. Motorun arayüz bağlamı tema bildirmez (aşağıdaki masaüstü sınırlarına bak). |
| `agents` | Markdown ajan tanımı | Bir alt ajan profili olur. Bkz. [manifest sayfasındaki](./manifest.md) ajan bölümü. |

Eklenti kodu, `extensions` alanında listelenen TypeScript ya da JavaScript modülüdür. Eklenti API'sini alan bir fabrika fonksiyonu dışa aktarır; ayrıntısı [eklenti kodu API'si sayfasında](./extension-api.md). Bu API ile bir eklenti şunları yapabilir:

| Katkı | API | Not |
|---|---|---|
| Araçlar | `registerTool` | `direct` araçları modele verilir; `codemode` ve `deferred` araçlarına Code Mode üzerinden ulaşılır. `model-only` ve `hidden` da desteklenir; bkz. [erişim kuralları](./extension-api.md). |
| Kancalar | `on` | Oturum, ajan, mesaj, araç ve sağlayıcı olaylarına tepki verir. `tool_call` kancası bir çağrıyı engelleyebilir. |
| Komutlar | `registerCommand` | Slash komutları. İşleyici `ctx.ui` kullanabilir. |
| MCP sunucuları | `registerMcpServer` | Motorun MCP eklentisi sunucuyu oturum için bağlar. |
| Arayüz çağrıları | `ctx.ui` | Diyaloglar, bildirimler, durum metni ve widget'lar. |
| Eklenti klasörleri | `getPluginPaths` | Eklentinin kendi `data`, `cache` ve `logs` klasörleri; bkz. [Depolama](./storage.md). |
| Görünümler | `registerView` | Uygulamanın veriden çizdiği bir panel, kenar çubuğu sayfası ya da durum çubuğu öğesi; `ui.views` içinde bildirilir. Durum çubuğu öğesini motor modülü kaydeder. |

Manifest, çağrı gerektirmeyen şeyler de bildirir:

| Alan | Ne ekler |
|---|---|
| `engine` | Motor modülü: oturum başına değil, eklenti açıkken bir kez çalışan kod. Bütün oturumların paylaştığı arka plan işleri için. |
| `mcpServers` | Motorun, eklentiyi yükleyen her oturumda uzantı kodu olmadan kaydettiği MCP sunucuları. |
| `settings` | Ayarlar > Eklentiler altında bir ayar formu; bir alan gizli olabilir, bir alan proje kapsamlı olabilir. |
| `ui` | Görünümler ve eklentinin kendi araç kartlarının süslemeleri. |
| `bots` | Ayarlar > Botlar için bot şablonları. |
| `systemPrompt` | Ajanların sistem istemine düzenlemeler. |
| `permissions` | Eklentinin neye ihtiyaç duyduğunu söylediği, kurulumdan önce gösterilen liste. |
| `access`, `accessNotes` | Kullanıcının açıp kapattığı deneysel erişim düğmeleri ve eklentinin bunlara eklediği notlar. Bkz. [Eklenti erişimi](./security.md#eklenti-erisimi). |
| `userContent` | Eklentinin kullanıcının kendi işini tuttuğu, hiçbir kaldırmanın silmediği yerler. |

Her alan [manifest sayfasında](./manifest.md) anlatılır.

Bir eklentide birkaç parça birden olabilir. Beceri yönergeleri ve bir betik aracı getirirken eklenti kodu bir kanca ya da MCP sunucusu ekleyebilir, motor modülü de bir dizini güncel tutabilir.

## Eklenti nerede çalışır

- Eklenti kodu motorun içinde, yani masaüstü uygulamanın arkasındaki süreçte çalışır. Motor kendi makinende ya da uzak bir makinede olabilir. Kod, motor kullanıcısının yetkileriyle çalışır: dosya okuyabilir, süreç başlatabilir, ağa çıkabilir. Yalnız güvendiğin kodu kur.
- Eklenti kodu her oturum için yeniden yüklenir. Motor modülü motor başına bir kez yüklenir ve eklenti açık olduğu sürece çalışır; hiçbir oturum açık değilken de. İkisi değişken paylaşmaz.
- Uzantı dosyasından kaydedilen ve hiçbir ajan profilinde listelenmeyen araçlar, salt okunur explorer ve verifier dahil her profile eklenir. Dosya yolu olmayan yerleşik araçlar eklenmez. Profilin salt okunur rolü, değişiklik yapan bir eklenti aracını tek başına engellemez. Motorun çağrıları sınırlaması için [eklenti erişimini](./security.md#eklenti-erisimi) bildirin. Araçta veri değiştirmeden, göndermeden veya silmeden önce onay isteyin.
- Beceri betik araçları motorun alt süreçleri olarak çalışır. Bkz. [beceri eklentileri](./skill-plugins.md).
- Uygulama, `ctx.ui` üzerinden gelen oturum arayüzü isteklerini gösterir. Onaylanan masaüstü arayüz modülü ise ayrı olarak uygulama penceresinde çalışır.
- Ana oturumun arayüzü vardır: eklentinin `session_start` işleyicisi `ctx.hasUI` değerini true görür. Alt ajan oturumu da eklentinin uzantısını yükler, ama orada `ctx.hasUI` false olur. Diyalogları `ctx.hasUI` ile koru.
- Eklenti değişiklikleri yeni ya da yeniden açılan oturumlarda geçerli olur. Çalışan oturum, sen yeniden yükleyene kadar yüklediği uzantıları korur (aşağıda Yeniden yükleme).

## Masaüstü sınırları

Motor, masaüstü uygulama için `ctx.ui` uygular. Her çağrının görünür bir etkisi yoktur.

| Çağrı | Masaüstü uygulamada |
|---|---|
| `notify` | Oturumda bildirim olarak görünür. |
| `select`, `confirm`, `input`, `editor` | Diyalog olarak görünür. İptal, zaman aşımı ya da kesinti `undefined` döndürür (`confirm` için `false`). |
| `setStatus` | Oturum başlığında rozet olarak görünür. |
| `setWidget`, dize dizisiyle | Oturum başlığındaki açılır widget bölümünde düz metin olarak görünür. Yerleşim seçeneği yok sayılır. |
| `setWidget`, bileşen fabrikasıyla | Gösterilmez. Motor her widget anahtarı için bir uyarı bildirimi gönderir. |
| `setTitle` | Oturum başlığını günceller. |
| `setEditorText`, `pasteToEditor` | Atılır: motorda bunlar için protokol olayı yoktur, yazı alanı değişmez. |
| `getEditorText` | Her zaman boş dize döndürür. |
| Temalar | `getAllThemes` boş liste, `getTheme` `undefined`, `setTheme` `success: false` döndürür. |

Ayrıntılar [eklenti kodu API'si sayfasında](./extension-api.md).

## Kaynaklar ve kapsam

Eklentiyi Ayarlar > Eklentiler'den şu kaynaklardan kurarsın:

| Kaynak | Biçim | Ne olur |
|---|---|---|
| Resmî | Ayarlar > Eklentiler'de listelenir | AGZ Code ile birlikte gelir. Tek düğmeyle eklenir ya da kaldırılır. |
| npm | `npm:@scope/name@1.2.0` | Motor onun için eklenti deposunun bir hazırlık klasöründe `npm install` çalıştırır. Kurulum betikleri yalnız onay penceresinde Kurulum betiklerini çalıştır seçeneği işaretlenirse çalışır. |
| GitHub | `owner/repo`, `owner/repo@ref` ya da `github:owner/repo@ref` | `git:github.com/owner/repo@ref` olarak saklanır. Motor bir hazırlık klasörüne klonlar ve `npm install --omit=dev --legacy-peer-deps --ignore-scripts` ile kurar. Kurulum betikleri (`--ignore-scripts` olmadan) yalnız onay penceresinde Kurulum betiklerini çalıştır seçeneği işaretlenirse çalışır. |
| HTTPS git adresi | Kimlik bilgisi olmayan `https://host/path` | GitHub ile aynı. |
| Yerel klasör | Motorun makinesinde mutlak yol | Klasör eklenti deposuna kaydedilir ve yerinde okunur. Kopyalanmaz, bu yüzden geliştirmeye uygundur. Uygulama Geliştirme rozeti gösterir. |

SSH adresleri, `git@...`, `http://`, göreli yollar ve arşiv dosyaları reddedilir.

Kurulum ve güncelleme, üçüncü taraf kodu çalıştırdığı için onayını ister. Eklenti izin bildiriyorsa uygulama bunları indirmeden sonra gösterir ve ikinci bir onay bekler. Eklenti kodu da onu yükleyen her oturumda çalışır.

Kurduğun her eklenti tek bir yerde, eklenti deposunda (`~/.agz-code/plugins/`) durur: npm ya da git paketi orada bir sürüm klasörü olarak, yerel klasör ise onu gösteren bir kayıt olarak. (AGZ'nin uygulamayla gelen kendi eklentileri uygulamanın klasöründen okunur.) Düzeni [Depolama](./storage.md) anlatır. Bundan iki kural çıkar:

- Eklenti `agzPlugin.id` değeriyle tanınır ve kurulu iki eklenti aynı kimliği paylaşmaz. Kimliği başka bir kaynaktan zaten kurulu olan bir paketi kurmak şu iletiyle reddedilir: `a plugin with the id "<kimlik>" is already installed (<kaynak>); remove it first` (indirilen bir pakette ileti `, or update it` ile biter). Önce kurulu olanı kaldır; örneğin yayımlanan paketi kurmadan önce geliştirdiğin yerel klasörü.
- Bir kaynak bir kez kurulur. Aynı kaynağı başka bir proje için yeniden kurmak, o projeyi kullananlarına ekler; hiçbir şey iki kez indirilmez.

Eklentinin bir kapsamı vardır:

- Kullanıcı kapsamı motorun bütün projeleri için geçerlidir.
- Proje kapsamı tek bir proje içindir. Proje eklentiyi, depoyla birlikte giden `.agz-code/plugins.json` dosyasında anar; paketin kendisi ötekiler gibi eklenti deposundadır. Proje eklentisi yalnız güvenilen projede yüklenir. Güvenilmeyen projede liste onu salt okunur gösterir ve oturumlar yüklemez. Güveni projenin oturumunda ya da Proje güveni ayarlarında verirsin. Bir proje, kullanıcı kapsamındaki bir eklentiyi kendi oturumları için kapatabilir de.

## Yeniden yükleme

Eklenti ekledikten, güncelledikten ya da kaldırdıktan sonra açık oturumlar yükledikleriyle devam eder. Yeni ya da yeniden açılan oturumlar yeni seti yükler. Değişikliği açık oturumlara hemen uygulamak için Ayarlar > Eklentiler'de Oturumları yeniden yükle'ye bas. Çalışmakta olan oturum, çalışması bitince yeniden yüklenir. Zaten çalışan alt ajanlar değişmez.

## Resmî eklentiler

AGZ Code şu eklentilerle gelir. Her biri uygulamayla birlikte gelen becerileri getirir; `audio-generation` ve `3d-generation` ayrıca motorda çalışan araçlar getirir ve bunlar tablonun altında listelenir.

| Kimlik | Ne ekler | Varsayılan |
|---|---|---|
| `excel` | Elektronik tabloları okur ve düzenler | Açık |
| `pdf` | PDF belgelerini inceler ve oluşturur | Açık |
| `frontend-design` | Arayüz tasarımı yönergeleri | Açık |
| `image` | Görselleri inceler ve düzenler | Açık |
| `audio-generation` | Ayarlardaki ses üretimi sağlayıcısıyla bir betikten konuşma, ses efekti ve müzik üretir | Açık |
| `3d-generation` | Ayarlardaki 3B üretimi sağlayıcısıyla bir metinden ya da görsellerden GLB 3B modeli üretir | Açık |
| `plugin-dev` | Eklenti geliştirme araçları ve bu belgeler | Kapalı |

`audio-generation` motor araçlarını (`generate_audio` ve `audio_catalog`), `3d-generation` ise `generate_3d` ve `model3d_catalog` araçlarını getirir. İkisi de Ayarlar'da bir sağlayıcının API anahtarını ister. Birini kapatmak, onun motor araçlarını yeni oturumların ve yeni alt ajanların ajan profillerinden çıkarır.

Ayarlar > Eklentiler'de Eklenebilir bölümünü aç ve Ekle'ye bas. Kaldır, eklentiyi yine kapatır. Seçim `agz.json` dosyasının `plugins` bölümünde, `official` altında kimlik-boolean eşlemesi olarak saklanır.

Ajanların senin için eklenti iskeleti kurup denetlemesini istiyorsan `plugin-dev` ekle. Araçları `paths`, `manifest_check`, `scaffold` ve `pack_check`'tir; [hızlı başlangıçta](./quickstart.md) kullanılır.

### Resmî bir eklentiyi güncellemek

Beş beceri eklentisi (`excel`, `pdf`, `frontend-design`, `image` ve `plugin-dev`) uygulamayla birlikte gelir. Bu eklentilerin code.agzyazilim.com üzerinde daha yeni bir imzalı sürümü varsa uygulama sürümü beklemeden o sürüm alınabilir. AGZ yeni sürümleri orada imzalı bir dizinde yayımlar; motor bu dizini yalnız Ayarlar > Eklentiler'de Güncellemeleri denetle'ye ya da Güncelle'ye bastığında okur.

Eklentinin kartında Güncelle'ye basıp onayla. Motor arşivi indirir ve kullanmadan önce denetler: dizin AGZ'nin eklenti anahtarıyla imzalı olmalıdır (uygulama güncelleme anahtarından ayrı, kendi anahtarı); arşiv, dizinin verdiği boyut ve SHA-256 değerleriyle eşleşmelidir; beceri klasörünün dosyaları, araç tanımları ve vendor dosyalarının SHA-256 değerleri doğrulanmalıdır. İndirilen kopya yalnız sürümü uygulamanın kendi sürümünden yeniyse ve bu uygulama ile eklenti SDK'sı, kopyanın istediği sürümlere uyuyorsa kullanılır. Sunucuya ulaşılamazsa ya da bir denetim geçmezse hiçbir şey değişmez ve uygulama nedenini gösterir.

Kartta Uygulamanın sürümünü kullan'a basarsan uygulamayla gelen kopya geri döner. Açık oturumlar, Oturumları yeniden yükle'ye basana kadar yükledikleri kopyayla çalışır.

Yeni bir beceri sürümü açık oturumlara Ayarlar > Eklentiler'deki Oturumları yeniden yükle ile ulaşır; yeni oturumlar onu başlarken yükler.

Ses üretimi ve 3B üretimi sağlayıcı kodlarını bu yolla daha sonra, sağlayıcı paketleri yayımlandığında alır. O zamana kadar yalnız uygulamayla güncellenirler.

## Motor ve masaüstü katkıları

- [Masaüstü arayüz modülleri](./manifest.md#masaüstü-arayüz-modülü), o cihazda izin verildikten sonra eklentinin React kodunu masaüstü penceresinde çalıştırır. Yedek olarak bildirimsel görünümleri koru.
- [Durum çubuğu görünümleri](./manifest.md#durum-çubuğu-görünümleri), bir motor modülünün sağladığı göstergeyi ve paneli sunar.
- [Yerel alt süreçler](./manifest.md#yerel-alt-süreçler), manifestte bildirilen ve dosya özeti doğrulanan platforma özgü programları çalıştırır.
- [Arka plan yardımcıları](./manifest.md#arka-plan-yardımcıları), elle, zamanlanarak veya bir olay tetiklendiğinde motor üzerinde görev çalıştırır.
- [Model sağlayıcıları](./manifest.md#model-sağlayıcıları), OpenAI uyumlu uç noktaları motor modülünden `engine.providers.register()` ile kaydeder.
- [Bildirimler ve kotalar](./manifest.md#bildirimler-ve-kotalar), ilgili izinlerle motor modülünün kullanıcıya bildirim göndermesini ve sağlayıcı kotalarını okumasını sağlar.

[İmzalı katalog yayınları](./testing-packaging.md#genel-katalogda-imzalı-sürümler) için katalog yöneticisinin yayıncıyı doğrulaması ve her sürümü onaylaması gerekir.

## Sonraki adımlar

- [Hızlı başlangıç](./quickstart.md): eklenti yap, bağla ve çağır.
- [Manifest](./manifest.md): her alan ve kural.
- [Eklenti kodu API'si](./extension-api.md): araçlar, kancalar, komutlar ve daha fazlası.
- [Beceri eklentileri](./skill-plugins.md): araçlı beceriler.
- [Depolama](./storage.md): eklentilerin, ayarların ve verinin nerede tutulduğu.
- [Örnek eklentiler](./examples.md): açık deponun şablonları ve örnekleri.
