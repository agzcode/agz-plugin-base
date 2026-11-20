# Depolama

Bu sayfa AGZ Code'un kurulu eklentileri, ayarlarını ve kendi dosyalarını nerede tuttuğunu, bir eklentinin nereye ne yazabileceğini ve kaldırmanın neyi sildiğini anlatır. Aşağıdaki her yol, motorun kullandığı yoldur.

## Eklenti deposu

Motorun eklentilerle ilgili tuttuğu her şey tek bir klasördedir: eklenti deposu, `~/.agz-code/plugins/`. Ajan dizini `~/.agz-code/agent/` ile yan yanadır; ajan dizini başka bir yerdeyse depo, onun yanındaki `plugins` klasörüdür.

| Depodaki yol | İçerik |
|---|---|
| `registry.json` | Neyin kurulu olduğunun tek kaydı. |
| `packages/<anahtar>/<sürüm>/` | Bir eklentinin kurulu sürümü. Yerinde hiç düzenlenmez. |
| `staging/` | `packages/` içine taşınmadan önceki indirmeler ve açılmış paketler. Motor açılırken boşaltır; `registry.json` dosyasını okuyamadıysa boşaltmaz. |
| `config/<anahtar>.json` | Bir eklentinin ayar değerleri (kullanıcı kapsamı). |
| `secrets.json` | Bütün eklentilerin gizli ayar değerleri. |
| `data/<anahtar>/` | Bir eklentinin kendi kalıcı durumu. |
| `cache/<anahtar>/` | Eklentinin yeniden üretebileceği şeyler. Her an silinebilir. |
| `logs/<anahtar>/` | Bir eklentinin günlük dosyaları. |
| `catalog/` | Eklenti katalog servisinin önbelleği. |

Bir proje, kendi `.agz-code` klasöründe iki şey tutar:

| Projedeki yol | İçerik |
|---|---|
| `<proje>/.agz-code/plugins.json` | Projenin istediği eklentiler. |
| `<proje>/.agz-code/plugin-config/<anahtar>.json` | Bir eklentinin proje kapsamlı ayarlarının bu projedeki değerleri. |

Bir npm ya da git paketi her zaman depodadır, hiçbir zaman projede değil. Yerel klasör olduğu yerde kalır; depo onu yalnız kaydeder.

## Anahtarlar

Eklenti kimliği `<yayıncı>/<ad>` biçimindedir, örneğin `acme/notes`. Diskte kimlik anahtarına dönüşür: `/` yerine `+` yazılır; bu, bir kimliğin içeremeyeceği bir karakterdir. Yani `acme/notes` kimliğinin anahtarı `acme+notes` olur; ayarları `config/acme+notes.json` dosyasında, verisi `data/acme+notes/` klasöründedir. `notes` gibi yayıncısız, çıplak bir kimlik kendi anahtarıdır.

## Kayıt dosyası

`registry.json`, kurulu her eklentiyi kimliğiyle listeler:

```json
{
	"version": 1,
	"plugins": {
		"acme/notes": {
			"source": { "kind": "npm", "spec": "npm:@acme/agz-notes" },
			"scope": "user",
			"version": "1.2.0",
			"entry": "npm/node_modules/@acme/agz-notes",
			"enabled": true,
			"installedAt": 1763400000000,
			"previousVersion": "1.1.0",
			"integrity": { "digest": "sha256:...", "integrity": "sha512-...", "scriptsRun": false },
			"permissions": ["network"]
		}
	}
}
```

| Alan | Anlamı |
|---|---|
| `source` | Eklentinin nereden geldiği. `kind` şunlardan biridir: `npm`, `git`, `https`, `local`, `feed` (AGZ'nin imzalı güncelleme beslemesi) ya da `bundled` (uygulamanın içinde gelen). `spec`, kaynağın verildiği hâlidir; `local` için klasörün mutlak yoludur. |
| `scope` | `user`: `enabled` olduğu sürece her oturumda yüklenir. `project`: yalnız `plugins.json` dosyası onu anan, güvenilen bir projede yüklenir. |
| `version` | Motorun yüklediği, `packages/<anahtar>/` altındaki klasör. `local` eklentide boştur; onun sürüm klasörü yoktur. |
| `entry` | Sürüm klasörünün içindeki paket kökü. |
| `enabled` | Oturumların eklentiyi yükleyip yüklemediği. |
| `preinstalled` | Uygulamayla gelen eklentide `true`. Kapatılabilir, kaldırılamaz. |
| `installedAt` | Kurulumun ya da son güncellemenin zamanı; 1970'ten beri milisaniye. |
| `previousVersion` | Geri dönüş için saklanan sürüm klasörü. |
| `integrity` | Paket dosyalarının özeti, npm bütünlük değeri ya da git commit'i ve kurulumun yaşam döngüsü betiklerini çalıştırıp çalıştırmadığı. |
| `permissions` | Kullanıcının kurulumda ya da son güncellemede onayladığı izinler. |

Motor dosyayı, dosyanın kendi kilidi altında tek adımda değiştirir. Kayıt dosyası olarak okunamayan bir dosyanın üzerine asla yazılmaz: motor bunu bildirir, dosyayı elle düzeltirsin. Daha yeni bir AGZ Code'un yazdığı dosya okunur ama değiştirilmez. Motor çalışırken dosyayı elle düzenleme; Ayarlar > Eklentiler'i kullan.

## Kurulu sürümler

Bir npm ya da git kurulumu önce `staging/` altındaki yeni bir klasöre yazılır. Tamamlanınca klasör `packages/<anahtar>/<sürüm>/` olarak yeniden adlandırılır ve kayıt yazılır. Klasörün adı paket sürümüdür; git kaynağında ardından commit'in ilk yedi karakteri gelir (`1.2.0-3f9a1c2`), ad doluysa sonuna `+r2`, `+r3` eklenir. Kullanılabilir bir sürümü olmayan paket `0.0.0` alır.

Güncelleme kurulu klasöre dokunmaz. Yeni sürümü yanına hazırlar, kaydı ona çevirir ve eski klasörü `previousVersion` olarak saklar. Açık oturumlar değiştirilen klasörü hâlâ okuyor olabilir; bu yüzden motor, hiçbir kaydın anmadığı klasörleri yalnız açılırken siler; `registry.json` dosyasını okuyamadığında ya da dosya daha yeni bir sürümce yazılmışsa hiç silmez.

Yerel klasör kopyalanmaz. Kaydı klasörü gösterir, sürümü yoktur ve motor klasörü yerinde okur. Klasördeki bir değişikliğin kurulum gerekmeden bir sonraki oturum yüklemesine ulaşmasının nedeni budur.

## Ayarlar ve gizli değerler

Kullanıcının bir eklentinin `settings` alanları için kaydettiği değerler `config/<anahtar>.json` dosyasındadır:

```json
{ "version": 1, "values": { "endpoint": "https://api.example.com", "pageSize": 20 } }
```

Gizli alanlar bu dosyada değildir. Bütün eklentilerin gizli değerleri, `auth.json` içindeki sağlayıcı anahtarlarından ayrı olarak, deponun `secrets.json` dosyasındadır:

```json
{ "version": 1, "secrets": { "acme/notes": { "apiToken": "..." } } }
```

İki dosyayı da yalnız kullanıcı okuyabilir (kip 0600); eklenti kendi değerlerini `getPluginSettings()` ile okur. Dosya izinleri eklentileri birbirinden ayırmaz; bkz. [Güvenlik](./security.md#gizli-bilgiler).

`scope: "project"` ile bildirilen bir alanın projeye ait bir değeri de olabilir. Bu değer, kullanıcının dosyasıyla aynı biçimde, `<proje>/.agz-code/plugin-config/<anahtar>.json` dosyasındadır ve o projenin oturumlarında kullanıcının değerinin önüne geçer. Motor onu yalnız güvenilen projede okur. Kullanıcı bu değeri eklentinin ayar sayfasındaki "Bu proje için" bölümünde verir (proje, Eklentiler sayfasında seçili olan projedir); oradaki "Benim değerlerimi kullan" projenin değerlerini siler. Gizli bir alan proje kapsamlı olamaz; yani bir projeye hiçbir zaman gizli değer yazılmaz.

### Erişim düğmeleri

[Standart erişim](./security.md#eklenti-erisimi) bildiren bir eklentide deneysel `access_<ad>` anahtarları, eklentinin kullanıcı ayar dosyasındaki `true` veya `false` değerleridir. Anahtar yoksa erişim kapalıdır. Motor bunları proje ayarlarından okumaz. Bildirilen erişim değerleri `getPluginSettings()` sonucunda görünür. Normal `plugins.settings.update` istekleri bu değerleri değiştirmez. Eklenti kodundan bu anahtarlara doğrudan yazmayın.

İstemciler deneysel `plugin_access` protokol özelliğini kullanır:

- `plugins.access.get`, `{ pluginKey }` alır ve `{ access, revision }` döndürür. `access` listesi manifest sırasıyla `{ name, enabled, note? }` girdilerini içerir. `revision`, kullanıcı ayar dosyasının sürüm bilgisidir. Dosya henüz yoksa `null` döner.
- `plugins.access.set`, `{ pluginKey, name, enabled, baseRevision? }` alır ve bildirilen tek bir düğmeyi değiştirir; diğer değerler olduğu gibi kalır. Verilen `baseRevision` güncel değilse `data.revision` alanını içeren bir `conflict` hatası döner. Değişikliği uygulamadan önce durumu yeniden okuyun. İstek başarılı olursa güncel durum döner ve motor uzantılara `settings_change` olayı gönderir.

## Eklentinin kendi klasörleri

Eklenti kendi yolunu seçmez, klasörlerini ister:

```ts
const paths = agz.getPluginPaths();
// paths.data, paths.cache, paths.logs, paths.package
```

| Klasör | Yol | Kullanım |
|---|---|---|
| `data` | Depoda `data/<anahtar>/` | Kalıcı durum: bir veritabanı, bir dizin, kaydedilmiş sonuçlar. Güncellemelerden ve düz bir kaldırmadan sonra da durur. |
| `cache` | Depoda `cache/<anahtar>/` | Yeniden üretilebilenler. Kullanıcı ya da motor her an silebilir. |
| `logs` | Depoda `logs/<anahtar>/` | Eklentinin ve başlattığı süreçlerin günlük dosyaları. |
| `package` | Kurulu sürüm klasörünün içindeki paket kökü ya da yerel eklentide geliştiricinin klasörü | Eklentinin kendi dosyaları. Salt okunur: her güncellemede yerini başka bir klasör alır. |

Çağrı döndüğünde `data`, `cache` ve `logs` vardır (kip 0700). Motor modülü aynı klasörleri `engine.paths` olarak alır. Manifest kimliği olmayan bir pakette `getPluginPaths()` hata fırlatır.

Kullanıcının kendi işini, örneğin kullanıcının eklentiden üretmesini istediği belgeleri, bu klasörlere koyma: kullanıcının seçtiği yere koy ve o yeri `userContent` içinde bildir (bkz. [manifest](./manifest.md#kullanici-icerigi)).

## Proje eklentileri

`<proje>/.agz-code/plugins.json`, bir projenin eklentilerini kimlikleriyle anar:

```json
{
	"version": 1,
	"plugins": {
		"acme/notes": { "source": "npm:@acme/agz-notes" },
		"acme/lint": { "enabled": false }
	}
}
```

- Bir girdi, `project` kapsamındaki bir eklentinin bu projede yüklenmesini sağlar. `source`, deposunda henüz bulunmayan bir makinede eklentinin nereden kurulacağını söyler: projenin eklenti listesi onu o zaman kurulu değil olarak gösterir.
- `enabled: false`, bir eklentiyi bu projenin oturumlarının dışında tutar; kullanıcı kapsamındaki bir eklentiyi de.
- Dosya yalnız güvenilen projede etkilidir. Güvenilmeyen projede eklenti listesi girdilerini yine gösterir, ama salt okunur olarak; hiçbir oturum onları yüklemez.
- Depoyla birlikte gider; projede çalışan herkes aynı listeyi alır.

## Kaldırma neyi siler

Ayarlar > Eklentiler'de bir eklentiyi kaldırırken tek bir soru sorulur: "Ayarlarını ve verisini de sil" kutusu.

| | Kaldır | Kutu işaretliyken kaldır |
|---|---|---|
| `registry.json` içindeki kayıt | Silinir | Silinir |
| `packages/<anahtar>/` | Silinir (yerel klasör yalnız unutulur) | Silinir (yerel klasör yalnız unutulur) |
| `config/<anahtar>.json` ve eklentinin gizli değerleri | Kalır | Silinir |
| `data/<anahtar>/`, `cache/<anahtar>/`, `logs/<anahtar>/` | Kalır | Silinir |
| `userContent` içinde sayılan, yukarıdaki klasörlerin dışındaki yerler | Kalır | Kalır |
| `<proje>/.agz-code/plugin-config/<anahtar>.json` | Kalır | Kalır |

Düz bir kaldırmanın bıraktıkları, eklenti yeniden kurulduğunda yine kullanılır. Ayarlar > Eklentiler'in altındaki "Kaldırılan eklentilerin verisi" kartı, kaldırılmış eklentilerin depoda bıraktıklarını boyutuyla listeler ve oradan siler.

Bir proje eklentisini tek bir projeden kaldırmak, başka bir güvenilen proje onu hâlâ anıyorsa yalnız o projenin listesinden çıkarır: kayıt, paket ve veri kalır. Eklenti, böyle son proje de kaldırdığında depodan çıkar. Uygulamayla gelen bir eklenti kaldırılamaz, yalnız kapatılır.

## Başka bir bilgisayara taşımak

Motorun `data-archive` komutu (bkz. [Kurulum](./install.md#verileri-baska-bir-makineye-tasimak)) deponun `registry.json` dosyasını, `config/` ve `data/` klasörlerini alır. `packages/`, `staging/`, `cache/`, `logs/` ve `catalog/` dışarıda kalır; `data/` içinde de her `node_modules` klasörü, her `*.tmp` ve `*.db-shm` dosyası ve düz dosya ya da klasör olmayan her şey. `secrets.json` bir kimlik dosyasıdır; yalnız `--with-credentials` ile gelir.

İçe aktarımdan sonra kayıt her eklentiyi anar ama paketler yerinde değildir: onları Ayarlar > Eklentiler'deki Güncelle ile kayıtlı kaynaklarından yeniden kur. Yerel klasörden okunan bir eklenti hâlâ eski bilgisayardaki yolu gösterir. Projenin kendi dosyaları (`plugins.json` ve `plugin-config/`) arşivde yoktur; projenin deposuyla taşınır.

## Önceki bir sürümden gelmek

Önceki sürümler eklenti durumunu birkaç ayrı yerde tutuyordu. Motor bunları bir kez depoya taşır: kullanıcının kendisininkini ve bildiği güvenilen projelerinkini açılırken, başka bir projeninkini eklentileri ilk listelendiğinde.

| Önceki yer | Şimdi |
|---|---|
| `agz.json` içinde `pluginSettings` | `config/<anahtar>.json` |
| `auth.json` içinde `plugin:<kimlik>:<anahtar>` girdileri | `secrets.json` |
| `agz.json` ve projenin `.agz-code/settings.json` dosyasındaki `packages` listesi | `registry.json` kayıtları ve projenin `plugins.json` dosyası |
| Ajan dizini altındaki `npm/` ve `git/` | `packages/<anahtar>/<sürüm>/` |

Taşıma, ayar dosyalarından çıkardıklarının bir kopyasını `~/.agz-code/agent/agz/settings-backup/plugin-store/` altında saklar. Yerel klasör olduğu yerde kalır.
