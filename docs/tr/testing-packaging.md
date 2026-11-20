# Test, paketleme ve yayın

Manifesti denetle, nelerin gönderildiğini denetle, araçları test et, sonra yayımla. Aşağıdaki her denetim plugin-dev becerisinin bir aracı ya da kendin çalıştırabileceğin bir komuttur.

## Manifesti denetle: manifest_check

```js
const result = await tools.skill__plugin_dev__manifest_check({ path: "/home/me/plugins/notes-helper" });
return result;
```

Manifesti yükleyicinin kendi kurallarıyla doğrular ve her kaynak alanının hangi dosyalara çözüldüğünü listeler. Yükleyici ilkinde dururken o bütün hataları döndürür: `ok`, `errors`, `warnings`, `resources`. Manifesti olmayan klasör `ok: false` döndürür. Uyarılar yükleyicinin zorlamadığı tavsiyelerdir (klasöründen farklı bir beceri adı, eksik açıklama, uzantıda varsayılan dışa aktarım olmaması, paket adı ya da sürümü olmaması). Hataları düzelt; uyarıları oku.

## Nelerin gönderildiğini denetle: pack_check

```js
const packed = await tools.skill__plugin_dev__pack_check({ path: "/home/me/plugins/notes-helper" });
return { ok: packed.ok, files: packed.files, missing: packed.missing };
```

`npm pack --dry-run --json --ignore-scripts` çalıştırır ve dosya listesini manifestle karşılaştırır: `missing`, paketin dışarıda bırakacağı bildirilmiş kaynak dosyalarını, bildirilmiş bir beceri klasörünün dosyalarını ve uzantı dosyalarının göreli importlarını listeler. Olağan neden, bir klasörü atlayan `package.json` `files` listesidir. Manifest geçersizse erken döner.

## Beceri araçlarını test et

- `tools.skill_test({skill: "<name>"})` paketi doğrular ve her örneği geçici bir dizinde çalıştırır. Araçlı bir beceri en az 3 geçen örnek ve araç başına bir örnek ister. Beceriyi yalnız beceri klasörünü içeren bir sanal alanda çalıştırır: betikler onun dışındaki dosyaları içe aktarmamalı. Node betiği örnekleri, PATH'te bulunursa ana makinenin `node` ve `npm` programlarını da alır; böylece `pack_check` gibi bir araç `npm` çalıştırabilir. Bu, standart düzende çalışır (`<prefix>/bin/npm`, `<prefix>/lib/node_modules/npm` içine işaret eder; nvm, tar arşivi ve CI araç önbelleği kurulumlarındaki gibi); shim'ler (volta, asdf) ve bölünmüş kurulumlar (Debian'ın apt npm'i) desteklenmez. Sanal alanda yine ağ yoktur ve geçici alanı dışında yazılamaz.
- `tools.skill_eval({skill: "<name>", cases: [...]})` ihtiyacın en çok 12 ifadesini sözcük tabanlı yönlendiriciden geçirir ve becerinin birinci ya da ilk 3 içinde olup olmadığını bildirir. İfadeleri kullanıcıların kullandığı sözcüklerle, becerinin hedeflediği her dilde yaz.
- İkisi de eklenti kurulduktan ve özgün kopyası kalktıktan sonra eklentinin becerisini adıyla bulur. Biçim skill-creator becerisinin `references/format.md` dosyasındadır.

## Eklenti kodunu test et

- Mantığı `@agz-yazilim/plugin-sdk` içe aktarmayan bir modüle koy ve `node --test` ile birim testi yaz; `extensions/index.ts` dosyasını ince tut. SDK'yı ana makine sağlar ve düz bir Node testi onu içe aktaramaz.
- Gerçek kaydı bir oturumda test et: klasörü bağla, Oturumları yeniden yükle, sonra aracı Code Mode'dan iyi bir girdiyle, kötü bir girdiyle ve açıklamasında yazdığın hata durumuyla çağır. line-count örneği iyi çağrı için `{"file":"work/sample.txt","lines":3}`, kötü çağrı için `line-count: cannot read nope.txt: ENOENT` araç hatasını döndürdü.
- Birim testlerinde [kitin sahte ev sahibini ve sahte motorunu](./testing.md) kullan. Eklentinin [kurulu uygulamanın motorunda](./cli.md) yüklendiğini doğrulamak için `npx agz plugin test --integration` çalıştır. Bu denetim bir modele istek göndermez veya çalışan bir oturumu test etmez.

## Paketle

Kendi eklentin için:

```sh
npx agz plugin pack
```

`pack_check`'in listelediği dosyaların tamamını içeren `<name>-<version>.tgz` yazar. Denemek için arşivi aç ve `package/` klasörünü yerel yol olarak kur; arşivin kendisi bir kurulum kaynağı değildir. Paketlenmiş kopya, klasörde çalışıp arşivde eksik kalan betikleri ya da varlıkları yakalar.

Kit, `npm pack --ignore-scripts` çalıştırmadan önce manifesti, SDK aralığını, türleri ve paket içeriğini denetler. Arşivi yayımlamaz.

## Sürümleme

`package.json` içinde anlamsal sürümler kullan: düzeltme için yama, yeni araç ya da seçenek için minör, değişen araç girdisi ya da çıktısı için majör. Beceri içeriği değişince kendi `metadata.version` değerini aynı şekilde yükseltir. Her sürümü Git'te etiketle (`v1.2.0`) ki kullanıcılar sabitleyebilsin ([GitHub sayfası](./github.md)); `npm:<package>@1.2.0` npm kaynağı aynı şekilde sabitlenir, sabitlenmemiş npm ya da Git kaynağı Güncelle düğmesiyle güncellenir.

## Genel katalogda imzalı sürümler

Kataloğa doğrudan yayın yapılamaz: katalog yöneticisi yayıncıyı doğrular ve her sürümü ayrı onaylar. Eklentini kataloğa eklemeden de [desteklenen başka bir kurulum kaynağından](./overview.md#kaynaklar-ve-kapsam) dağıtabilirsin.

1. Katalog yöneticisinden yayıncı adını doğrulamasını ve katalog anahtarını manifest kimliğine bağlamasını iste. İmza anahtarının parmak izini ayrı bir kanalda teyit et. Yöneticinin tek kullanımlık doğrulamasını aday anahtarla imzala. Özel anahtar yayıncıda kalır; kayıt servisine veya pakete konmaz.
2. Kullanıcının alacağı tam paketi seç. npm için kayıt sunucusunun dağıttığı arşivi; Git için yerel depodaki tam commit kimliğini ve standart HTTPS depo adresini kullan. Özel npm veya Git kaynağına kullanıcı kendi hesabıyla erişir. Doğrudan arşiv için kimlik bilgisi, sorgu veya yönlendirme içermeyen sabit bir genel HTTPS adresi kullan. Git ve doğrudan HTTPS arşivi, çalışma zamanı bağımlılığı olmayan derlenmiş paketi içermeli. npm bağımlılık bildirebilir fakat `node_modules` taşıyamaz. Motor imzalı sürümlerde kurulum betiklerini çalıştırmaz.
3. İmzalanacak baytları `npx agz plugin publish release-spec.json --out release.json` ile yerelde hazırla. Girdide `handle`, `keyGeneration`, `pluginKey`, `pluginId`, `version`, `serial`, `source`, `artifact` (yerel arşiv veya Git deposu) ve `publicKey` (yerel Minisign `.pub` dosyası) bulunur. `source`, `{kind:"npm",registry,package}`, `{kind:"git",url,commit}` veya `{kind:"https",url}` biçimindedir. Hem sürüm hem sıra numarası artmalı. Komut manifesti denetler; paketin ve `release.json` dosyasının özetlerini ayrı yazar. İmzalamaz, yüklemez ve motor sunucusunu başlatmaz.
4. Değiştirmediğin `release.json` dosyasını Minisign özel anahtarınla ve `version:agz.catalog.release.v1:<serial>` güvenilen yorumuyla imzala (`<serial>` yerine sıra numarasını yaz). Belgeyi ve imzayı katalog yöneticisinin yayın sürecinden gönder. Yönetici tam o belgeyi onaylayana kadar yayın bekler.
5. Pakete erişimi olan başka bir motorda dene. Ayarlar > Eklentiler'de imzalı sürümü denetle; sonra sürümü, sıra numarasını, belge özetini ve izinleri inceleyerek onay ver. Belge özeti paket özeti değildir. Onaydan sonra yayın değişirse motor kurulumu iptal eder; imzasız kaynağı denemez.
