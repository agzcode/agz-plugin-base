# Yeni bir özelliği eklenti olarak eklemek

Bu sayfa henüz var olmayan bir özelliği fikirden paketlenmiş eklentiye götürür: türü seç, araçları tasarla, şablondan kur, yinele, test et ve paketle. Döngünün ilk adımları [hızlı başlangıçta](./quickstart.md) da var; manifest [manifest sayfasında](./manifest.md).

## Karar: beceri mi, eklenti kodu mu, ikisi mi

| Özelliğin ihtiyacı | Kullan |
|---|---|
| Ajan için yönergeler (bir prosedür, kurallar, neyin ne zaman kullanılacağı) | Beceri: `SKILL.md` |
| Girdi okuyup çıktı veren, her çağrıda bir betik olarak çalışan araç | Betik araçlı beceri: `tools/<tool>.json` + `scripts/` |
| Olay kancaları, komutlar, sağlayıcılar, sanal modeller, arayüz çağrıları | Eklenti kodu |
| Motor sürecinde kalması ya da çağrılar arasında durum paylaşması gereken araç | Eklenti kodu (`registerTool`) |
| Bir MCP sunucusu bağlantısı | Eklenti kodu (`registerMcpServer`) |
| Eklenti kodunun kaydettiği araçları anlatan yönergeler | İkisi: tek pakette beceri ve eklenti |

Betik aracı her çağrıda bir süreç başlatır (30 sn ve 1 MiB çıktı sınırı) ve spesifikasyonu `mutating: false` ise sanal alanda çalışır. Eklenti kodu ana makine sürecinin içinde ana makinenin izinleriyle çalışır; küçük tut ve gözden geçir.

## Araç yüzeyini tasarla

- Aracı, onu okuyacak ajan için adlandır ve açıkla: ne yapar, birimler, sınırlar ve hata durumları. Açıklama ajanın gördüğü tek belgedir.
- Eklenti araçlarının sunumu: `direct` modele bildirilir; `codemode` her turda modele bildirilmeden Code Mode betiklerinden çağrılır; `deferred` araç aramasıyla bulunup Code Mode'dan çağrılır. Uzantı dosyasından kaydedilen ve hiçbir profilde listelenmeyen araçlar, salt okunur explorer ve verifier dahil her profile eklenir. Değişiklik yapan bir uzantı aracı kendi güvenlik denetimlerine ihtiyaç duyar; salt okunur profil bir izin sınırı değildir. Bkz. [erişim kuralları](./extension-api.md).
- Değiştirici. Beceri aracı bir şey yazıyorsa `mutating: true`, yalnız okuyorsa `false` bildirir; bildirmeyen araç değiştirici sayılır. Salt okunur ajanlar (explorer, verifier, researcher, analyst) değiştirici beceri araçlarını çağıramaz; bu yüzden okuma ve yazmayı ayrı araçlarda tut. Eklenti aracında salt okunur araca `annotations: { readOnlyHint: true }`, silen ya da üzerine yazan araca `destructiveHint: true` ver.
- Ajanın üzerinde işlem yapabileceği metin döndür. Neyin düzeltileceğini söyleyen kısa bir mesajla hata fırlat; yığın izi döndürme.
- Anahtarları paketin, manifestin ve beceri metninin dışında tut.

## İskeletle kur

plugin-dev becerisi `skill_load` ile yüklendikten sonra Code Mode'dan:

```js
const made = await tools.skill__plugin_dev__scaffold({ kind: "skill+extension", id: "notes-helper", target: "/home/me/plugins/notes-helper" });
return made.next;
```

`kind` değeri `skill`, `extension` ya da `skill+extension` olur. İskelet çalışan bir şablonu kopyalar, var olan ve boş olmayan hedefi reddeder ve sonucun manifest denetimini döndürür. skill+extension şablonunun `package.json` dosyası:

```json
{
  "name": "notes-helper",
  "version": "0.1.0",
  "description": "A starting point for a plugin.",
  "type": "module",
  "license": "MIT",
  "files": ["skills", "extensions", "README.md"],
  "agzPlugin": {
    "schemaVersion": 1,
    "id": "notes-helper",
    "name": "Notes Helper",
    "description": "A starting point for a plugin.",
    "skills": ["skills/notes-helper"],
    "extensions": ["extensions/index.ts"]
  }
}
```

Şablonun örnek aracını kendi aracınla değiştir; beceri gövdesini ve araç açıklamalarını yeniden yaz.

## Yerel klasörle yinele

1. Klasörde `manifest_check` çalıştır; `ok` olana ve dosya listeleri istediğin gibi olana kadar sürdür. Uyarılar tavsiyedir; hatalar engeller.
2. Ayarlar > Eklentiler > Eklenti kur bölümünde Yerel yol türünü seç, klasörü seç ve kur. Eklenti yerinde okunur ve Geliştirme rozetini gösterir; yenilenecek bir kopya yoktur.
3. Her düzenlemeden sonra çıkan bantta Oturumları yeniden yükle'yi kullan (meşgul oturumlar çalışmaları bitince yeniden yüklenir). Yeni oturum da güncel dosyaları yükler.
4. Oturumda aracı Code Mode'dan çağır ve gerçek çıktıyı kontrol et. Bir becerinin araçları o beceri `skill_load` ile yüklendikten sonra görünür.

## Test

Araçları ve manifesti [test ve paketleme](./testing-packaging.md) sayfasındaki gibi test et: `manifest_check`, `skill_test` ve eklenti kodu için saf mantık birim testi ile Oturumları yeniden yükle'den sonra gerçek bir çağrı.

## Paketle

Klasörde `pack_check` çalıştır: `npm pack`'in göndereceği dosyaları, bildirilen yollardan, beceri dosyalarından ya da içe aktarılan modüllerden hangilerinin eksik kaldığını listeler. Olağan neden, `package.json` içindeki bir klasörü dışarıda bırakan `files` listesidir. Yayın ve resmî katalog koşulları [test ve paketleme sayfasında](./testing-packaging.md); bir depodan kurulum [GitHub sayfasında](./github.md).
