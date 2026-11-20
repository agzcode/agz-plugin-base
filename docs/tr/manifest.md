# agzPlugin manifesti

Manifest, paketin `package.json` dosyasındaki `agzPlugin` anahtarıdır. Paketin neler içerdiğini AGZ Code'a söyleyen tek şey odur. Sıradan npm alanları (`name`, `version`, `files`, `dependencies`) `package.json`'ın üst düzeyinde kalır; eklenti alanları `agzPlugin` içine yazılır.

Bu örnek kimlik alanlarını ve bütün kaynak alanlarını kullanır. `manifest_check`, aşağıdaki dosya düzeniyle bunu kabul eder. Öteki alanların (`engine`, `mcpServers`, `userContent`, `permissions`, `settings`, `ui`, `bots` ve `icon`) aşağıda kendi bölümleri vardır.

```json
{
	"name": "@example/agz-plugin-tools",
	"version": "1.0.0",
	"type": "module",
	"files": ["extensions", "skills", "prompts", "themes", "agents"],
	"agzPlugin": {
		"schemaVersion": 1,
		"id": "example/tools",
		"name": "Example Tools",
		"description": "Tools and instructions for a focused workflow.",
		"publisher": "Example",
		"homepage": "https://example.com/plugins/tools",
		"extensions": ["extensions/index.ts"],
		"skills": ["skills/*", "!skills/legacy", "+skills/extra", "-skills/extra"],
		"prompts": ["prompts", "!draft-*.md"],
		"themes": ["themes/*.json"],
		"agents": ["agents/reviewer.md"],
		"systemPrompt": "system-prompt.json"
	}
}
```

Beklenen dosya düzeni:

```
extensions/index.ts
skills/review/SKILL.md
skills/legacy/SKILL.md
skills/extra/SKILL.md
prompts/review.md
prompts/draft-one.md
themes/dark.json
agents/reviewer.md
system-prompt.json
```

Bu paket için `manifest_check` `ok: true` döndürür ve şu dosyaları etkin sayar: `extensions/index.ts`, `skills/review/SKILL.md`, `prompts/review.md`, `themes/dark.json` ve `agents/reviewer.md`. `legacy` ve `extra` becerileri ile `draft-one.md` prompt'u, aşağıda açıklanan geçersiz kılma girdileriyle kapatılır.

## Alanlar

Açık bir manifest katıdır: bilinmeyen alan hatadır.

| Alan | Tür | Kural |
|---|---|---|
| `schemaVersion` | sayı | Zorunlu. Tam olarak `1`. |
| `id` | dize | Zorunlu. `<yayıncı>/<ad>`; bkz. [Eklenti kimliği](#eklenti-kimligi). |
| `name` | dize | İsteğe bağlı. |
| `description` | dize | İsteğe bağlı. |
| `publisher` | dize | İsteğe bağlı. |
| `homepage` | dize | İsteğe bağlı. Kullanıcı adı ya da parolası olmayan `https` adresi. |
| `icon` | dize | İsteğe bağlı. En çok 32 KB'lık, paket göreli tek bir png, webp ya da svg dosyası; bkz. [Simge](#simge). |
| `extensions` | dize dizisi | İsteğe bağlı. Uzantı kodu girdileri ya da onları içeren klasörler ve glob'lar. |
| `skills` | dize dizisi | İsteğe bağlı. Her biri `SKILL.md` içeren beceri klasörleri. |
| `prompts` | dize dizisi | İsteğe bağlı. Markdown prompt şablonları. |
| `themes` | dize dizisi | İsteğe bağlı. Tema JSON dosyaları. |
| `agents` | dize dizisi | İsteğe bağlı. Markdown ajan tanımları. |
| `systemPrompt` | dize | İsteğe bağlı. Sistem istemi düzenlemelerini içeren, paket göreli bir JSON dosyası; bkz. [Sistem istemi düzenlemeleri](#sistem-istemi-duzenlemeleri). |
| `engine` | dize | İsteğe bağlı. Eklenti açıkken motorun bir kez yüklediği, paket göreli tek bir modül; bkz. [Motor modülü](#motor-modulu). |
| `mcpServers` | nesne | İsteğe bağlı. Adlarıyla en çok 16 MCP sunucusu; bkz. [MCP sunucuları](#mcp-sunuculari). |
| `userContent` | nesne dizisi | İsteğe bağlı. Eklentinin kullanıcının kendi işini tuttuğu en çok 16 yer; bkz. [Kullanıcı içeriği](#kullanici-icerigi). |
| `permissions` | dize dizisi | İsteğe bağlı. Eklentinin neye ihtiyaç duyduğunu söylediği liste; bkz. [İzinler](#izinler). |
| `settings` | nesne dizisi | İsteğe bağlı. Kullanıcının Ayarlar > Eklentiler altında doldurduğu en çok 32 alan; bkz. [Ayarlar, görünümler ve bot şablonları](#ayarlar-gorunumler-ve-bot-sablonlari). |
| `ui` | nesne | İsteğe bağlı. Uygulamanın çizdiği `views` (en çok 8) ve `toolViews` (en çok 32); aynı bölüme bak. |
| `bots` | nesne dizisi | İsteğe bağlı. Ayarlar > Botlar için en çok 8 bot şablonu; aynı bölüme bak. |

`name`, `description`, `publisher` ve `homepage` boş olmayan, en çok 4096 karakterlik ve denetim karakteri içermeyen dizeler olmalıdır.

Her kaynak alanı en çok 1000 girdili bir dizidir. Girdi; boş olmayan, en çok 1024 karakterlik, denetim karakteri ve ters eğik çizgi içermeyen, başında ve sonunda boşluk bulunmayan bir dizedir.

## Eklenti kimliği

Kimlik `<yayıncı>/<ad>` biçimindedir, örneğin `acme/notes`. Her parça 1 ile 63 karakterdir: küçük harf, rakam, `.`, `_` ya da `-`; ilk karakter harf ya da rakam olur. Yayıncı parçası, yayımladığın her şey için seçtiğin addır; bütün eklentilerinde aynısını kullan. `agz` yayıncısı AGZ'nin kendi eklentilerine ayrılmıştır.

Yayıncısız, çıplak bir kimlik (`notes`; aynı karakterlerden 1 ile 128 tane) hâlâ kabul edilir: yayıncılar gelmeden önce yazılmış eklentilerin biçimidir. Yeni eklentiye yayıncı ver.

Bir makinede eklentiyi tanıtan şey kimliğidir. Kurulu iki eklenti aynı kimliği paylaşmaz: zaten kurulu bir kimlikle yapılan ikinci kurulum, hangi kaynaktan gelirse gelsin reddedilir. Kimlik, eklentinin eklenti deposundaki dosyalarını da adlandırır; `/` yerine `+` yazılır (bkz. [Depolama](./storage.md#anahtarlar)). Bu yüzden yayımladıktan sonra kimliği değiştirme: yeni kimlikli bir eklenti, eskisinin ayarları ve verisi olmayan başka bir eklentidir.

`agzPlugin` manifesti olmayan bir paket, paket adından türetilen bir kimlik alır: `@scope/name`, `scope/name` olur.

## Yol kuralları

Her girdi, `/` kullanan, pakete göre göreli bir yoldur.

- Yol paketin içinde kalmalıdır. Mutlak yol, `C:` gibi sürücü yolu ve her `..` bölümü reddedilir. Baştaki `~` sıradan bir addır, ev dizini değildir.
- Çözülen her dosya ve klasör, sembolik bağlantılar çözüldükten sonra da paketin içinde kalmalıdır. Paket dışına işaret eden sembolik bağlantı, dosya da olsa klasör de olsa hatadır.
- Girdi dosya, klasör ya da glob olabilir. Glob; `*`, `?`, `{` ya da `[` içeren girdidir. Glob eşleşmeleri sıralanır. Yolunda `.` ile başlayan bölüm bulunan glob eşleşmesi atlanır.
- Klasör özyinelemeli taranır. `.` ile başlayan adlar ve `node_modules` atlanır.
- Her bildirim en az bir kaynak dosyayla eşleşmelidir. Var olmayan yol, eşleşmeyen glob ve doğru türde dosyası olmayan klasör aynı hatayla başarısız olur (aşağıda Hatalar).

Bir alanın çözüldüğü dosyalar:

| Alan | Kabul ettiği dosyalar |
|---|---|
| `extensions` | `.ts` ve `.js` dosyaları. `index.ts` ya da `index.js` bulunan klasör o dosyaya çözülür. Kendi `package.json` manifesti olan klasör, o manifestin `extensions` alanına çözülür. Aksi halde içindeki her `.ts` ve `.js` dosyası. |
| `skills` | `SKILL.md` içeren klasör o `SKILL.md`'ye çözülür ve daha derine aranmaz. Böyle bir dosyası olmayan klasörde serbest dosyalar yok sayılır, alt klasörler aranır. |
| `prompts` | `.md` dosyaları. |
| `agents` | `.md` dosyaları. |
| `themes` | `.json` dosyaları. |

`SKILL.md` dışındaki bir Markdown dosyasına işaret eden `skills` girdisini manifest kabul eder, ama AGZ Code yalnız `SKILL.md` içeren beceri klasörlerini yükler; dosya bir işe yaramaz. Bağımsız yönergeleri beceri klasörüne ya da `prompts` içine koy.

## Geçersiz kılmalar: `!`, `+` ve `-`

`!`, `+` ya da `-` ile başlayan girdi kaynak değil, geçersiz kılmadır. Çözülen dosyalardan hangilerinin etkin olacağını değiştirir. Geçersiz kılma bildirim sayılmaz; tek başına eksik dosya hatası doğurmaz ve yalnız geçersiz kılma içeren alan hiçbir şeye çözülmez.

| Girdi | Anlamı |
|---|---|
| `!pattern` | Desenle eşleşen her çözülmüş dosyayı dışlar. Desen bir glob'dur. Dosyanın pakete göreli yolu ve dosya adıyla karşılaştırılır. Baştaki `./` yok sayılır. |
| `+path` | Çözülmüş bir dosyayı yeniden etkinleştirir. Yol tam eşleşmedir. |
| `-path` | Çözülmüş bir dosyayı devre dışı bırakır. Yol tam eşleşmedir. |

Beceri için tam yol ve desen, beceri klasörü (`skills/legacy`) ya da onun `SKILL.md`'si olabilir.

Sıra sabittir: önce dışlamalar (`!`), sonra `+` yeniden etkinleştirir, sonra `-` devre dışı bırakır. Yani `-` her zaman kazanır. Geçersiz kılma, kaynakların çözmediği bir dosyayı ekleyemez.

Yukarıdaki örnekte `skills/*` üç beceriye çözülür, `!skills/legacy` `legacy`'yi düşürür, `+skills/extra` onu etkinleştirse de `-skills/extra` `extra`'yı düşürür. `prompts` iki prompt'a çözülür; `!draft-*.md` dosya adıyla `draft-one.md`'yi düşürür.

## Sistem istemi düzenlemeleri

`systemPrompt`, ajan sistem istemini düzenleyen, paket göreli bir JSON dosyasını adlandırır. Bir blok ya da bölüm eklemek, bir bloğun metnini değiştirmek için kullanılır. Tek dosya için yukarıdaki yol kurallarını izler: paket içinde, `..` yok, mutlak yol yok ve ters eğik çizgi yok. Dosya adlandırır, glob değildir ve geçersiz kılma değildir. Bunun için `prompts` alanını kullanma; o alan prompt şablonlarını tutar.

```json
{
	"all": [
		{
			"op": "add",
			"section": "working",
			"after": "base.working.ground-claims",
			"id": "example.tools.cite-sources",
			"text": "- Name the file and line for each claim about code."
		}
	],
	"agents": {
		"lead": [
			{
				"op": "replace",
				"target": "base.working.failed-calls",
				"base": "0000000000000000",
				"text": "- Read the real state before you repeat a failed call."
			}
		]
	}
}
```

`all` her ajana uygulanır. `agents` her ajan kimliği için bir liste tutar ve o liste yalnız o ajana uygulanır. Motor her bloğu kimliği ve `base` karmasıyla (bloğun güncel motor metninin karması) Ayarlar > Ajanlar > Sistem istemi görünümünde listeler. Yukarıdaki `base` bir yer tutucudur; gerçek değeri oradan al.

Her işlemin bir `op` alanı vardır:

| `op` | Alanlar | Etki |
|---|---|---|
| `replace` | `target`, `base`, `text` | `target` bloğunun metnini değiştirir. |
| `remove` | `target`, `base` | `target` bloğunu kaldırır. |
| `add` | `section`, `after` (isteğe bağlı), `id`, `text` | Bloğu `section` bölümüne, `after` bloğundan sonra ya da bölümün sonuna ekler. |
| `add-section` | `after` (isteğe bağlı), `id`, `heading`, `blocks` | `heading` başlıklı ve `{id, text}` bloklu bir bölümü, `after` bölümünden sonra ya da sona ekler. |

Kurallar:

- Blok kimliği `<belge>.<bölüm>.<slug>` biçimindedir, örneğin `base.working.ground-claims`.
- `base`, bloğun güncel metninin karmasına eşit olmalıdır. Motor `replace` ya da `remove` işlemini yalnız o zaman uygular. Motor metni değişirse işlem `stale` olur: uygulanmaz ve Ayarlar'da gösterilir.
- Eklenti, `identity`, `role`, `instructions-and-trust` ve `approval-modes` kapalı bölümlerinde (bot onay sözleşmesi) yalnız ekleme yapabilir. Orada `replace` ya da `remove` hatadır; motor bunu `locked` olarak gösterir.
- Yeni kimlikler (`add` ve `add-section`'ın `id`'si, `add-section`'ın her bloğunun `id`'si) kendi listesinde (`all` ya da bir ajanın listesi) tekil olmalıdır. İstemde zaten bulunan bir yeni kimlik çakışmadır ve o işlem uygulanmaz. Her yeni kimliği eklenti kimliğinizle başlatın, örneğin `example.tools.cite-sources`; böylece iki eklenti aynı kimliği almaz.
- Bir bloğa (`add`) ya da bölüme (`add-section`) işaret etmeyen `after`, parçayı sona koyar: `add` için bölümünün, `add-section` için istemin sonuna. Ayarlar onu eklenmiş olarak işaretler.
- Bir liste bir hedefi bir kez değiştirebilir. Aynı listede aynı hedefe ikinci `replace` ya da `remove` hatadır ve motor dosyanın tamamını reddeder. Aynı hedef `all`'da ve bir ajanın listesinde olabilir: o ajan için kendi işlemi uygulanır, `all` işlemi geçersiz kılınır.
- Sınırlar: liste başına 200 işlem, metin başına 20.000 karakter, `add-section` başına 100 blok, kimlik ve başlık başına 200 karakter, ajan kimliği başına 512 karakter ve tüm dosyada 32.768 karakter metin (her `text`, başlık ve blok metni; `all` ile her ajanın listesi birlikte). Bir sınırı aşan dosya reddedilir. Her derinlikte bilinmeyen alan hatadır; yazımı denetle (`agents`, `agent` değil).
- Öncelik: Ayarlar'daki kullanıcı düzenlemesi, aynı hedefteki eklenti düzenlemesini yener; ajanın kendi listesi `all`'u yener. İki eklenti aynı hedefi değiştirirse hiçbiri uygulanmaz ve Ayarlar çakışmayı gösterir.
- Kullanıcı, eklenti kurulurken ve kurulumu onaylarken dosyanın işlemlerini görür; Ayarlar > Eklentiler'de de gösterilir.

`manifest_check` ile motor dosyayı tek bir kural kümesiyle okur: biçim ve bilinmeyen alanlar, sınırlar, bir listede yinelenen hedef ve yeni kimlik, dosyanın toplam metni. Motor kapalı bölümdeki `replace` ya da `remove` işlemini `locked` işaretler ve dosyanın kalanını uygular; `manifest_check` onu hata olarak bildirir, bu yüzden yayımlamadan önce düzelt. `manifest_check` ayrıca yol kurallarını denetler. Motorun bloklarını bilmez; bu yüzden hedefin varlığını, `base`'in güncelliğini ve yeni kimliğin boş olduğunu denetleyemez. Motor bunları işlem durumu olarak bildirir ve Ayarlar gösterir: `not-applicable`, `stale`, `conflict` ve `anchor-missing`.

`systemPrompt` alanı için `manifest_check`'in verdiği nedenler:

| Neden | Sebep |
|---|---|
| `agzPlugin.systemPrompt must be one package-relative file path (at most 1024 characters, without backslashes or control characters)` | Değer dize değil, 1024 karakteri aşıyor, ters eğik çizgi, denetim karakteri ya da çevresinde boşluk içeriyor ya da paketten çıkıyor (mutlak yol, sürücü yolu ya da `..` bölümü). |
| `agzPlugin.systemPrompt file is missing or unreadable: <yol>` | Yolda dosya yok ya da yol çözülemiyor. |
| `agzPlugin.systemPrompt path must stay inside the package (after resolving symlinks): <yol>` | Sembolik bağlantı paket dışına çıkıyor. |
| `agzPlugin.systemPrompt must be a file: <yol>` | Yol bir klasör. |
| `agzPlugin.systemPrompt file could not be read: <yol>` | Dosya var ama okunamıyor. |
| `agzPlugin.systemPrompt file is not valid JSON: <yol>` | Dosya ayrıştırılamıyor. |

Dosyanın içindeki nedenler, her sorun için bir tane olmak üzere `<yol>: ` ile başlar. `<konum>`, işlemin listedeki yeridir: `all[<n>]` ya da `agents.<kimlik>[<n>]`:

| Neden | Sebep |
|---|---|
| `must be a JSON object with all and agents` | Üst düzey nesne değil. |
| `unknown field <ad>` | `all` ve `agents` dışında bir anahtar. |
| `all must be an array of at most 200 ops` | Nedeninde adı geçen `all` ya da `agents.<kimlik>` dizi değil ya da çok uzun. |
| `agents must be an object of op arrays` | `agents` nesne değil. |
| `agent id "<kimlik>" must be 1 to 512 characters without control characters` | Hatalı ajan anahtarı. |
| `<konum>.op must be replace, remove, add or add-section` | Bilinmeyen işlem türü. |
| `<konum> has an unknown field <ad>` | İşlem türünün almadığı bir alan. |
| `<konum>.<alan> must be ...` | Eksik ya da biçimi bozuk alan: kimlik, 16 karakterlik karma, 1 ile 20.000 karakter arası metin ya da 1 ile 200 karakter arası başlık. |
| `<konum>.blocks must be an array of at most 100 objects`, `<konum>.blocks[<i>].id` ya da `.text` | Hatalı `add-section` bloğu. |
| `<konum> replaces <kimlik>, which is locked: ...` ya da `removes <kimlik>, which is locked: ...` | Kapalı bölümde `replace` ya da `remove`. |
| `new id <kimlik> is declared twice in all` ya da `in agents.<kimlik>` | Aynı listedeki iki işlemin bildirdiği kimlik. |
| `block <kimlik> is edited by two ops in all` ya da `in agents.<kimlik>` | Aynı listedeki iki `replace` ya da `remove` işlemi aynı hedefi adlandırıyor. |
| `the file writes <n> characters of text in all its lists; at most 32768 are allowed` | Tüm işlemlerin metni birlikte dosya sınırını aşıyor. |

Dosyayı reddetmeyen uyarılar: `<yol>: new id <kimlik> is declared in all and in agents.<kimlik>; for <ajan> the second one is a conflict and does not apply` ve `<yol>: the file has no ops, so the plugin changes no prompt`.

## Ayarlar, görünümler ve bot şablonları

Üç alan, kullanıcının gördüğü ve doldurduğu şeyleri ekler. Hiçbiri uygulamada eklenti kodu çalıştırmaz: uygulama, motorun doğruladığı veriyi çizer. Kullanıcıya görünen her metin `{ "en": ..., "tr": ... }` biçimindedir (dil başına en çok 200 karakter; bot açıklaması 1000) ve iki dil de zorunludur.

`settings` alanları bildirir. Bir alanın `key` değeri (bir harf, sonra harf, rakam ya da `_`; en çok 64 karakter; benzersiz), `type` değeri ve `label` metni vardır; `description` de olabilir. Türler: `string` (`default`, `maxLength`), `number` (`default`, `min`, `max`, `integer`), `boolean` (`default`), `enum` (`{ value, label }` biçiminde `options`, `default`) ve `secret` (varsayılanı yok; uygulama onu asla geri okumaz, yalnız son dört karakterini gösterir). Değerler eklenti deposunda `config/<anahtar>.json` dosyasında, gizli değerler deponun `secrets.json` dosyasında saklanır (bkz. [Depolama](./storage.md#ayarlar-ve-gizli-degerler)); uzantı ikisini de `getPluginSettings()` ile okur (bkz. [uzantı API'si](./extension-api.md#eklenti-ayarlari-ve-gorunumler)).

```json
"settings": [
	{ "key": "endpoint", "type": "string", "label": { "en": "Endpoint", "tr": "Adres" }, "default": "https://api.example.com" },
	{ "key": "apiToken", "type": "secret", "label": { "en": "API token", "tr": "API anahtarı" } },
	{ "key": "testCommand", "type": "string", "scope": "project", "label": { "en": "Test command", "tr": "Test komutu" }, "default": "npm test" }
]
```

`"scope": "project"` taşıyan alan proje kapsamlıdır: güvenilen bir proje bu alanın kendi değerini `<proje>/.agz-code/plugin-config/<anahtar>.json` dosyasında tutabilir ve o projenin oturumlarında bu değer kullanıcının değerinin önüne geçer. `getPluginSettings()` oturumun projesi için geçerli değeri döndürür; uzantı onu öteki alanlar gibi okur. `scope` yalnız `"project"` değerini alır ve `secret` alanında kullanılamaz. Bunu depodan depoya değişen şeyler için kullan: bir komut, bir yol, bir adlandırma kuralı.

`ui.views`, uzantının `registerView` ile kaydettiği görünümleri bildirir. Bir görünümün `id` değeri (1 ile 64 küçük harf, rakam, `.`, `_` ya da `-`; benzersiz), `title` metni, `icon` değeri (sabit bir listeden lucide adı; değer yanlışsa `manifest_check` listeyi söyler) ve `place` değeri vardır: `panel` (oturumun sağ panelinde bir görünüm), `sidebar` (projenin uygulama kenar çubuğunda bir sayfa), `composer` (oturumun mesaj kutusunun üstünde küçük bir çubuk; uzantı onu `panel`de olduğu gibi `registerView` ile kaydeder ve gösterecek bir şeyi olmayan görünüm hiçbir şey çizmez) ya da `statusbar` (uygulamanın durum çubuğunda bir öğe ve ondan açılan panel). `statusbar` görünümü bir oturuma değil motora aittir: onu [motor modülü](#motor-modulu) kaydeder, bu yüzden manifestte `engine` bulunmalıdır; `refreshSeconds` (1 ile 3600 arası tam sayı) alabilir: uygulamanın öğeyi gösterdiği sürece görünümü kaç saniyede bir yeniden isteyeceği. `ui.toolViews`, eklentinin kendi araçlarından birinin kartını süsler: `tool` (araç adı; benzersiz) ve isteğe bağlı `title`, `subject`, `facts` (en çok 8) ile `sections` (en çok 8). Her değer çağrıdan `from` (`args` ya da `result`) ve `key` (en çok 8 addan oluşan noktalı yol) ile okunur; bölümde ayrıca `as` bulunur (`text`, `json`, `kv` ya da `list`). Kart yine de tüm bağımsız değişkenleri ve sonucu gösterir.

```json
"ui": {
	"views": [{ "id": "status", "title": { "en": "Status", "tr": "Durum" }, "icon": "gauge", "place": "panel" }],
	"toolViews": [{
		"tool": "notes_helper_echo",
		"title": { "en": "Echo", "tr": "Yankı" },
		"subject": { "from": "args", "key": "text" },
		"facts": [{ "label": { "en": "Length", "tr": "Uzunluk" }, "from": "result", "key": "length" }]
	}]
}
```

`composer` görünümü `panel` görünümü gibi, `"place": "composer"` ile bildirilir; uzantı onu `registerView` ile kaydeder. Manifest eğik çizgi komutu bildirmez: komutları uzantı `registerCommand` ile kaydeder ve bir ajanın komutu düğme olarak sunabilmesini sağlayan, oradaki `button: true` değerdir ([uzantı API'si](./extension-api.md#komutlar)).

`bots` bot şablonlarını bildirir. Şablon bot değildir: Ayarlar > Botlar onu listeler, kullanıcı onunla önceden doldurulmuş bir form açar ve botu oluşturup oluşturmayacağına kendisi karar verir. Şablonun `id` değeri (görünüm kimliği gibi), `name` değeri (botun adı: bir harf, sonra küçük harf, rakam ya da `-`, 2 ile 48 karakter; benzersiz), `description` metni ve `brief` dosyası vardır: botun `BOT.md` metnini içeren, paket göreli bir dosya (`systemPrompt` ile aynı yol kuralları; en çok 20.000 karakter, boş olmayan). `suggestedPermissions` (en çok 12.000 karakterlik metin) ve `suggestedApproval` (`report` ya da `final`) önerebilir; form öneriyi gösterir ve yalnız kullanıcı kabul ederse uygular.

```json
"bots": [{
	"id": "triage",
	"name": "triage-bot",
	"description": { "en": "Sorts new issues.", "tr": "Yeni sorunları ayırır." },
	"brief": "bots/triage.md",
	"suggestedApproval": "report"
}]
```

`manifest_check` üç alanı da yükleyicinin kurallarıyla denetler; ayrıca her `brief` dosyasının var olduğunu, dosya olduğunu ve sembolik bağlantılar çözüldükten sonra paketin içinde kaldığını denetler. Bundan fazlasını okumaz: uzantının bildirilen her görünümü kaydettiğini ya da `toolViews` içinde adı geçen aracın var olduğunu denetlemez.

## Motor modülü

`engine`, kaç oturum açık olursa olsun, eklenti açıkken motorun bir kez yüklediği paket göreli tek bir modülü (`.ts`, `.mts`, `.js` ya da `.mjs`) gösterir. Uzantı kodu (`extensions`) her oturumda yeniden çalışır; motor modülü ise eklentinin bütün oturumlarının paylaştığı şeylerin yeridir: bir arka plan işi, bir zamanlayıcı, bir önbellek, bir bağlantı.

```json
"engine": "engine/index.ts"
```

Modülün varsayılan dışa aktarımı bir fabrikadır. Motor API'sini alır ve başlattığını durduran işlevi döndürebilir:

```ts
import type { PluginEngineFactory } from "@agz-yazilim/plugin-sdk/unstable";

const start: PluginEngineFactory = (engine) => {
	const timer = setInterval(() => engine.log("still running"), 60_000);
	return () => clearInterval(timer);
};

export default start;
```

| Üye | Nedir |
|---|---|
| `engine.pluginId` | Eklentinin kimliği. |
| `engine.paths` | Eklentinin `data`, `cache`, `logs` ve `package` klasörleri (bkz. [Depolama](./storage.md#eklentinin-kendi-klasorleri)). |
| `engine.signal` | Modülün durması gerektiğinde iptal olan bir `AbortSignal`. Modülün başlattığı şeylere ver. |
| `engine.getSettings()` | Eklentinin şu anki ayarları: varsayılanlar uygulanmış kayıtlı değerler, gizli değerler dahil. |
| `engine.onSettingsChange(dinleyici)` | Kullanıcı ayarları kaydettikten sonra `dinleyici`yi yeni ayarlarla çağırır. Dinleyiciyi kaldıran işlevi döndürür. |
| `engine.log(ileti)` | Motorun günlüğüne, eklentinin kimliğiyle işaretli bir satır yazar. |
| `engine.host` | Modülün çalıştığı motor: `version` ve `stats()`; bellekteki oturumlar, bağlı istemciler, başlangıçtan beri onlara gönderilen mesaj ve baytlar, ajanların çalışan arka plan komutları. |
| `engine.registerView(kimlik, görünüm)` | Bir durum çubuğu görünümü kaydeder (aşağıda). |
| `engine.invalidateView(kimlik)` | Kayıtlı bir görünümün değiştiğini söyler: uygulama onu yeniden çizer. |
| `engine.notify({ title, body? })` | Kullanıcıya bildirim gönderir (aşağıda). `notifications` iznini ister. |
| `engine.quotas` | Motorun bildiği sağlayıcı kotaları: `list()` ve `onChange(dinleyici)`. `usage` iznini ister. |
| `engine.handle(yöntem, işleyici)` | Eklenti kanalının bir yöntemine gelen çağrıları yanıtlar (aşağıda). İşleyiciyi kaldıran bir işlev döndürür. |
| `engine.publish(konu, veri)` | Bir konuya abone istemcilere veri gönderir. |
| `engine.onSubscribers(konu, dinleyici)` | Dinleyiciyi bir konuya abone istemci sayısıyla çağırır: hemen ve sayı her değiştiğinde. |

### Model sağlayıcıları

Kullanıcı kapsamındaki bir motor modülü, `providers` izniyle `engine.providers.register({ id, name, baseUrl, models, secretSetting })` çağırabilir. Bu kararsız API, model seçicisine OpenAI uyumlu sohbet modelleri ekler. Adres HTTPS kullanmalı; yalnızca yerel denemede geri döngü adresine düz HTTP kabul edilir. Adres kullanıcı bilgisi, sorgu veya parça içeremez. `secretSetting`, eklentinin kendi manifestinde tanımladığı bir `secret` alanının adıdır; anahtarı kayda, manifeste veya günlüğe koymayın. Her model `id`, `name`, `contextWindow` ve `maxTokens` bildirir. Bir modül en çok 16 sağlayıcı, sağlayıcı başına en çok 32 model kaydedebilir.

Başlangıçta yapılan kayıt yalnızca modül başarıyla başlarsa geçerli olur. Dönen işlev o kaydı kaldırır; eklenti kapatıldığında veya durduğunda da kayıt kaldırılır. Motor, mevcut sağlayıcının üzerine yazmaz; katkıya kendi kimliğini verir. Konuşma, kullanıcı bu modellerden birini seçip kullandığında kayıtlı adrese gider.

### Durum çubuğu görünümleri

`place: "statusbar"` ile bildirilen görünüm, uygulamanın durum çubuğunda bir öğe ve ondan açılan bir paneldir. Durum çubuğu olmayan telefonda öğeler Ayarlar'ın en üstündedir.

```json
"engine": "engine/index.ts",
"ui": { "views": [{ "id": "queue", "title": { "en": "Queue", "tr": "Kuyruk" }, "icon": "list-checks", "place": "statusbar", "refreshSeconds": 30 }] }
```

```ts
engine.registerView("queue", {
	render: (ctx) => ({
		status: { items: [{ label: ctx.locale === "tr" ? "Kuyruk" : "Queue", value: String(waiting.length), tone: waiting.length > 10 ? "warning" : "neutral" }] },
		sections: ctx.statusOnly ? [] : [{ blocks: [{ kind: "table", columns: [{ key: "job", label: "Job" }, { key: "age", label: "Age", align: "end" }], rows: waiting }] }],
	}),
});
```

- `status.items` çubuktaki göstergelerdir, en çok 4 tane: en çok 40 karakterlik bir `value`, isteğe bağlı bir `label`, değeri renklendiren bir `tone` ve o yüzdeye kadar dolu küçük bir halka çizen `ring` (0 ile 100 arası). Hiç gösterge yoksa uygulama öğeyi göstermez; görünüm şu an söyleyecek bir şeyi olmadığını böyle bildirir. `status` verilmezse öğe, görünümün simgesini ve başlığını gösterir.
- `sections` paneldir. Uygulama görünümün tamamını yalnız panel açıkken ister; öbür durumda `ctx.statusOnly` doğrudur ve bölümler döndürülmeyebilir. Böylece birkaç saniyede bir sorulan görünüm ucuz kalır.
- Uygulama, penceresi göründüğü sürece her `refreshSeconds` saniyede, `engine.invalidateView(kimlik)` çağrısından sonra ve bir eylemden sonra yeniden sorar. Pencere gizliyken sormaz. Bu yüzden görünüm için bir şey ölçen modül, yalnız sorulduğu sürece ölçüp son istekten kısa süre sonra durabilir.
- `ctx.cwd` kullanıcının ev dizinidir: motor görünümünün oturumu da projesi de yoktur.
- `registerView`, manifestin `place: "statusbar"` ile bildirmediği bir kimlikte ve ikinci kayıtta hata fırlatır. Bir oturumun uzantısı böyle bir görünümü kaydedemez; `panel` ya da `sidebar` görünümündeki `status` reddedilir.
- Modül durunca görünüm de gider.

### Bildirimler ve kotalar

`engine.notify({ title, body })`, kullanıcı bakmıyorken olan bir şeyi ona söyler: uygulama bunu bildirim listesine ekler, kullanıcı izin veriyorsa masaüstü bildirimi gösterir; telefon bildirimleri açıksa telefona da gider. Her metin bir dize ya da `{ en, tr }` olur; başlık en çok 120, gövde en çok 500 karakterdir. Uygulama her bildirimde eklentinin adını yazar; metnin ayrıca yazması gerekmez. Kullanıcıya dakikada en çok 6 bildirim ulaşır; fazlası atılır ve günlüğe yazılır. Yalnız kullanıcının eklentiden izlemesini istediği şeyi, bir kez bildirin ve daha önce söylediğinizi eklentinin veri klasöründe tutun: bildirim bir günlük değildir.

`engine.quotas.list()`, motorun yanıt aldığı her sağlayıcının son kota görüntüsünü döndürür: `provider`, `subscription`, `status`, `plan?`, `limitReached?`, `observedAt?` ve `windows` (`id`, `usedPercent`, epoch milisaniye olarak `resetAt?`, `windowSeconds`). `engine.quotas.onChange(dinleyici)`, dinleyiciyi bir sağlayıcının yeni görüntüsüyle çağırır. Kotaları sağlayıcılardan motor okur ve yeniden başlayınca unutur; eklenti onları okur, değiştiremez.

İkisi de `agzPlugin.permissions` içinde kendi iznini ister (`notifications`, `usage`): izin yoksa çağrı hata fırlatır; böylece kullanıcı eklentinin ne yaptığını çalışmadan önce görmüş olur.

### Otomasyon olay kaynakları

`automations` izniyle `engine.automations?.registerSource({ id, title, subjectLabel, subjects })`, çalışan eklenti ve kaynağa bağlı bir olay gönderme işlevi döndürür. Uygulama kaynakları Otomasyonlar’da listeler. Bir konuyu ve eylemi kullanıcı seçer; eklenti hedef veya istem veremez. `subjects()` beklemeden ve G/Ç yapmadan en çok 64 izinli konu döndürür. Erişim kaldırılınca konu listeden çıkar; güven sınırı değişince (örneğin bağlı hesap değişince) konu kimliği de değişir.

Olay biçimi `{ eventId, subjectId, timestamp, subjectRef?, reference?, hasMedia? }`; zaman Unix milisaniyesidir. Kimlik alanlarına mesaj metni, talimat veya gizli bilgi koymayın. `accepted` bellekte sıraya alındığını söyler; `duplicate`, `inactive` ve `busy` teslim anlamına gelmez. Kuyruk sınırlıdır. Otomatik tekrar veya yeniden başlatma sonrası geçmişten teslim yoktur; bekleme, sessiz saat ve saatlik sınır kuralları geçerlidir. İstemciye veri veren `engine.publish` kanalı otomasyon tetiklemez.

### Eklenti kanalı

Kanal, eklentinin kendi verisini motor modülü ile motorun bir istemcisi arasında taşır. İstemci bir yöntemi adıyla çağırıp sonucunu alır ya da bir konuya abone olup modülün o konuda yayımladıklarını alır.

```ts
export default function start(engine: PluginEngineAPI) {
	let timer: ReturnType<typeof setInterval> | undefined;
	engine.handle("issues.list", async (params, ctx) => {
		const { state } = params as { state: "open" | "closed" };
		return { issues: await listIssues(state, ctx.signal) };
	});
	// Poll only while a client watches the topic.
	engine.onSubscribers("issues.changed", (count) => {
		if (count > 0 && timer === undefined) timer = setInterval(async () => engine.publish("issues.changed", { open: await countOpen() }), 60_000);
		if (count === 0 && timer !== undefined) {
			clearInterval(timer);
			timer = undefined;
		}
	});
	return () => clearInterval(timer);
}
```

- Yöntem ya da konu adı bir harfle başlar; harf, rakam, `.`, `_` ya da `-` ile sürer ve en çok 64 karakterdir. Bir yöntemin tek işleyicisi olur; ikincisinde `handle` hata fırlatır.
- Parametreler, sonuç ve yayımlanan veri en çok 262144 karakterlik JSON'dur. İstemciye ulaşan, JSON'un taşıdığıdır: `Date` metin olarak gelir, `undefined` alanlar düşer, hiçbir şey döndürmeyen işleyici `null` yanıtlar. JSON olmayan ya da fazla büyük sonuç çağrıyı başarısız kılar; `publish` böyle veride hata fırlatır.
- İşleyicinin 30 saniyesi vardır; süre dolunca ya da modül durunca `ctx.signal` iptal olur. Fırlatılan hata çağırana hatanın iletisiyle ulaşır; bu yüzden iletiyi kullanıcının okuyabileceği biçimde yazın ve içine gizli değer koymayın.
- Abone olan istemci yokken `publish` hiçbir şey göndermez. Olaylar saklanmaz: sonradan abone olan istemci o andan sonra yayımlananları alır; bu yüzden güncel durumu döndüren bir yöntem de sunun.
- Abonelik çalışan modülü değil, eklentiyi ve konuyu adlandırır: modül yeniden başlarken (güncelleme, yeniden yükleme) yerinde kalır ve yeni modül sayıyı `onSubscribers` ile duyar.
- Motora geçerli bir jetonla bağlı her istemci yöntemleri çağırabilir: uygulamanın pencereleri, telefon. Parametreleri dışarıdan gelen girdi olarak denetleyin ve kullanıcıya sorulmamış bir işi yapan yöntem sunmayın.
- Tel üzerinde bunlar `plugins.call`, `plugins.subscribe` ve `plugins.unsubscribe` istekleri ile `plugins.event` olayıdır (yetenek `plugin_channel`). Bugün uygulamada eklentinin kendi kodunun bunları çağırdığı bir yer yoktur; durum çubuğu öğesi, panel ve kenar çubuğu sayfası görünüm verisinden çizilir. Kanal, eklentinin arayüz modülünün kullanacağı yoldur.

Kurallar:

- Modül, motor açılırken ve eklenti kurulduğunda ya da açıldığında başlar. Eklenti kapatıldığında, güncellendiğinde ya da kaldırıldığında ve motor durduğunda durur: önce `engine.signal` iptal olur, sonra döndürülen işlev çağrılır ve motor onu en çok 10 saniye bekler. Güncellemeden sonra yeni sürümün modülü başlar.
- Yalnız kullanıcı kapsamındaki eklentinin motor modülü olur. Proje eklentisinin `engine` alanı yüklenmez: motor tek bir projeye ait değildir.
- Modülün içe aktarılması için 30 saniyesi, fabrikasının dönmesi için de ayrıca 30 saniyesi vardır. Yüklenemeyen ya da fabrikası hata fırlatan veya bu sürede dönmeyen modül motorun günlüğüne `did not start` olarak kaydedilir ve dışarıda bırakılır; eklentinin oturumları yine yüklenir. O anda `engine.signal` iptal olur; fabrikanın süre dolduktan sonra döndürdüğü durdurma işlevi hemen çağrılır. Motor modülleri birbiri ardına başlatır; bu yüzden çabuk dön: yavaş işi (ilk ağ isteği, uzun bir tarama) fabrikada beklemek yerine arka planda yap.
- Modül ile uzantı kodu değişken paylaşmaz: ayrı yüklenirler. Durumu eklentinin `data` klasöründeki dosyalarla ya da ayarlarla paylaş.
- Bu türler SDK'nın `unstable` giriş noktasından gelir: yenidirler ve küçük bir sürümde hâlâ değişebilirler. Onları `import type` ile içe aktar.

Dosya, `systemPrompt` gibi, tek dosya için geçerli yol kurallarına uyar.

## MCP sunucuları

`mcpServers`, eklentinin getirdiği MCP sunucularını adlarıyla bildirir. Motor onları, eklentiyi yükleyen her oturumda, hiçbir uzantı kodu çalışmadan önce kaydeder; yani uzantı kodu olmayan bir eklenti de sunucu getirebilir.

```json
"mcpServers": {
	"word-count": {
		"command": "node",
		"args": ["${pluginDir}/server/index.mjs"],
		"description": "Count the words and lines of a text"
	}
}
```

- Ad; harf, rakam, `_` ve `-` içerir. En çok 16 sunucu olabilir.
- Yapılandırma, `registerMcpServer`'ın aldığı alanları taşır (bkz. [eklenti kodu API'si](./extension-api.md#mcp-sunuculari)): stdio sunucusunda `command`, `args`, `env` ve `cwd`; HTTP sunucusunda `url` ve `headers`.
- Stdio sunucusunun `command`, `args`, `cwd` ve `env` değerlerinde `${pluginDir}`, kurulu paket klasörünün yerine geçer. `cwd` varsayılan olarak o klasördür. Paketin dosyalarını hep `${pluginDir}` ile an: klasör her güncellemede değişir.
- Motor bildirilen sunucuları eklenti kodu çalıştırmadan listeler; bu yüzden sunucu, eklenti kurulur kurulmaz Ayarlar > Ajanlar > Araçlar'da görünür. Bir ajan onun araçlarını yine yalnız kullanıcı sunucuyu o ajana verdikten sonra çağırır.
- Başka bir eklentinin zaten bildirdiği ad kaydedilmez ve sonraki eklenti şu hatayı alır: `MCP server "<ad>" of plugin <kimlik> was not registered: another plugin already declares that name`. Bildirilen bir ad koddan da yeniden kaydedilemez: o adla `registerMcpServer` hata fırlatır.

Yapılandırması sabit olan sunucuyu burada bildir. Yapılandırma bir ayara ya da oturuma bağlıysa sunucuyu uzantı kodundan kaydet.

## Kullanıcı içeriği

`userContent`, eklentinin kendi klasörleri dışında kullanıcıya ait olanı (örneğin tasarımları ya da belgeleri) tuttuğu yerleri listeler. Hiçbir kaldırma bunları silmez; uygulama listeyi gösterir, böylece kullanıcı o işin nerede durduğunu bilir. Eklentinin kendi `data`, `cache` ya da `logs` klasörünün içindeki bir yer kullanıcı içeriği değildir: o klasörler, eklenti verisiyle birlikte kaldırıldığında gider.

```json
"userContent": [
	{ "path": "project:designs", "description": { "en": "The designs you made", "tr": "Yaptığın tasarımlar" } }
]
```

`path` ya oturumun proje klasörü altındaki `project:<göreli yol>` ya da AGZ Code ev klasörü `~/.agz-code/` altındaki `home:<göreli yol>` biçimindedir. Göreli yol, tek dosya yolu kurallarına uyar: `..` yok, ters eğik çizgi yok, denetim karakteri yok. Bir yol yalnız bir kez geçer. `description` iki dilde metindir, her biri en çok 300 karakter. En çok 16 girdi olabilir.

Alan bir beyandır: klasörü oluşturmaz ve erişim vermez. Eklentinin yeniden üretebileceği ya da kendisi için gereken şeylerin yeri kendi klasörleridir.

## İzinler

`permissions`, eklentinin neye ihtiyaç duyduğunu söyler. Kullanıcı listeyi eklenti kurulmadan önce görür.

```json
"permissions": ["network", "secrets"]
```

| İzin | Eklenti |
|---|---|
| `network` | makinenin dışındaki sunucularla konuşur |
| `filesystem` | kendi klasörleri ve oturumun projesi dışındaki dosyaları okur ya da yazar |
| `process` | program başlatır |
| `native` | kendi ikili dosyalarını getirir ve çalıştırır |
| `ui` | uygulamanın penceresine kendi kodunu ekler |
| `secrets` | kimlik bilgisi saklar |
| `sessions` | kendisini yükleyen oturumun dışındaki oturumları okur ya da yönetir |
| `memory` | genel hafızayı okur ya da yazar |
| `git` | projenin deposunu değiştirir |
| `notifications` | kullanıcıya bildirim gönderir |
| `usage` | sağlayıcı kotalarını ve kullanım sayılarını okur |
| `automations` | kullanıcının kural ve hedef seçtiği otomasyonlara olay sağlar |
| `agents` | kendi arka plan ajanlarını başlatır ve yardımcı kaydeder |
| `designer` | güvenilen oturum projesinin tasarım önizlemesini gösterir |
| `providers` | model ekler; kullanıldığında konuşma belirtilen sağlayıcıya gider |

Listede tekrar olmaz ve yalnız bu adlar bulunur. Ev sahibi `engine.notify`, `engine.quotas` ve `engine.automations.registerSource` gibi çağrılarda izni denetler. Bu denetimlerin dışında liste kullanıcıya verilen bir beyandır, kum havuzu değildir: eklenti kodu motorun sürecinde çalışır ve motor onu listeyle sınırlamaz (bkz. [Güvenlik](./security.md#izinler)). Eklentinin gerçekten yaptığını bildir. Bir şeyi dışarıda bırakan liste, eklentiyi kuranları yanıltır.

Motor, kullanıcının onayladığı listeyi kaydeder. Kurulu sürümde olmayan bir izin bildiren güncelleme, eklenen izinler için kullanıcının onayını bekler.

## Simge

`icon`, uygulamanın eklenti için çizdiği, pakete göreli tek bir görsel dosyasını adlandırır. Kurallar:

- Uzantı `.png`, `.webp` ya da `.svg` olur. Yol, `systemPrompt` gibi tek dosya kurallarına uyar: paket içinde, `..` yok, mutlak yol yok, ters eğik çizgi yok.
- Dosya var olmalı, dosya olmalı ve sembolik bağlantılar çözüldükten sonra paketin içinde kalmalıdır.
- En çok 32 KB (32.768 bayt) olur ve baytları uzantısının adlandırdığı türde olmalıdır: PNG ya da WebP imzası ya da `.svg` için kök öğesi `<svg` olan metin (öncesinde XML bildirimi, doctype ve yorumlar bulunabilir).
- Uygulama onu yalnız görsel olarak çizer; bu yüzden bir SVG uygulama temasını izleyemez ve betik çalıştıramaz: sabit renkli bir kutucuk çiz. Simgesi olmayan eklenti, adının baş harflerinden oluşan bir monogram alır.

```json
"icon": "assets/icon.svg"
```

Alan bir şema değişikliği değildir: `schemaVersion` `1` kalır. Hatalı bir simge dosyası eklentinin satırında manifest hatası olarak görünür; eklentinin kaynakları yine yüklenir. Dosya kullanılabilirse `manifest_check` yolu `icon` olarak döndürür.

## SDK uyumu: `engines`

Konak, uzantı koduna `@agz-yazilim/plugin-sdk` paketini sağlar ve SDK'nın bir sürümü vardır (bkz. [uzantı API'si](./extension-api.md)). Eklenti hangi sürümlerle çalıştığını `package.json` dosyasının `engines` alanında, `agz-plugin-sdk` anahtarı altında, semver aralığı olarak bildirir:

```json
"engines": { "agz-plugin-sdk": "^1" }
```

Bu, `package.json` üst düzeyindeki bir npm alanıdır, `agzPlugin` alanı değildir: npm tanımadığı `engines` anahtarlarını yok sayar ve `agzPlugin` kapalı bir liste olarak kalır. Anahtar yoksa aralık `^1` olur.

Yükleyici, manifesti okurken aralığı çalışan AGZ Code'un SDK sürümüyle karşılaştırır. Semver aralığı olmayan bir değer ya da çalışan SDK'nın karşılamadığı bir aralık manifest hatasıdır: eklenti yüklenmez ve satırı nedeni gösterir. Aralık söz dizimi npm'inkidir (`^1`, `~1.2`, `>=1.1 <2`, `1.x`, `1.0.0 - 1.9.9`, `^1 || ^2`). `manifest_check` aynı kuralı kendi sürümünün SDK sürümüyle uygular; eklenti kitinin `agz plugin check` komutu aralığı ayrıca eklenti klasöründe kurulu SDK ile karşılaştırır.

## Açık ve geleneksel manifest

Açık manifest bağlayıcıdır. Atlanan ya da boş dizi olan kaynak alanı, o türden kaynak bildirmez. Yalnız beceri içeren eklenti, başıboş bir `index.ts` çalıştırmaz ve bildirilmemiş `extensions` klasörünü taramaz. Bilinmeyen alan, yanlış tür ya da desteklenmeyen `schemaVersion` hatadır; yükleyici klasör keşfine ya da başka manifeste geri dönmez. Eski `package.json` `pi` alanı okunmaz. `schemaVersion` ve `id` ekleyip listelerini `agzPlugin` içine taşı.

`agzPlugin` anahtarı olmayan paket, paket kökündeki kaynak türü adlı klasörleri kullanır: `extensions`, `skills`, `prompts`, `themes` ve `agents`. Klasörün içindeki her şey alınır. Yayımlayacağın pakette yine de manifest bulundur; çünkü `manifest_check` ve bu belgeler yalnız manifesti ele alır.

## Ajan tanımları

`agents` içinde listelenen dosya bir alt ajan profilidir. Frontmatter bloklu Markdown'dır:

```md
---
name: reviewer
description: Reviews changes
base: worker
---
Review carefully.
```

| Alan | Kural |
|---|---|
| `name` | Zorunlu. Dosya adının `.md`'siz haline eşit olmalıdır. `^[a-z][a-z0-9-]{1,47}$` desenine uyar. Yerleşik bir ajanın kimliği olamaz. |
| `description` | Zorunlu. En çok 160 karakter. |
| `base` | Zorunlu. `explorer`, `researcher`, `worker`, `verifier`, `analyst` değerlerinden biri. |
| `tools` | İsteğe bağlı liste. Temel ajanın araçlarının alt kümesi olmalıdır. |
| `steps` | İsteğe bağlı, 1 ile 200 arası tam sayı. |
| `model`, `variant` | İsteğe bağlı, boş olmayan dizeler. |

Frontmatter'dan sonraki metin, temel ajanın prompt'una Specialization başlığı altında eklenir. Başka her alan bir sorundur ve dosya kullanılmaz. Paket ajanının kimliği genel bir ajanla, bir proje ajanıyla ya da önceki bir paket ajanıyla aynıysa atlanır ve çakışma bildirilir. Proje kapsamlı eklentinin paket ajanları yalnız güvenilen projede yüklenir.

## Hatalar

Yükleyici şu iletileri fırlatır. İki noktadan sonrası nedendir. `manifest_check` yalnız nedeni döndürür, her sorun için bir tane, ve ilkinden sonra devam eder.

Manifest hataları `Invalid AGZ-Code plugin manifest in <package.json yolu>: ` ile başlar. Nedenler:

| Neden | Sebep |
|---|---|
| `package.json could not be read` | Dosya var ama okunamıyor. |
| `package.json is not valid JSON` | JSON ayrıştırılamıyor. |
| `package.json must contain an object` | Üst düzey nesne değil. |
| `agzPlugin must be an object` | Anahtar nesne değil. |
| `unknown agzPlugin field <ad>` | Yukarıdaki tabloda olmayan alan. |
| `agzPlugin.schemaVersion must be 1` | Eksik ya da farklı sürüm. |
| `agzPlugin.id must be <publisher>/<name>, each part 1..63 lowercase letters, digits, '.', '_' or '-' (or a bare name of 1..128 such characters)` | Hatalı kimlik. |
| `agzPlugin.<alan> must be a non-empty string without control characters (at most 4096 characters)` | Hatalı `name`, `description`, `publisher` ya da `homepage`. |
| `agzPlugin.homepage must be an https URL` | Değer adres değil ya da `https` değil. |
| `agzPlugin.homepage must be an https URL without credentials` | Adreste kullanıcı adı ya da parola var. |
| `agzPlugin.<alan> must be an array of at most 1000 package-relative paths` | Dizi olmayan ya da çok uzun kaynak alanı. |
| `agzPlugin.<alan> must contain non-empty package-relative paths` | Dize olmayan, boş, çevresinde boşluk olan, çok uzun, denetim karakteri ya da ters eğik çizgi içeren girdi. |
| `agzPlugin.<alan> path must stay inside the package: <girdi>` | Mutlak yol, sürücü yolu, önekten sonra boş yol ya da `..` bölümü. |
| `agzPlugin.icon must be one package-relative png, webp or svg file path (at most 1024 characters, without backslashes or control characters)` | Simge dize değil, başka bir uzantıda ya da yukarıdaki yol kurallarına aykırı. |
| `agzPlugin.engine must be one package-relative ts, mts, js or mjs file path (at most 1024 characters, without backslashes or control characters)` | Motor modülü dize değil, başka bir uzantıda ya da yukarıdaki yol kurallarına aykırı. |
| `agzPlugin.mcpServers must map server names to server configs` | Değer nesne değil. |
| `agzPlugin.mcpServers holds at most 16 servers` | Çok fazla sunucu. |
| `agzPlugin.mcpServers: <neden>` | Hatalı sunucu adı ya da yapılandırması; neden sunucuyu adıyla söyler, örneğin `invalid server name "<ad>" (use letters, digits, "_" and "-")`. |
| `agzPlugin.permissions must be a list without repeats of: …` | Değer dizi değil, bilinmeyen bir izin içeriyor ya da bir izni yineliyor. |
| `agzPlugin.userContent[<n>].path must be project:<relative path> or home:<relative path>, without "..", backslashes or control characters` | Hatalı `userContent` yolu. |
| `agzPlugin.userContent[<n>].path repeats <yol>` | İki girdi aynı yeri gösteriyor. |
| `agzPlugin.settings[<n>].scope must be "project" when given` | Bir ayarın `scope` değeri başka bir şey. |
| `agzPlugin.settings[<n>].scope is not allowed on a secret field` | `scope` taşıyan `secret` alanı. |
| `engines["agz-plugin-sdk"] must be a semver range, for example ^1: <değer>` | Değer dize değil ya da geçerli bir semver aralığı değil. |
| `engines["agz-plugin-sdk"] <aralık> is not satisfied by the plugin SDK <sürüm> of this AGZ-Code` | Çalışan AGZ Code'un SDK'sı aralığın dışında. |

Dosyaların çözülmesinden iki hata daha gelir:

| Neden | Sebep |
|---|---|
| `agzPlugin.<alan> path must stay inside the package (after resolving symlinks): <dosya>` | Sembolik bağlantı paket dışına çıkıyor. |
| `agzPlugin.<alan> declaration matches no resource files: <girdi>` | Eksik yol, eşleşmeyen glob ya da o türde dosyası olmayan klasör. |
| `agzPlugin.bots brief file is missing or unreadable: <yol>`, `... path must stay inside the package (after resolving symlinks): <yol>`, `... must be a file: <yol>` | Bir bot şablonunun `brief` dosyası yok, paket dışına çıkıyor ya da klasör. |
| `agzPlugin.icon file is missing or unreadable: <yol>`, `... path must stay inside the package (after resolving symlinks): <yol>`, `... must be a file: <yol>` | `icon` için dosya yok, paket dışına çıkıyor ya da klasör. |
| `agzPlugin.icon must be at most 32768 bytes: <yol>`, `agzPlugin.icon is not a png image: <yol>` (`webp` ve `svg` için de aynı) | Simge 32 KB'ı aşıyor ya da içeriği uzantısındaki görsel türünde değil. |
| `agzPlugin.engine file is missing or unreadable: <yol>`, `... path must stay inside the package (after resolving symlinks): <yol>`, `... must be a file: <yol>` | `engine` modülü için dosya yok, paket dışına çıkıyor ya da klasör. |

`systemPrompt` alanının nedenleri, Sistem istemi düzenlemeleri bölümünde listelenir.

Manifesti yüklenemeyen paket, eklenti listesinde, oturumun uzantı hatalarında ve motorun günlüğünde yükleme hatası olarak bildirilir. Hiçbir şeye geri dönülmez ve diğer paketlerin yüklenmesini durdurmaz: her paketin hatası kendisine aittir.

## Masaüstü arayüz modülü

`agzPlugin.ui.module` alanı `{ "entry": "dist/ui.mjs", "settings": true }` alır. `settings: true` yalnız modül kendi ayar bileşenini sağlıyorsa kullanılır. Paket `ui` iznini bildirmeli ve tek derlenmiş modül dosyasını (1 bayt ile 4 MiB arası) `files` listesine almalı. Uygulamanın React ve bileşenlerini `@agz-yazilim/plugin-ui` üzerinden alın. Kitin kurulu olduğu bir eklentide arayüz paketini ve esbuild'i geliştirme bağımlılığı olarak ekleyip `ui/index.tsx` dosyasını derleyin:

```sh
npm install --save-dev --save-exact --ignore-scripts @agz-yazilim/plugin-ui@0.1.0 esbuild
npx agz plugin build-ui
```

Uygulama, bildirilen görünüm kimlikleri için `views`, özel ayarlar için `settings`, komut paleti, isteğe bağlı menü ve kısayol için `actions`, sağ panel rozetleri için `badges` kullanır. Veriden çizilen görünümleri koruyun: Android ve modülün tam karmasına izin vermeyen masaüstü cihazlar bunları kullanır. Motorun kurulum onayı cihaz onayı değildir; arayüz modülü uygulama penceresinin haklarıyla çalışır.

## Yerel alt süreçler

Çalıştırılabilir dosyaları `agzPlugin.binaries` altında adlandırın. Örnek: `binaries: { "worker": { "linux-x64": { "path": "bin/linux-x64/worker", "sha256": "<64 küçük harfli onaltılık basamak>" } } }`. Eklenti `engine` alanını, `process` ve `native` izinlerini bildirmeli ve tanımladığı dosyaları pakete almalı. Kurulum, motorun çalıştığı platforma ait dosyanın karmasını doğrular; `engine.spawn` çalıştırmadan önce yeniden doğrular. Desteklenmeyen platformlarda `engine.hasBinary("worker")` ile yedek yol seçin.

`engine.spawn({ binary: "worker", args, onOutput, restart: "on-failure" })` standart çıktıyı aktarır, hata çıktısını eklentinin günlük klasörüne yazar ve eklenti durduğunda alt süreci durdurur. `binary` yerine `command` ile dış program da çalıştırılabilir; bağımsız değişkenler kabuktan geçmez. `write` standart girdiye yazar; `done` son denemenin çıkışını bildirir. `spawn` veri biçimini eklentiye bırakır. Kendi çalıştırılabilir dosyanızı paketleyin; bir Rust crate'i gerekmez.

## Arka plan yardımcıları

`agents` iznine sahip motor modülü `engine.registerHelper({ id, title, triggers, due, run })` çağırabilir. Küçük harfli bir yerel `id`, İngilizce ve Türkçe `title` ve ihtiyacınız olan tetikleyicileri verin; örnek: `triggers: { manual: true, intervalMs: 900000, events: ["handoff"] }`. Motor kimliğin başına eklenti kimliğini ekler ve yardımcısını `helpers.list` ile listeler. `due` isteğe bağlı bir başlama denetimidir. `run({ reason, signal })` bir `{ outcome, changes?, summary? }` döndürür; kapatma veya zaman aşımında sinyale uyun.

Motor takvimi 15 dakikada bir denetler, başarısız otomatik çalışmalardan sonra bekler ve son beş sonucu eklentinin veri klasöründe tutar. Devir sinyali içerik taşımaz; meşgul yardımcı ikinci iş başlatmaz. Kaçan sinyalden sonra kalıcı kuyruğu denetlemek gerekiyorsa bir aralık da tanımlayın. Bunlar bot değildir ve kaydolduklarında sohbet oluşturmazlar.

## İlgili sayfalar

- [Hızlı başlangıç](./quickstart.md): paketi kur ve denetle.
- [Eklenti kodu API'si](./extension-api.md): `extensions` girdileri neyi dışa aktarır.
- [Beceri eklentileri](./skill-plugins.md): `skills` klasörü neler içerir.
- [Depolama](./storage.md): eklentinin, ayarlarının ve verisinin nerede tutulduğu.
