# Uyumluluk

Bir eklenti, çalıştığı SDK sürümlerini bildirir; ev sahibi eklentiyi yüklerken bu bildirimi denetler. Bu sayfa sürüm aralığını, bir eklentideki SDK ve kiti, ve uyumsuzlukta ne olduğunu anlatır.

## SDK sürüm aralığı

`package.json` içindeki `engines["agz-plugin-sdk"]` bir semver aralığıdır, örneğin `^1`. Alan isteğe bağlıdır: yoksa aralık `^1` olur. Semver aralığı olmayan bir değer manifest hatasıdır.

Ev sahibi aralığı kendi SDK sürümüyle karşılaştırır. Ev sahibinin karşılamadığı aralığa sahip bir eklenti yüklenmez; Ayarlar > Eklentiler'deki satırı `sdk_range` sorununu nedeniyle birlikte gösterir.

Eklentinin kullandıklarını içeren en düşük SDK sürümünü yazın. Motor modülü, bildirilen MCP sunucuları, proje kapsamlı ayarlar, `permissions`, `userContent` ve `getPluginPaths()` SDK 1.1.0 ile geldi; bunlardan birini kullanan eklenti `^1.1.0` bildirir: böylece eski bir uygulama eklentiyi o parça olmadan yüklemek yerine yükleyemediğini söyler. Durum çubuğu görünümleri (`place: "statusbar"`, motor modülünün `registerView` ve `host` üyeleri), `stat`, `chart` ve `ring` blokları, kapalı bölümler, tablo sütununun `align` değeri eklenti kanalı (`handle`, `publish`, `onSubscribers`), `engine.notify`, `engine.quotas` ve `usage` izni SDK 1.2.0 ile geldi. `session_compaction_state` kancası (eklentinin durum satırlarının sıkıştırma özetinde yer alması) ve `session_compact` kancası SDK 1.3.0 ile geldi. Ana oturumla sınırlı araçlar (`scope: "main"`), `ctx.agents.run`, pakete özel yanıt profilleri ve `card: "agent"` ya da `as: "markdown"` kullanan araç görünümleri SDK 1.4.0 gerektirir.

## Unstable giriş noktası

Yeni bir yüzey önce `@agz-yazilim/plugin-sdk/unstable` içinde yayımlanır. Orada dışa aktarılanlar SDK'nın küçük bir sürümünde hâlâ değişebilir; yayımlanmış bir eklenti ya da `agz-plugin-base` deposundaki bir örnek onunla çalışınca ana giriş noktasına taşınır. Bugün motor modülünün türlerini içerir: `PluginEngineFactory`, `PluginEngineAPI`, `PluginEngineHost` ve `PluginEngineStats`. Onları `import type` ile içe aktarın ve SDK sürümünü yükselttiğinizde bir değişikliği izlemeyi bekleyin.

## Eklentide SDK ve kit

- `@agz-yazilim/plugin-sdk` (türler ve `SDK_VERSION`ı dışa aktaran küçük bir çalışma zamanı) ile `@agz-yazilim/plugin-kit`, `devDependencies` altına yazılır. Şablonlar ikisini de sabitler.
- Ev sahibi, eklenti çalışırken `@agz-yazilim/plugin-sdk` ve `typebox` paketlerini eklenti koduna sunar; bu yüzden eklenti bunları paketine koymaz.
- İki paket de MIT lisansıyla npm kayıt defterindedir; kurulumu hızlı başlangıç gösterir.
- Yeni bir eklenti, onu oluşturan kitin sürümünü alır; böylece testleri o kitle çalışır.

## Uyumsuzluk ne yapar

| Yer | Sonuç |
|---|---|
| `engines["agz-plugin-sdk"]` bir semver aralığı değil | `agz plugin check`, `must be a semver range` ile başarısız olur. Ev sahibi eklentiyi yüklemez. |
| Kurulu SDK aralığı karşılamıyor | `agz plugin check` ve `agz plugin test`, `does not satisfy` ile başarısız olur. |
| Klasörde SDK kurulu değil | `check` aralığın denetlenmediğini uyarır ve `npm install` ister. |
| Ev sahibinin SDK'sı aralığı karşılamıyor | Eklenti yüklenmez. Satırı `sdk_range` gösterir. |

`agz plugin test --integration`, ev sahibinin kararını motorun `plugin-check` raporundan alır: raporun `sdk` alanı motorun SDK sürümünü, eklentinin aralığını ve `ok` değerini verir; motor aralığı reddederse `ok` `false` olur.
