# OpenAI Uyumlu Sağlayıcı

OpenAI uyumlu bir uç noktayı model sağlayıcısı olarak kaydeden AGZ Code eklentisi: bir adres, bir model listesi, bir
bağlam penceresi ve uç noktanın anahtarını tutan gizli ayarın adı. Eklenti bu anahtarı hiç okumaz ve hiçbir süreç
başlatmaz. Modülü SDK'nın kendi tipleriyle yazılmıştır; sözleşmenin güncel kalması için elde tutulan yerel bir kopyası
yoktur.

English: [README.md](./README.md)

## SDK 1.3.0

Yayımlanan SDK 1.3.0, `engine.providers.register()` çağrısını ve `providers` iznini içerir. SDK sürümü
`engines["agz-plugin-sdk"]` alanındaki `^1.3.0` aralığına uyan bir AGZ Code kullanın. Daha eski bir motor eklentiyi
reddeder. Motor modülü sağlayıcı API'si olmadan yüklerse modül nedeni günlüğe yazar ve kayıt yapmaz.

Sözleşme `@agz-yazilim/plugin-sdk` içinde: `PluginModelProvider` ve `PluginModelProviderModel` ana giriş noktasında,
`PluginEngineAPI`, `PluginEngineFactory` ve `PluginProviders` `unstable` giriş noktasında. Bir model `id`, `name`,
`contextWindow` ve `maxTokens` alanlarından oluşur; kapıda fiyat, girdi türü ya da akıl yürütme anahtarı için alan
yoktur, oraya yazılan bir değer yok sayılır.

## Dosyalar

- `src/engine.mjs`: motor modülü (`agzPlugin.engine`). Ayarları okur, sağlayıcıyı kaydeder, eklenti çalışırken ayarları
  izler ve motor durduğunda sağlayıcıyı kaldırır. Çalışma zamanı bağımlılığı yoktur.
- `test/openai-compatible-provider.test.mjs`: modülü, kapısı motorun kurallarını taşıyan elle kurulmuş bir motor
  üzerinde çalıştırır ve testin başlattığı yerel bir sunucuya bir sohbet isteği gönderir.

## Kayıt ayarları nasıl izler

`engine.providers.register({ id, name, baseUrl, models, secretSetting })` uç noktayı katkı olarak verir; motor,
sağlayıcı kimliğini eklentinin kimliğinden ve `id` alanından üretir. Bu modeller model seçicide *Example Gateway*
altında görünür ve başka bir sağlayıcının yerini almaz. Kayıtta anahtar yoktur: `secretSetting` bu eklentinin gizli
alanının adını verir, değerini motor her istekte okur.

- **Yanıt bağlam penceresine sığar.** `maxTokens` 4096'dır, bağlam penceresi daha küçükse o kadardır: sözleşme, bir
  yanıtın pencereden uzun olmamasını ister.
- **Adres, model kimlikleri ya da pencere değişince yeniden kaydeder.** Önce eski kayıt kaldırılır, çünkü motor aynı
  kimlikle ikinci bir sağlayıcıyı reddeder.
- **Yalnızca anahtar değişince hiçbir şey kaydedilmez.** Motor anahtarı her istekte okur ve ayarlar kaydedildikten
  sonra sağlayıcının kullanılabilirliğini yeniden denetler; yeni ya da silinmiş anahtar, duran kayıt üzerinde etkili
  olur. Boş anahtar sağlayıcıyı kullanılamaz bırakır; motor isteği anahtarsız göndermez.

## Ayarlar

| Ayar | Ne yapar |
|---|---|
| Uç nokta adresi | `https`, ya da bu makinedeki bir sunucuya `http` (`127.0.0.1`, `[::1]`, `localhost`). Kimlik bilgisi, sorgu ya da parça içeren adres reddedilir: anahtar gizli ayarlarda durur, adreste değil. |
| API anahtarı | `secret` alanı. Modül motora yalnızca adını `secretSetting` olarak verir, değerini hiç okumaz. Boş değer sağlayıcıyı kullanılamaz bırakır; anahtar istemeyen bir sunucu için `local` gibi bir yer tutucu gerekir. |
| Model kimlikleri | Uç noktanın yanıt verdiği kimlikler, virgülle ayrılmış, en çok 8 tane; her biri 1-128 harf, rakam, `.`, `_`, `:`, `/` ya da `-` içerir ve harf ya da rakamla başlar. |
| Bağlam penceresi | Listedeki her model için bir isteğin taşıyabileceği jeton sayısı. En uzun yanıt 4096 jeton, bu değer daha küçükse bu değer kadardır. |

Yeni kurulumun başladığı değerler tasarım değerleridir: `https://llm.acme.example/v1` adresi, `acme-mini-1` model
kimliği ve 32768'lik bir bağlam penceresi. Bunları uç noktanın söyledikleriyle değiştirin.

## Bu makinedeki bir sunucu

Yerel bir OpenAI uyumlu sunucu (llama.cpp, vLLM, LM Studio, Ollama) bulut hesabı ve jeton istemez:

- Uç nokta adresi: `http://127.0.0.1:8080/v1` (sunucunuzun portu).
- Model kimlikleri: sunucunun listelediği kimlikler, örneğin `qwen2.5-coder-7b-instruct` ya da
  `meta-llama/Llama-3.1-8B-Instruct`.
- API anahtarı: `local` gibi bir yer tutucu. Boş gizli değer, sunucu anahtar istemese de sağlayıcıyı kullanılamaz
  bırakır.
- Bağlam penceresi: modelin başlatıldığı değer.

## İzinler

| İzin | Nedeni |
|---|---|
| `providers` | Eklenti bir model sağlayıcısı kaydeder. Motor, bu izin olmadan `register` çağrısını reddeder. |
| `network` | Kaydettiği modellere uygulamanın dışındaki bir ana bilgisayardan erişilir. İstekleri motor yapar; eklenti yalnızca adresi verir. |
| `secrets` | API anahtarı eklentinin gizli ayarlarında durur. |

Liste, kullanıcının kurulumdan önce okuduğu şeydir; `providers` dışında eklentinin kodu bununla sınırlanmaz.

## Test

```sh
npm install --ignore-scripts
npm test          # node --test
npx agz plugin check
```

Test için hesap veya gerçek bir jeton gerekmez: bağlandığı tek uç nokta kendi başlattığı yerel bir `node:http`
sunucusudur. Test şunları kapsar: adres kuralı (her yerde https, yalnızca bu makineye http, adreste anahtar yok),
sözleşmenin tam alanlarıyla kaydedilen sağlayıcı, bağlam penceresine eşit ya da ondan küçük `maxTokens` (1024'lük bir
pencere dahil), kötü adres ya da model kimliği yokken hiçbir şeyin kaydedilmemesi, ayar aralık dışındayken tasarım
değerinin korunması, yalnızca anahtar değişince aynı kayıt, adres ya da modeller değişince yeni kayıt, motor durunca
kaldırılması, motorun kapısı olmadığı yerde yazılan günlük satırı, reddedilen kayıt, `engines` dahil manifest alanları
ve gizli ayarın anahtarıyla yerel sunucuya gönderilen bir sohbet isteği. Testin ayarlara koyduğu anahtarın kayıtta ve
günlük satırlarında hiç görünmediğini de doğrular.
