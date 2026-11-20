# agz-plugin-base

Bu depodaki belgeler, şablonlar, örnekler ve CI iş akışıyla [AGZ Code](https://code.agzyazilim.com) için eklenti yazabilirsiniz.

Eklenti geliştirmek için açılan bu temel depo MIT lisanslıdır. AGZ Code'un ve AGZ'nin kendi eklentilerinin kaynak depoları özeldir. Kendi eklentinizin kaynağını yayımlayabilir ya da kapalı tutabilirsiniz.

English: [README.md](./README.md)

## İlk eklentiniz

Node.js 22.19 ya da daha yenisi ve AGZ Code masaüstü uygulaması gerekir.

```sh
mkdir my-work && cd my-work
npm init -y
npm install --save-dev --save-exact --ignore-scripts @agz-yazilim/plugin-kit@1.4.0
npx agz plugin create notes-helper --id acme/notes-helper
cd notes-helper
npm install --ignore-scripts
npm test
npx agz plugin check
```

Sonra uygulamada Ayarlar > Eklentiler'i açın, `notes-helper` klasörünü yerel klasör olarak kurun, Oturumları yenile'ye basın ve bir oturumdan `notes_helper_echo` aracını çağırın. [Hızlı başlangıç](./docs/tr/quickstart.md) her adımı anlatır.

## Bir eklenti neler ekleyebilir

| Katkı | Manifest alanı ya da API | Şablon | Örnek |
|---|---|---|---|
| Araç, kanca, eğik çizgi komutu | `extensions` | [`extension`](./templates/extension) | [`command-guard`](./examples/command-guard) |
| Betikli araçları olan beceri | `skills` | [`skill`](./templates/skill), [`skill-extension`](./templates/skill-extension) | [`release-notes`](./examples/release-notes) |
| Panel ya da kenar çubuğu görünümü, süslenmiş araç kartı | `ui.views`, `ui.toolViews` | [`view`](./templates/view) | [`issue-tracker`](./examples/issue-tracker) |
| Bütün motor için bir kez çalışan arka plan işi | `engine` | [`engine-module`](./templates/engine-module) | [`uptime-monitor`](./examples/uptime-monitor) |
| Uzantı kodu gerektirmeyen MCP sunucusu | `mcpServers` | [`mcp-server`](./templates/mcp-server) | [`date-tools`](./examples/date-tools) |
| Ayarlar; proje başına da | `settings`, `scope: "project"` | [`project-settings`](./templates/project-settings) | [`commit-style`](./examples/commit-style) |
| Oturumlar arasında kendi verisi | `getPluginPaths()` | [`storage`](./templates/storage) | [`snippets`](./examples/snippets) |
| Ajanlar, istem şablonları, bot şablonları, sistem istemi düzenlemeleri, simge | `agents`, `prompts`, `bots`, `systemPrompt`, `icon` | [`declarative`](./templates/declarative) | [`review-kit`](./examples/review-kit), [`release-notes`](./examples/release-notes) |

Şablon, tek bir katkı noktasını kullanan en küçük eklentidir. Birinden başlamak için klasörünü kopyalayın; `my-plugin`, `my_plugin`, `My Plugin` ve `my-publisher` yer tutucu adlarını dosya içeriklerinde ve dosya adlarında değiştirin (her birinin neye dönüştüğünü [Örnek eklentiler](./docs/tr/examples.md#sablonlar) sayfasındaki tablo gösterir); sonra klasörde `npm install --ignore-scripts`, `npm test` ve `npx agz plugin check` çalıştırın. Örnek, gerçek bir işe yarayan bitmiş bir eklentidir; parçaların nasıl birleştiğini ve şablonun dışarıda bıraktığı durumları (hatalı ayarlar, sınırlar, aynı anda çalışan oturumlar) görmek için okuyun.

## Belgeler

Türkçe belgeler [`docs/tr`](./docs/tr), İngilizce belgeler [`docs/en`](./docs/en) klasöründedir. Aynı sayfalar web sitesinde de vardır: [code.agzyazilim.com/eklentiler/gelistirme](https://code.agzyazilim.com/eklentiler/gelistirme/).

| Buradan başlayın | |
|---|---|
| [Genel bakış](./docs/tr/overview.md) | Eklenti nedir, neler ekleyebilir |
| [Hızlı başlangıç](./docs/tr/quickstart.md) | Eklenti oluşturmak, test etmek, bağlamak ve çağırmak |
| [Manifest](./docs/tr/manifest.md) | Her `agzPlugin` alanı, kuralı ve hatası |
| [Eklenti kodu API'si](./docs/tr/extension-api.md) | Araçlar, kancalar, komutlar, MCP sunucuları, ayarlar, klasörler, görünümler |
| [API başvurusu](./docs/tr/api-reference.md) | SDK'nın kaynağından üretilen bütün türleri |
| [Depolama](./docs/tr/storage.md) | Eklentilerin, ayarların, gizli değerlerin ve eklenti verisinin yeri |
| [Güvenlik](./docs/tr/security.md) | Eklentinin neye erişebildiği, izinler, gizli değerler, güven |
| [Komut satırı](./docs/tr/cli.md) | `agz plugin create`, `check`, `test`, `pack`, `dev` |
| [Test](./docs/tr/testing.md) | Kitin sahte ev sahibiyle birim testleri |
| [Uyumluluk](./docs/tr/compatibility.md) | SDK aralığı ve sürümler |
| [GitHub'dan geliştirme](./docs/tr/github.md) | Depodan kurmak, etiket yayımlamak |
| [Örnek eklentiler](./docs/tr/examples.md) | Bu deponun şablonları ve örnekleri |

`docs/docs.json` bütün sayfaları okuma sırasıyla listeler.

## Eklentiniz için CI

[`ci/plugin-ci.yml`](./ci/plugin-ci.yml), bir eklentinin kendi deposu için bir GitHub Actions iş akışıdır: yaşam döngüsü betikleri olmadan kurar, testleri ve denetimi çalıştırır, paketlenmiş tarball'u yükler. Deponuzda `.github/workflows/ci.yml` olarak kopyalayın.

## Sürümler

Şablon ve örnekler npm'deki [`@agz-yazilim/plugin-sdk@1.4.0`](https://www.npmjs.com/package/@agz-yazilim/plugin-sdk/v/1.4.0) ve [`@agz-yazilim/plugin-kit@1.4.0`](https://www.npmjs.com/package/@agz-yazilim/plugin-kit/v/1.4.0) sürümlerini kullanır. Masaüstü arayüz modülleri için [`@agz-yazilim/plugin-ui@0.1.0`](https://www.npmjs.com/package/@agz-yazilim/plugin-ui/v/0.1.0) kullanın. Üç paket de MIT lisanslıdır. Uygulamanın SDK sürümü, eklentinin `engines["agz-plugin-sdk"]` aralığına uymalıdır; bkz. [Uyumluluk](./docs/tr/compatibility.md).

SDK 1.4.0 şunları ekler: yalnız ana oturumda sunulan araçlar (`scope: "main"`), [`ctx.agents.run`](./docs/tr/extension-api.md#paket-ajanını-çalıştırma) ile paket ajanı çalıştırma, pakete özel ve yalnız yanıt veren ajan profilleri ([ajan tanımları](./docs/tr/manifest.md#ajan-tanımları)) ve ajan görünümlü araç kartları (`card: "agent"`, `as: "markdown"` bölümleri). Kit 1.4.0'ın sahte ev sahibi ajan koşularını taklit eder: `createMockHost` çağrısına bir `agents` yanıtlayıcısı verin ve doğrulanan çağrıları `host.agentRuns` üzerinden okuyun. Bunlardan birini kullanan eklenti `^1.4.0` bildirir.

[Genel bakış](./docs/tr/overview.md#motor-ve-masaüstü-katkıları), masaüstü arayüz modüllerini, durum çubuğu görünümlerini, yerel alt süreçleri, arka plan yardımcılarını, model sağlayıcılarını ve bildirimleri de anlatır. [Katalogda yayın](./docs/tr/testing-packaging.md#genel-katalogda-imzalı-sürümler) yönetici onayı gerektirir; npm veya Git'te paket yayımlamak, eklentiyi kataloğa eklemez.

## Bu depo üzerinde çalışmak

```sh
node scripts/check-all.mjs              # her şablonu ve örneği kurar, test eder ve denetler
node scripts/check-all.mjs snippets     # yalnız birini
node scripts/sync-from-source.mjs --verify   # kopyalanan dosyalar eşitlendiği gibi duruyor mu
```

Belgeler, kitin üç şablonu ve üç örneği AGZ Code'dan eşitlenir. Açık yayına özgü belge düzeltmeleri bu depoda korunur. `synced.json` bu dosyaların özetlerini tutar. Eklenti yazmak veya yukarıdaki denetimleri çalıştırmak için özel depoya erişim gerekmez. Değişiklik önermek için bkz. [CONTRIBUTING.md](./CONTRIBUTING.md).

## Lisans

MIT. Bkz. [LICENSE](./LICENSE).
