# Komut satırı

`agz plugin` komutu bir eklenti klasörünü oluşturur, denetler, test eder, paketler ve geliştirirken izler. `@agz-yazilim/plugin-kit` paketinden gelir. Şablonlar bunu geliştirme bağımlılığı olarak listeler; bu yüzden `npx agz plugin <komut>` eklenti klasörünün içinde çalışır. Şablonun `npm test` betiği `agz plugin test` komutunu çalıştırır.

Komut başarılıysa 0, değilse sıfırdan farklı bir kodla çıkar. `agz plugin --help` kullanımı yazdırır. `--integration` yalnız `test` içindir; `--engine` ise `test --integration` ve `publish` ile kullanılabilir.

## Komutlar

| Komut | Ne yapar |
|---|---|
| `agz plugin create <dizin> [--kind extension\|skill\|skill+extension] [--id <yayıncı>/<ad>]` | Verilen türün şablonundan, yeni ya da boş bir klasörde eklenti oluşturur. `--id` eklenti kimliğini verir; verilmezse kimlik klasörün adıdır. Varsayılan tür `extension`dır. |
| `agz plugin check [dizin] [--json]` | Manifest kuralları, klasörde kurulu SDK'ya karşı `engines["agz-plugin-sdk"]` aralığı, bir `tsconfig.json` varsa `tsc --noEmit` ve `npm pack`'in paketleyeceği dosyalar. |
| `agz plugin test [dizin] [--json] [--integration [--engine <yol>]]` | Motorun (engine) aralık denetimi, ardından test dosyaları üzerinde `node --test`. `--integration` ile kurulu uygulamanın motoru eklentiyi de yükler. |
| `agz plugin pack [dizin]` | Denetim, ardından `npm pack --ignore-scripts`. Tarball'un yolunu ve dosya sayısını yazdırır. |
| `agz plugin publish <spec.json> --out <belge> [--engine <yol>]` | İmzalanacak [katalog yayın belgesini](./testing-packaging.md#genel-katalogda-imzalı-sürümler) hazırlar. Belgenin ve paketin özetlerini yazar. Çevrimdışı çalışır; imzalamaz, yüklemez, yayımlamaz. |
| `agz plugin dev [dizin]` | Denetimi hemen çalıştırır, sonra klasördeki her değişiklikten sonra yeniden çalıştırır; Ctrl+C ile durur. |
| `agz plugin build-ui [dizin] [--source <dosya>]` | `agzPlugin.ui.module.entry` alanında bildirilen masaüstü arayüz modülünü derler. Varsayılan kaynak `ui/index.tsx` dosyasıdır. Geliştirme bağımlılığı olarak `esbuild` gerekir. |

`[dizin]` varsayılan olarak geçerli klasördür.

## Eklenti oluşturmak

`create`, seçilen türün şablonunu kopyalar:

- `extension`: yalnızca kod. `extensions/index.ts` bir araç, bir kanca ve fabrikayı içerir.
- `skill`: `skills/<id>` klasöründe, betikli bir aracı olan bir beceri.
- `skill+extension`: ikisi birden.

Eklentinin kimliğini `--id <yayıncı>/<ad>` ile verin, örneğin `--id acme/notes-helper`: manifest bu kimliği alır; dosya, beceri ve araç adları ad kısmından üretilir (`notes_helper_echo`). `--id` verilmezse kimlik klasörün adıdır; yani yayıncısız, çıplak bir kimlik. Yayımladığınız bir eklentinin yayıncısı olmalıdır (bkz. [manifest](./manifest.md#eklenti-kimligi)).

`agz-plugin-base` deposunda başka şablonlar da vardır; her katkı türü için bir tane (motor modülü, bildirilen MCP sunucusu, proje kapsamlı ayarlar, eklentinin veri klasörü, görünüm, kodsuz eklenti). `create` çalıştırmak yerine birinin klasörünü kopyalayın. Listesi [Örnek eklentiler](./examples.md#sablonlar) sayfasındadır.

`create` hiçbir dosyanın üzerine yazmaz: var olan ve boş olmayan bir klasörü reddeder. Sonra bu kitin ve bağlı olduğu SDK'nın sürümlerini yeni `devDependencies` içine yazar; böylece eklenti, onu oluşturan kitle test edilir. Yeni klasördeki `npm install` bu sürümleri npm'den kurar.

## Eklentiyi denetlemek

Denetim dört adım çalıştırır:

1. `manifest`: ev sahibinin uyguladığı manifest kuralları (plugin-dev becerisinin `manifest_check` aracının çalıştırdığı doğrulayıcı).
2. `engines`: `engines["agz-plugin-sdk"]` (varsayılan `^1`) ile klasörde kurulu SDK'yı karşılaştırır. SDK henüz kurulu değilse bu bir uyarıdır, hata değil.
3. `typecheck`: klasörde `tsconfig.json` varsa, klasörün kendi TypeScript'iyle `tsc --noEmit -p tsconfig.json`. Klasörde `typescript` yoksa bu adım başarısız olur.
4. `package`: yalnızca manifest geçerliyse çalışır. `npm pack`'in paketleyeceği dosyaları listeler ve manifestin ihtiyaç duyup paketin içermediği her dosyayı bildirir.

Geçen bir çalıştırma; burada `skill+extension` türündeki bir eklenti için (`extension` türü 3 dosya paketler):

```text
agz plugin check: /home/me/notes-helper
  manifest    passed
  engines     passed  agz-plugin-sdk ^1 (installed 1.5.0)
  typecheck   passed
  package     passed (9 files)
check passed
```

Hatalar denetimi başarısız kılar. Uyarılar tavsiyedir ve kılmaz. `--json` aynı sonucu `ok`, `steps`, `sdk`, `errors` ve `warnings` alanlarıyla bir rapor olarak yazdırır; betikler içindir.

## Eklentiyi test etmek

`test`, önce motorun aralık denetimini çalıştırır; sonra klasörün `test/` altındaki `*.test.ts`, `*.test.mjs` ve `*.test.js` dosyaları üzerinde `node --test` çalıştırır (alt klasörler dahil, ad sırasıyla). Hiç test dosyası olmayan bir eklenti `no test files` hatasıyla başarısız olur; test edilecek kodu olmayan, yalnız manifestin andığı dosyalardan oluşan bir eklenti `test` betiğini `agz plugin check` yapar. `--json` test çıktısını raporla birlikte yazdırır.

## Eklentiyi paketlemek

`pack`, önce denetimi çalıştırır. Denetim başarısızsa hiçbir şey paketlenmez ve hatalar yazdırılır. Aksi halde klasörde `npm pack --ignore-scripts` çalıştırır ve tarball'un yolunu ve dosya sayısını yazdırır. Tarball eklenti klasörüne yazılır.

## Geliştirirken izlemek

`dev`, denetimi hemen çalıştırır; klasördeki son değişiklikten 300 ms sonra yeniden çalıştırır. `node_modules` altındaki değişiklikleri ve `.git` gibi nokta ile başlayan klasörlerdekileri yok sayar. Ctrl+C ile durur.

Ayrıca klasörün nasıl bağlanacağını yazdırır. AGZ Code'da Ayarlar > Eklentiler'i açın ve klasörü yerel yol olarak ekleyin. Bundan sonra uygulama klasörü izler: bir dosya değiştiğinde eklentiyi yükleyen oturumları yeniden yükler. Boştaki oturumlar değişikliğin hemen ardından yenilenir; çalışan bir oturum, çalışması bitince yenilenir. Ayarlar > Eklentiler'deki Oturumları yenile düğmesi değişikliği hemen uygular.

## Tümleştirme testi

`agz plugin test --integration`, önce birim testlerini çalıştırır; sonra bir motordan eklentiyi yüklemesini ister:

```sh
npx agz plugin test --integration
npx agz plugin test --integration --engine /path/to/agz-engine
```

Motor, `--engine` yolu; yoksa `AGZ_ENGINE` değişkeni; o da yoksa şu konumlardaki ilk motordur:

- Linux: `/opt/agz-code/resources/agz-engine`, sonra bir AppImage'ın açtığı motor `~/.cache/agz-code/engine/<sürüm>/` altında (en yeni sürüm önce; `XDG_CACHE_HOME` dikkate alınır).
- macOS: `/Applications/agz-code.app/Contents/Resources/agz-engine`.
- Windows: `%LOCALAPPDATA%\agz-code\resources\agz-engine.exe`.

Hiçbir motor bulunamazsa `test --integration`, birim testleri çalışmadan önce başarısız olur ve baktığı yolları listeler. `plugin-check` komutundan önceki bir motor, uygulamayı güncellemeniz istenerek reddedilir.

Motor, klasörü geçici bir ajan dizinine yerel yol paketi olarak yükler. Oturum, model, ağ ve sunucu yoktur. Eklentinin kaydettiklerini (araçlar, komutlar, görünümler, ayarlar, beceriler ve istemler) ve her sorunu bildirir. MCP sunucularını da bildirir; her birini taşıma türüyle ve manifestte mi bildirildiği yoksa koddan mı kaydedildiğiyle. Motor modülünü de bildirir: motor modülü içe aktarır ve varsayılan dışa aktarımı bir işlev değilse hata verir. Fabrika çağrılmaz; yani hiçbir arka plan işi başlamaz. Tümleştirme, motor 0 ile çıktığında geçer; yani hiçbir sorunun düzeyi `error` değilse.
