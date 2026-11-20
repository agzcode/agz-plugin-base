# Eklentiyi test etmek

Eklenti testleri `agz plugin test` ile `node --test` üzerinde çalışır. `@agz-yazilim/plugin-kit/testing` paketindeki `createMockHost` kullanılır; bu, eklentinin araçlarını, kancalarını, komutlarını ve görünümlerini uygulama olmadan çalıştırır. Sahte ev sahibi (`createMockHost`), kayıt, argüman şemaları, kanca sırası ve görünümler için motorun kurallarını izler. Motorun kendi testleri kodu olan iki örnek eklentiyi, `issue-tracker` ve `command-guard`ı, hem sahte ev sahibine hem gerçek motora yükler; kaydettiklerini ve çalıştığında yaptıklarını karşılaştırır. Yalnızca beceriden oluşan `release-notes` örneği yalnızca motorda denetlenir.

## İlk test

`create`, testi `test/<id>.test.ts` olarak yazar. `my-plugin` kimliği için şablonun testi yankı aracını ve kancasını çalıştırır:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { createMockHost } from "@agz-yazilim/plugin-kit/testing";
import plugin from "../extensions/index.ts";

test("my_plugin_echo returns the text it was given", async () => {
	const host = createMockHost();
	await host.load(plugin);
	const run = await host.runTool("my_plugin_echo", { text: "hello" });
	assert.equal(run.isError, false);
	assert.deepEqual(run.content, [{ type: "text", text: "hello" }]);
});

test("my_plugin_echo refuses an empty text with the reason its tool_call hook gives", async () => {
	const host = createMockHost();
	await host.load(plugin);
	const run = await host.runTool("my_plugin_echo", { text: "" });
	assert.equal(run.isError, true);
	assert.match(JSON.stringify(run.content), /needs a non-empty text/);
});
```

Bu test `dir` vermez; bu yüzden eklentinin manifest kimliği yoktur. Test görünümleri ya da ayarları kapsamaya başladığında `dir` verin.

## Sahte ev sahibini oluşturmak

`createMockHost(seçenekler)` hepsi isteğe bağlı şu seçenekleri alır:

- `dir`: eklenti klasörü. Onun `package.json` dosyası eklenti kimliğini, bildirilen görünüm kimliklerini ve ayar formunu verir. Verilmezse `registerView` her görünümü reddeder ve `getPluginSettings()` `{}` döndürür; ev sahibinde olduğu gibi.
- `settings`: alan anahtarına göre kayıtlı değerler; gizli değerler dahil. Yalnızca manifestin bildirdiği alanlar, varsayılanlarıyla birlikte `getPluginSettings()`'e ulaşır.
- `storageDir`: `getPluginPaths()` çağrısının eklentinin `data`, `cache` ve `logs` klasörlerini koyduğu yer. Varsayılanı, ilk çağrıda oluşturulan geçici bir klasördür. Eklentinin yazdıklarını okumak ya da aynı veri üzerinde ikinci bir oturum çalıştırmak için testin bir klasörünü verin ve sonra silin.
- `cwd`: oturumun çalışma klasörü. Varsayılanı `process.cwd()`dir. `ctx.cwd` ve `exec`'in varsayılan klasörüdür.
- `sessionId`: sahte oturumun kimliği; `sessionApi(api).sessionId` ve `host.session.sessionId` onu döndürür. Varsayılanı `"mock-session"`dır.
- `ui`: `ctx.ui` diyaloglarına verilecek hazır yanıtlar. `ui` verilmezse `ctx.hasUI` `false` olur ve diyaloglar boş yanıtlarını döndürür.
- `exec`: `api.exec` çağrısına verilecek yanıt. Verilmezse `exec` reddedilir; birim testleri süreç başlatmaz.

## Yükleme ve çalıştırma

- `await host.load(fabrika, extensionPath?)`, eklentinin fabrikasını ev sahibinin yaptığı gibi çalıştırır; `{ ok: true }` ya da `{ ok: false, error }` döndürür. Fabrikadaki bir fırlatma `Failed to load extension: <ileti>` olarak bildirilir. Yeniden yükleme, önceki yüklemenin yerini alır; uygulamadaki yeniden yüklemeyle aynıdır.
- `host.runTool(ad, parametreler, { signal?, toolCallId? })`, bir aracı model çağrısının yaptığı gibi çalıştırır: argüman hazırlığı, şema doğrulaması, `tool_call` kancaları, `execute`, sonra `tool_result` kancaları. Başarısızlık `isError: true` ile sonuçlanır; reddedilmez. Çağrı yalnızca o adda görünür bir araç yoksa fırlatır; erişim biçimi `hidden` olan araç da görünür sayılmaz ve fırlatır. Sonuç aracın `content`, `details` ve `structuredContent` alanlarını; ayrıca `isError`, `updates` (kısmi sonuçlar), `toolCallId` ve araç çalıştıysa `durationMs` alanını taşır.
- `host.runCommand(ad, args?)` bir eğik çizgi komutunu çalıştırır; işleyici fırlatırsa `{ ok: false, error }`, başarılıysa `{ ok: true }` döndürür. Bilinmeyen bir ad için fırlatır. İki uzantı aynı komut adını kaydederse `ad:1` ve `ad:2` olarak anılırlar.
- `host.emit(olay, yük?)` bir olayı tetikler ve işleyicilerin sonuçlarından ev sahibinin oluşturduğu değeri döndürür: `tool_call` ilk engeli ya da argüman değişikliğini, `turn_end` `{ entries, continue }` değerini, `before_agent_start` özel iletileri ve değiştirilmiş sistem istemini verir. Ev sahibinin her zaman doldurduğu alanların varsayılanı vardır; çoğu yük yalnızca kendi alanlarını ister.
- `host.renderView(kimlik, { locale?, timeoutMs? })`, görünümün `render` işlevini çağırır ve sonucu görünüm sınırları ve biçimiyle denetler. `{ ok: true, view }` ya da `{ ok: false, error }` döndürür. Süre sınırı `render` için 5000 ms, bir eylem için 30000 ms'dir. Kayıtsız bir kimlik için fırlatır.
- `host.runViewAction(kimlik, eylem, girdi?)`, görünümün `action` işlevini çağırır ve `{ ok: true }` ya da `{ ok: false, error }` döndürür. Sonra görünüm geçersiz kılınır. Kayıtsız bir kimlik için fırlatır.
- `host.setSettings(yeni)` değerleri kaydeder ve yeni `getPluginSettings()` ile `settings_change` olayını tetikler.

## Eklentinin yaptıklarını okumak

- `host.tools`, `host.commands`, `host.views` ve `host.mcpServers`, ev sahibinin çakışma kurallarından sonra kaydedilenleri listeler.
- `host.issues`, ev sahibinin reddedeceği ya da bildireceği şeyleri listeler; her birinin `kind` değeri vardır (`load`, `view`, `tool`, `handler` ya da `settings`). `host.describeIssues()` bunları satır satır yazdırır. `host.loadErrors` yükleme hatalarını listeler.
- `host.sent`, oturuma ulaşan ileti ve kayıtları sırayla listeler. `host.uiLog`, `ctx.ui` çağrılarını yanıtlarıyla listeler. `host.execs`, `api.exec` çağrılarını çalışma klasörleriyle listeler. `host.invalidations`, görünüm geçersiz kılmalarını listeler; `host.aborts` ise `ctx.abort()` çağrılarının sayısını verir.

## Yanıtları betiklemek

`ui` bir diyaloğa üç biçimde yanıt verir: tek bir değer her çağrıya yanıt verir; bir dizi her çağrıya sırayla, bir girdi başına bir yanıt verir ve son girdiden sonraki çağrı başarısız olur; bir işlev her çağrıyı ayrı karara bağlar. `ui` verilmişse ve bir diyalog yönteminin hazır yanıtı yoksa, çağrı eklentinin kodunda fırlatır. Bir araçta bu fırlatma hata sonucuna dönüşür; bir olay işleyicisinde sorun olarak bildirilir. `ui` hiç verilmemişse diyaloglar boş yanıtlarını döndürür.

`exec` yanıtlayıcısı komutu, argümanlarını ve seçeneklerini alır ve `{ stdout?, stderr?, code?, killed? }` döndürür; eksik alanlar `""`, `0` ve `false` olur. Başlatılamayan bir komutu taklit etmek için ev sahibinin yaptığı gibi `code: 1` verin ve nedeni `stderr` içinde yazın. Yanıtlayıcıdan fırlatılan hata `exec`i reddeder.

## Eklenti erişimini test etmek

[Deneysel erişim API'sini](./extension-api.md#arac-erisimi-ve-onay) destekleyen bir motor ve SDK kullanın. `createMockHost` manifesti ve erişim listesini okuyabilsin diye eklenti klasörünü `dir` olarak verin (klasörü olmayan bir eklentiye liste `access` ile verilir), erişim düğmelerini `host.setAccess(ad, açık)` ile açın (başka bir klasörden yüklenen eklentinin kendi düğmeleri vardır: `setAccess(ad, açık, pluginId)`) ve onay penceresinin yanıtını `createMockHost({ ui: {}, approve })` ile belirleyin: `"approve"`, `"decline"`, `"timeout"` ya da isteği alan bir işlev; çağrının sinyali iptal edildikten sonra gelen yanıt ret sayılır. `createMockEngine` aynı düğmeleri kendi `settings` değerinden (`access_read`, `access_automations`) okur, `getSettings()` ve `onSettingsChange` içinde salt okunur olarak verir ve otomasyon kaynaklarını denetler: `engine.listAutomationSources()` ile `engine.emitAutomationEvent(sourceId, event)`, `access_read` ve `access_automations` açık değilse hiçbir kaynak listelemez ve hiçbir olay teslim etmez; düğmeler her çağrıda yeniden okunur. Çağrıları kaydeden sahte bir hizmet bağlantısı kullanın ve yalnızca araç sonucuna bakmayın: işlem reddedildiyse sahte hizmetin gönderim kaydı boş kalmalıdır.

Erişim denetimini uygulayan bir ortamda şu durumları sınayın:

- Erişim düğmeleri ayarlanmamışsa veya Okuma kapalıysa iki araç da çalışmaz. Güvenilen bir projede Okuma açıksa okuma aracı çalışır. Güvenilmeyen bir projede düğmeler açık olsa bile çağrı reddedilir.
- Sahte oturumda `isSubagent: true` ise okuma için alt ajan düğmesi de açık olmalıdır. Tüm düğmeler açık olsa bile gönderim reddedilir. Arayüzü bağlı olmayan bir ana oturum da gönderemez.
- Arayüzü bağlı ana oturumda hem onayı hem reddi sınayın. Pencere açıkken bir erişim düğmesini veya eklenti ayarını değiştirip sonra onay vermeyi de sınayın: onay belgesinin `check()` yöntemi gönderimi durdurmalıdır.

Erişim denetimini uygulamayan bir kitle de hizmet bağlantısını test edebilirsiniz, ancak bu test motorun çağrıyı reddettiğini göstermez. Bu retleri AGZ Code'da, güvenilen bir test projesi ve sahte bir hizmetle sınayın; gerçek bir posta kutusu kullanmayın.

## Hesapları test etmek

`createMockHost` veya `createMockEngine` için `accounts: { mail: { state: "connected", email: "user@example.test", respond: request => new Response("{}") } }` verin; `dir`, manifestinde `mail` bildiren eklentiyi göstermelidir. Yanıtlayıcı kimlik bilgisi içermeyen bir `Request` alır; sağlayıcıya hiç ağ isteği gitmez. Okuma düğmesini `host.setAccess("read", true)` veya motorun `settings: { access_read: true }` ayarıyla açın. Yeniden denemeyi sınamak için sırayla 401 ve başarı yanıtı, yönlendirmenin izlenmediğini sınamak için 3xx yanıtı verin. Bildirilmemiş kimliği, yanlış kökeni, Authorization üstbilgisini, bağlantısız veya `reconnect_required` durumunu, onaysız yazmayı, geçersiz onay belgesini, Graph okuma istisnalarını ve alt ajan ile motor yazma retlerini de sınayın. Sahte ortam gerçek OAuth yenilemeyi veya tarayıcıda oturum açmayı doğrulamaz; bunlar için motorun bütünleşik testlerini kullanın.

## Motor modülünü test etmek

Sahte ev sahibi uzantı kodunu çalıştırır. Motor modülünü sahte motor çalıştırır: `createMockEngine({ dir })` eklentinin manifestini okur, `start()` `agzPlugin.engine` alanının gösterdiği modülü yükler (ya da verdiğiniz fabrikayı çalıştırır), `stop()` sinyalini iptal eder ve modülün döndürdüğü işlevi çağırır.

```ts
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createMockEngine } from "@agz-yazilim/plugin-kit/testing";

test("the engine module writes its state, serves its status bar view and stops", async () => {
	const storageDir = mkdtempSync(join(tmpdir(), "my-plugin-"));
	const engine = createMockEngine({ dir: join(import.meta.dirname, ".."), storageDir, settings: { intervalSeconds: 3600 } });
	await engine.start();
	try {
		assert.ok(existsSync(join(storageDir, "data", "heartbeat.json")));
		const rendered = await engine.renderView("queue", { locale: "en", statusOnly: true });
		assert.deepEqual(rendered, { ok: true, view: { status: { items: [{ label: "Queue", value: "0", tone: "neutral" }] }, sections: [] } });
	} finally {
		await engine.stop();
		rmSync(storageDir, { recursive: true, force: true });
	}
});
```

| Üye | Ne yapar |
|---|---|
| `start(fabrika?)`, `stop()`, `running` | Modülü çalıştırır ve durdurur. Modülün işlev olan bir varsayılan dışa aktarımı yoksa ya da fabrika hata fırlatırsa `start` reddeder. |
| `views`, `renderView(kimlik, { locale, statusOnly, timeoutMs })`, `runViewAction(kimlik, eylem, girdi)` | Modülün kaydettiği durum çubuğu görünümleri; ev sahibinin denetlediği gibi denetlenir: aynı sınırlar, aynı süreler, aynı hata metinleri. |
| `setSettings(değerler)` | Yeni ayarları kaydeder ve modülün `onSettingsChange` dinleyicilerini çağırır. |
| `call(yöntem, parametreler?, { timeoutMs })` | Modülün `engine.handle` ile kaydettiği bir yöntemi uygulamanın yaptığı gibi çağırır: uygulamaya ulaşacak JSON ile `{ ok: true, result }` ya da ev sahibinin iletisiyle `{ ok: false, code, error }` (`not_found` ya da `failed`). |
| `setSubscribers(konu, sayı)`, `published` | Bir konuyu kaç istemcinin izlediğini söyler (modülün `onSubscribers` dinleyicileri duyar) ve modülün abonesi olan konularda yayımladıklarını listeler. |
| `notices`, `setQuotas(kotalar)` | `engine.notify` ile kullanıcıya ulaşan bildirimler, iki dilde (dakikada 6 sınırını aşan listelenmez) ve `engine.quotas.list()` yanıtındaki sağlayıcı kotaları; `setQuotas` modülün `onChange` dinleyicilerini de çağırır. İzinler ev sahibindeki gibi denetlenir. |
| `setStats(değerler)` | `engine.host.stats()` yanıtını belirler; `stats` seçeneği ilk yanıtı, `version` motor sürümünü verir. |
| `logs`, `invalidations` | Modülün günlüğe yazdığı satırlar ve geçersiz kılınan görünümlerin kimlikleri. |

Modülü bir `finally` bloğunda durdurun: çalışır bıraktığı bir zamanlayıcı, başarısız bir doğrulamadan sonra test sürecini açık tutar. Modülü, dosyalarını okuyan bir araçla birlikte test etmek için sahte ev sahibine aynı `storageDir` değerini verin; ikisi de `<storageDir>/data` klasörünü kullanır. `agz-plugin-base` deposundaki `engine-module` şablonu ve `uptime-monitor` örneği böyle yapar.

## Oturum API'sini test etmek

[Kararsız oturum API'sini](./extension-api.md#oturum-api-si-kararsiz) kullanan eklenti onu sahte ev sahibinden de alır: `sessionApi(api)` bir oturum döndürür ve `host.session`, testin onu betiklediği denetleyicidir. Ev sahibinin rolünü oynar: çalışmaları bitirir, dalları değiştirir, eklentiyi uyandırır ve model çağrılarını yanıtlar. Oturumu `sessionId` seçeneği adlandırır.

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { createMockHost } from "@agz-yazilim/plugin-kit/testing";
import plugin from "../extensions/index.ts";

test("the plugin delivers three passes, then clears its drive record", async () => {
	const host = createMockHost();
	await host.load(plugin);
	for (let pass = 1; pass <= 3; pass++) {
		await host.session.settle();
		assert.equal(host.session.deliveries.length, pass);
		assert.equal(host.session.state.get("passes"), 3 - pass);
	}
	await host.session.settle();
	assert.equal(host.session.deliveries.length, 3);
	assert.equal(host.session.drive.get(), undefined);
});
```

| Üye | Ne yapar |
|---|---|
| `settle(run?)` | Bir bütün çalışmayı bitirir: `run` içinde verilmeyen alanlar, tamamlanan bir çalışmanın değerlerini alır (`run-<n>`, araç çağrısı yok, token yok, hata yok, bekleyen girdi yok, çocuk yok). `onSettled` dinleyicileri kayıt sırasıyla birer birer çalışır; fırlatan dinleyici bir sorundur, ötekiler yine çalışır. Dinleyicilerin aldığı özetle sonuçlanır. |
| `changeBranch(dal?)` | Oturumu başka bir dala geçirir; ağaçta gezinme ya da çatallama gibi: `onBranchChange` dinleyicileri çalışır ve eklenti yeni dalın durumunu okur. Kimlik verilmezse durumsuz yeni bir dal başlar. |
| `wake(olay?)` | Eklentiyi sürüş kaydı için uyandırır ve `onWake` dinleyicilerini bekler. `reason` varsayılanı `"restart"`, `drive` varsayılanı eklentinin kayıtıdır. Kayıt yoksa fırlatır; ev sahibi yalnız oturumunu süren bir eklentiyi uyandırır. |
| `setTranscript(girdiler)` | `transcript()` çağrısının okuduğu, etkin dalın dökümünü belirler. `id`, `role` ve `at` için varsayılanlar vardır (`entry-<n>`, `user`, sabit bir zaman). |
| `answerComplete(yanıt)` | `complete` yanıtlarını betikler: her çağrıya tek yanıt, çağrı başına bir yanıtlık dizi ya da isteğin bir işlevi. Dizinin son girdisinden sonraki çağrı testi başarısız kılar; hiçbir şey betiklenmemişken `complete` çağıran eklenti `error` yanıtı alır. Başarısızlığı test etmek için bir `error` ile yanıtlayın. |
| `deliveries`, `nextDelivery(sonuç)` | `deliver` ile gönderilen iletiler; seçenekleri ve her birinin sonuçlandığı değerle birlikte. `nextDelivery`, sonraki `deliver`ın neyle sonuçlanacağını (`started`, `queued` ya da `written`) betikler. Hiçbir şey betiklenmediyse `deliver` `written` ile sonuçlanır; sahte ev sahibi çalışma başlatmaz. Her ileti ayrıca `host.sent` içindedir. |
| `state` | Eklentinin dal başına durumu: `get(anahtar)`, `set(anahtar, değer)`, `all()`, `of(dal)` ve etkin `branch`. |
| `drive` | Sürüş kaydı: `get()`, `set(kayıt)` ve `clear()`; kaydı okumak ya da başlangıç noktasını eklenti olmadan kurmak için. |

Sahte ev sahibinin kendi zamanı yoktur: sürüş kaydının `wakeAt` değeri hiçbir şeyi uyandırmaz. Ev sahibi eklentiyi o zamanda uyandıracakmış gibi `wake({ reason: "timer" })` çağırın.

## Sahte ev sahibinin yapmadıkları

- Sahte ev sahibi ile sahte motor iki ayrı nesnedir: sahte ev sahibi yalnızca uzantı kodunu yükler, motor modülü `createMockEngine` içinde çalışır. Aynı `storageDir` altındaki dosyalar dışında ortak durumları yoktur.
- Sahte ev sahibinin tek bir ayar değeri kümesi vardır. Proje kapsamlı bir alanın hangi değerinin geçerli olduğuna (projenin mi, kullanıcının mı) ev sahibi karar verir; sahte ev sahibine testin konusu olan değeri verin.
- `exec` hiçbir süreç başlatmaz; yanıtı siz betiklersiniz.
- Hiçbir MCP sunucusu başlatılmaz; HTTP sunucusunun `oauth` ve `auth` alanları denetlenmez. Manifestin bildirdiği bir sunucuyu (`mcpServers`) sahte ev sahibi kaydetmez; `mcp-server` şablonunun yaptığı gibi sunucu programının kendisini test edin.
- Sahte ev sahibi oturum, model, kum havuzu (sandbox) ve onay istemi başlatmaz; `host.session` yalnız ev sahibinin yapacağını betikler ve gönderilen ileti için çalışma başlatmaz. Burada geçen bir araç uygulamada yine de reddedilebilir.
- Bir uzantıyı yeniden yüklemek eklentinin oturum durumunu ve sürüş kaydını korur, ama yerini aldığı kodun oturum dinleyicilerini bırakır; yeniden yükleme de böyle yapar.
- Bir oturumda modele hangi araçların sunulacağı taklit edilmez: `runTool`, görünür her aracı çalıştırır.
- Araç argümanları TypeBox şemalarına göre denetlenir. Ev sahibinin düz JSON Schema nesnelerine uyguladığı dönüşüm taklit edilmez.
- Bir `turn_end` işleyicisinin sonucu denetlenmez: `entries` ve `continue`, işleyicinin döndürdüğü gibi alınır.

Yayımlamadan önce eklentiyi uygulamada çalıştırın: klasörünü Ayarlar > Eklentiler'de bağlayın ve aracı bir Code Mode betiğinden çağırın.
