# Örnek eklentiler

Açık depo `agzcode/agz-plugin-base`, her katkı türü için bir şablon ve tam bir örnek barındırır. Şablon (`templates/<ad>`), tek bir katkı noktasını kullanan en küçük eklentidir; klasörünü kopyalayın ve `my-plugin` adını değiştirin. Örnek (`examples/<ad>`), gerçek bir işe yarayan bitmiş bir eklentidir. Her birinin manifesti, kaynağı, testleri ve README dosyası vardır.

## Şablonlar

| Şablon | Katkı | Örneği |
|---|---|---|
| `extension` | Uzantı kodunda bir araç ve bir kanca. `agz plugin create` yazar. | `command-guard` |
| `skill` | Betikli bir aracı olan beceri. `agz plugin create --kind skill` yazar. | `release-notes` |
| `skill-extension` | Beceri ve uzantı kodu birlikte. `agz plugin create --kind skill+extension` yazar. | yok |
| `view` | Uygulamanın veriden çizdiği bir panel görünümü ve süslenmiş bir araç kartı (`ui.views`, `ui.toolViews`). | `issue-tracker` |
| `engine-module` | Motor modülü: eklenti açıkken bir kez çalışan kod (`engine`). | `uptime-monitor` |
| `mcp-server` | Manifestte bildirilen, uzantı kodu gerektirmeyen MCP sunucusu (`mcpServers`). | `date-tools` |
| `project-settings` | Proje kapsamlı alanı olan bir ayar formu (`settings`, `scope: "project"`). | `commit-style` |
| `storage` | Eklentinin kendi veri klasörü (`getPluginPaths()`). | `snippets` |
| `declarative` | Kodsuz: bir ajan, bir istem şablonu, bir bot şablonu katkısı, bir sistem istemi düzenlemesi ve bir simge. | `review-kit`, `release-notes` |

Manifestin `themes` alanının şablonu yoktur: yükleyici tema dosyalarını çözer, ama masaüstü uygulaması onları uygulamaz.

Bir şablondan başlamak için klasörünü kopyalayın ve dört yer tutucu adı klasörün her yerinde, dosya içeriklerinde ve dosya adlarında (`test/my-plugin.test.ts`) değiştirin. `acme` yayıncısının `todo-notes` eklentisi için:

| Yer tutucu | Yerine | Nerede kullanılır |
|---|---|---|
| `my-plugin` | `todo-notes` | Paket adı, kimliğin ad kısmı, dosya adları |
| `my_plugin` | `todo_notes` | Araç adları, örneğin `todo_notes_remember` |
| `My Plugin` | `Todo Notes` | Uygulamanın gösterdiği ad, araç etiketleri |
| `my-publisher` | `acme` | Kimliğin yayıncı kısmı; kimlik `acme/todo-notes` olur |

Sonra klasörde `npm install --ignore-scripts`, `npm test` ve `npx agz plugin check` çalıştırın.

Örneklerden üçü, `issue-tracker`, `command-guard` ve `release-notes`, kitin kaynağında da durur: `packages/plugin-kit/examples`. Motorun testleri `issue-tracker` ve `command-guard`ı hem sahte ev sahibine hem gerçek motora yükler; kaydettiklerini ve çalıştığında yaptıklarını karşılaştırır. `release-notes` bir beceri olduğu için motor testleri onu yalnızca motorda denetler.

## Issue Tracker

GitHub benzeri bir sorun API'sini ajandan arar ve sonuçları bir panelde gösterir. Klasör: `examples/issue-tracker`.

- Manifest: kimlik `issue-tracker`, bir uzantı `src/index.ts` ve panelde bir görünüm `issues`.
- Ayarlar: `endpoint` (sorun URL'si, en fazla 500 karakter), `token` (gizli; taşıyıcı belirteci olarak gönderilir) ve `pageSize` (1 ile 100 arası, varsayılan 20).
- Araç `issue_tracker_search`: isteğe bağlı `query` (başlıkta büyük küçük harf ayrımı yapmadan aranan metin), `state` (`open`, `closed` ya da `all`; varsayılan `open`) ve `label`. Salt okunurdur.
- İstek 15 saniyede zaman aşımına uğrar. Çekme isteği (pull request) listeden çıkarılır. URL'sinde kimlik bilgisi olan bir uç nokta reddedilir; hiçbir hata iletisi belirteci içermez.
- Panelde durum filtresi vardır. Eklenti `settings_change` olayını görünümü geçersiz kılarak işler; kullanıcı kaydettikten sonra panel yenilenir.

## Command Guard

Ajan çalıştırmadan önce tehlikeli kabuk komutlarını engeller. Klasör: `examples/command-guard`.

- Manifest: kimlik `command-guard`, bir uzantı `src/index.ts` ve dört ayar: `mode` (`block` ya da `warn`; varsayılan `block`), `disabledRules` (virgülle ayrılmış kural kimlikleri), `extraPattern` (komutun tamamına büyük/küçük harf gözetmeden uygulanan düzenli ifade) ve `shellTools` (varsayılan `bash`).
- `shellTools` içindeki araçlar için `tool_call` işler. Komuttaki boşluk dizileri tek boşluk sayılır.
- Altı yerleşik kural: `rm-root`, `git-force-push`, `git-reset-hard`, `pipe-to-shell`, `disk-overwrite` ve `chmod-777`. `block` kipinde bir eşleşme `{ block: true, reason }` döndürür; `warn` kipinde komut çalışır ve kullanıcı uyarılır.
- Hatalı bir ayar (bilinmeyen kural kimliği, geçersiz desen) yok sayılır. Eklenti, sorun kümesi değiştiğinde bunu uyarı olarak bildirir; her komutta değil.
- `/guard-rules` komutu, kapalı olanlarla birlikte kural listesini oturuma ileti olarak gönderir.

## Release Notes

Son etiketten sonraki commit başlıklarından sürüm notu taslağı yazar. Klasör: `examples/release-notes`. Uzantı kodu yoktur: manifesti bir beceri, bir sistem istemi dosyası ve `contributes["agz/bots/templates"]` altında bir bot şablonu bildirir.

- Beceri `skills/release-notes`, türü `routed`, İngilizce ve Türkçe tetikleyici ifadelerle. `git log <etiket>..HEAD` başlıklarını okur, `group_commits` aracına verir, sonra taslağı düzenler.
- Araç `group_commits`: girdi `subjects` (en fazla 2000 metin, her biri en fazla 500 karakter); çıktı `markdown`, `sections` ve `ignored`. Değiştirmez ve dosya okumaz. Conventional Commits'i Added, Fixed, Changed, Documentation ve Other bölümlerine ayırır, kırıcı değişiklikleri başa koyar ve `chore`, `test`, `ci`, `build` ile `style` commit'lerini yok sayılanlar arasına koyar. Betiği `skills/release-notes/scripts/group_commits.mjs` dosyasıdır.
- Sistem istemi dosyası `system-prompt.json`: `working` bölümüne tek bir `add` işlemi, kimlik `release-notes.grounding`. Ajana, yalnızca okuduğu geçmişteki değişiklikleri yazmasını söyler.
- Bot şablonu `weekly-notes`, adı `release-notes-bot`, özeti `{ "$file": "bots/weekly-notes.md" }`. Önerilen onay `report`: taslağı yazar ve bildirir; kullanıcı bir dosya adı verdiğinde yalnızca o dosyayı yazar.

## Uptime Monitor

Bir adres listesini arka planda denetler ve ajana hangilerinin çalışmadığını söyler. Klasör: `examples/uptime-monitor`. Motor modülünün ne işe yaradığını gösterir: denetimler, bir oturum açık olsun olmasın, bütün motor için bir kez çalışır.

- Manifest: kimlik `example/uptime-monitor`, motor modülü `src/engine.ts`, bir uzantı `src/index.ts`, `network` izni ve üç ayar: `urls` (virgül ya da boşlukla ayrılmış http ya da https adresleri, en çok 20), `intervalSeconds` (30 ile 86400 arası, varsayılan 300) ve `timeoutSeconds` (1 ile 60 arası, varsayılan 10).
- Motor modülü her adresi aralıkla sorar; sonucu eklentinin veri klasöründeki `status.json` dosyasına, her tur için bir satırı da günlük klasöründeki `checks.log` dosyasına yazar. Ayarlar kaydedilince hemen yeniden denetler; bir tur sürerken istenen tur düşürülmez, onun ardından çalışır. Motorun durdurma sinyalinden sonra hiçbir şey yazmaz.
- Araç `uptime_status`: girdisi yoktur, salt okunurdur. `status.json` dosyasını okur ve çalışmayan adresleri başa koyarak listeler. Hiç adres ayarlanmamışsa ya da henüz bir denetim bitmemişse, ne yapılacağını söyleyerek başarısız olur.
- Kimlik bilgisi içeren bir adres reddedilir; hiçbir günlük satırı ya da araç sonucu böyle bir adresi yazdırmaz.
- Motor modülü ile uzantı kodu değişken paylaşmaz; ikisinin içe aktardıkları `src/checks.ts` içindedir ve veri klasöründeki dosya buluştukları yerdir.

## Date Tools

MCP sunucusu olarak takvim hesabı. Klasör: `examples/date-tools`. Uzantı kodu yoktur: sunucuyu manifest bildirir.

- Manifest: kimlik `example/date-tools`, bildirilen bir sunucu `date-tools` (`node ${pluginDir}/server/index.mjs`) ve `process` izni.
- Sunucu, bağımlılık olmadan stdio üzerinden MCP konuşur. Araçları `days_between` (`from`, `to`), `add_days` (`date`, `days`) ve `weekday` (`date`); sunucu kendisine verilmiş bir ajan bunları `mcp__date_tools__days_between` biçiminde çağırır.
- Tarihler, UTC'de sayılan `YYYY-MM-DD` takvim günleridir; yaz saati değişikliği bir sonucu kaydırmaz. Takvimde olmayan bir tarih, nedeniyle birlikte hata sonucu olarak döner.

## Commit Style

Bir commit iletisini, oturumun çalıştığı projenin kurallarına göre denetler. Klasör: `examples/commit-style`.

- Manifest: kimlik `example/commit-style`, bir uzantı `src/index.ts` ve dört ayar. `format` (`conventional` ya da `plain`), `types` ve `maxSubjectLength` proje kapsamlıdır: proje kendi değerlerini `<proje>/.agz-code/plugin-config/example+commit-style.json` dosyasında tutar. `guardGitCommit` kullanıcı ayarıdır.
- Araç `commit_style_check`: girdi `message`; `ok` değerini, sorun listesini ve uygulanan kuralları döndürür. Salt okunurdur.
- `guardGitCommit` açıkken bir `tool_call` kancası, kurallara uymayan tırnaklı bir `-m` değeriyle `git commit` çalıştıran `bash` çağrısını reddeder. Kabuk çalıştırmadan okuyamadığı ileti geçer.
- Kod ayarları her kullanımda okur ve projenin değeri ile kullanıcının değeri arasında seçim yapmaz: `getPluginSettings()` geçerli olanı döndürür.

## Snippets

Ajan için adlandırılmış metinleri oturumlar ve projeler arasında saklar. Klasör: `examples/snippets`.

- Manifest: kimlik `example/snippets`, bir uzantı `src/index.ts`.
- Araçlar `snippet_save`, `snippet_get`, `snippet_list` ve `snippet_delete`. Depo, eklentinin veri klasöründeki (`getPluginPaths().data`) `snippets/` altında parça başına bir dosyadır.
- Parça adı aynı zamanda dosya adıdır; bu yüzden bir yol oluşturulmadan önce klasörden çıkamayacak bir desene göre denetlenir. Parça geçici bir dosyaya yazılıp yeniden adlandırılır. Bir parça en çok 64 KB, depo en çok 200 parça tutar.
- Testler tek bir depolama klasörü üzerinde iki oturum çalıştırır (`createMockHost({ storageDir })`) ve eklentinin yazdığı dosyaları okur.

## Review Kit

Kodsuz kod incelemesi. Klasör: `examples/review-kit`.

- Manifest: kimlik `example/review-kit`, ajanlar klasörü, istemler klasörü, bir sistem istemi dosyası ve bir simge.
- Ajanlar `review-kit-correctness` ve `review-kit-tests`; ikisi de `verifier` temel ajanı üzerine kurulur.
- İstem şablonları: bir değişikliği iki ajana gönderip bulguları denetleten `/review` ve doğrulanan bulguları düzelten `/review-fix`.
- Test dosyası yoktur: `test` betiği, manifesti ve andığı her dosyayı doğrulayan `agz plugin check` komutudur.

## OpenAI uyumlu model sağlayıcısı

`examples/openai-compatible-provider` örneğinde bir motor modülü, `engine.providers.register` ile sohbet modelleri ekler. Adresi ve model listesini ayarlarından okur. Motora API anahtarının kendisini değil, kendi gizli alanının adını verir. Gerçek hesap bağlamadan önce yerel ve OpenAI uyumlu bir deneme sunucusuyla çalıştırın. Konuşma, o modellerden birini seçip kullandığınızda sunucuya gider. Eklentiyi kapattığınızda bu modeller kaldırılır.

## Bir örneğin testlerini çalıştırmak

Her örneğin `test` betiği `agz plugin test`tir (`review-kit` için `agz plugin check`). Örneğin klasöründe `npm install --ignore-scripts`, sonra `npm test` ve `npx agz plugin check` çalıştırın. `agz-plugin-base` klonunda `node scripts/check-all.mjs` bunu her şablon ve örnek için yapar. Testler `createMockHost` kullanır; bu, [Eklentiyi test etmek](./testing.md) sayfasında anlatılır.
