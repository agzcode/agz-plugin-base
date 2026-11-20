# Git'teki bir projeyi eklentiye çevirmek

Komut satırı aracı ya da kütüphanesi olan bir deponun var ve ajanların onu kullanmasını istiyorsun. Bir manifest ve ince bir sarmalayıcı eklersin; projeyi taşımaz, yeniden yazmazsın. Bu sayfa küçük bir proje kullanır: `line-count`, CLI'ı bir dosyanın satır sayısını JSON olarak yazar. Adımlar baştan sona çalıştırıldı; bir depodan kurulum ve güncellemeler dahil ([GitHub sayfası](./github.md)).

## 1. Yerel klonda çalış

```
line-count/
  package.json
  bin/line-count.mjs
  src/count-lines.mjs
```

## 2. İskeletin convert kipiyle manifest ekle

Önce kaynakları oluştur (3. ve 4. adımlar), sonra Code Mode'dan:

```js
await tools.skill__plugin_dev__scaffold({ kind: "convert", id: "line-count", target: "/home/me/src/line-count" });
```

Convert yalnız `agzPlugin` anahtarını `package.json` dosyasına yazar, diğer alanları korur, `SKILL.md`, `skills/`, `extensions/`, `prompts/`, `themes/` ve `agents/` öğelerini bulur ve sonuç doğrulanmazsa dosyayı geri koyar. `agzPlugin` zaten varsa ya da bildirilecek bir şey yoksa başarısız olur. Bu proje için şunu yazdı:

```json
{
  "agzPlugin": {
    "schemaVersion": 1,
    "id": "line-count",
    "extensions": ["extensions"],
    "skills": ["skills"]
  }
}
```

`package.json` dosyasına ayrıca bir `files` listesi ekle, örneğin `["bin", "src", "extensions", "skills"]`. Olmazsa npm, yok sayılmayan her dosyayı, testler ve örnekler dahil, pakete koyar.

## 3. CLI'ı araç olarak sar

Bir eklenti aracı CLI'ı `agz.exec(command, args, options)` ile çalıştırır; bu çağrı `{ stdout, stderr, code, killed }` döndürür. `extensions/index.ts` dosyası:

```ts
import { fileURLToPath } from "node:url";
import { defineTool, type PluginAPI, Type } from "@agz-yazilim/plugin-sdk";

// The project's CLI, found from this file: <package>/extensions/index.ts -> <package>/bin/line-count.mjs.
const cli = fileURLToPath(new URL("../bin/line-count.mjs", import.meta.url));

export default function (agz: PluginAPI) {
  agz.registerTool(
    defineTool({
      name: "line_count",
      label: "Line count",
      description:
        "Count the lines of a text file by running the line-count CLI with node. The path is relative to the working directory. Reads the file and changes nothing. Fails when the CLI exits with an error, for example when the file does not exist.",
      parameters: Type.Object({ path: Type.String({ description: "File to count." }) }),
      exposure: "codemode",
      annotations: { readOnlyHint: true },
      execute: async (_toolCallId, params, signal, _onUpdate, ctx) => {
        const result = await agz.exec("node", [cli, params.path], { cwd: ctx.cwd, signal, timeout: 30_000 });
        if (result.code !== 0) throw new Error(result.stderr.trim() || `line-count exited with ${result.code}`);
        return { content: [{ type: "text", text: result.stdout.trim() }], details: {} };
      },
    }),
  );
}
```

Oturumun çalışma dizininde (`ctx.cwd`) çalıştır, iptal `signal` değerini ilet, bir `timeout` ver ve sıfır olmayan çıkışı kısa bir hataya çevir. Çalıştırmada eksik bir dosya `line-count: cannot read nope.txt: ENOENT` araç hatasını verdi, çünkü CLI stderr'e tek ve açık bir satır yazıyor; yığın iziyle çöken bir CLI ajana bütün izi verir, bu yüzden CLI'ın (ya da sarmalayıcının) tek satır yazmasını sağla.

Komut kullanıcının makinesinde bulunmalı: burada `node`, ya da CLI'ın kendi ikilisi PATH'te. Masaüstü uygulamasının motoru `node` değildir; ön koşulu araç açıklamasında ve README'de belirt.

Ajanların aracı ne zaman kullanacağını bilmesi için yönerge becerisi ekle. `skills/line-count/SKILL.md` dosyası:

```markdown
---
name: line-count
description: 'Count the lines of a text file with the line-count project. Use when asked how many lines a file has, or: dosya kaç satır, satır say.'
metadata:
  version: 0.1.0
  agz-kind: routed
---

# Line count

Call `line_count({path})` from Code Mode to count the lines of a text file. The path is relative to the working directory. The tool reads the file and changes nothing; a final line break does not add a line. When it fails, the message says why (for example `cannot read nope.txt: ENOENT`).
```

### Alternatif: beceri betik aracı

Bir beceri aracı (`tools/<tool>.json` ve `scripts/` içinde betik), PATH'teki bir programı ya da beceri klasörünün içinde yaşayan mantığı sarmak için de çalışır. Betik motorun kendi çalışma zamanında koşar. Çalıştırmada görülen iki sınır: projenin kodunu beceri klasörünün dışından içe aktaran betik (`AGZ_SKILL_DIR/../../src/...`) oturumda çalışır ama `skill_test`'te başarısız olur; çünkü `skill_test` beceriyi yalnız beceri klasörünü içeren bir sanal alanda çalıştırır (`ERR_MODULE_NOT_FOUND`); araçlı bir beceri en az 3 geçen örnek ister. Deponun kendi kodunu sarmak için yukarıdaki eklentiyi tercih et.

## 4. Denetle

Klondaki `manifest_check`, `extensions/index.ts` ve `skills/line-count/SKILL.md` ile `ok: true` döndürdü. `pack_check` `npm pack`'in gönderdiği dosyaları listeledi; `files` listesi yokken `sample.txt` dosyasını da listeledi, eksik `files` alanı böyle belli olur.

Yalıtılmış bir ana makinede eklenti yerel yol olarak kuruldu: Code Mode'dan `line_count({path: "work/sample.txt"})` `{"file":"work/sample.txt","lines":3}` döndürdü.

## Bağımlılıklar ve kurulum betikleri

Eklenti Git'ten kurulduğunda motor depoyu klonlar, ref'i çıkarır ve `package.json` varsa içinde `npm install --omit=dev --legacy-peer-deps` çalıştırır; kullanıcı kurulum betiklerini çalıştırmayı seçmediyse `--ignore-scripts` de eklenir. Sonuçları:

- Çalışma zamanı bağımlılıkları `dependencies` içine girer. `devDependencies` kurulmaz; bu yüzden onlara ihtiyaç duyan bir derleme adımı kullanıcının makinesinde çalışamaz: derlenmiş çıktıyı commit'le. `prepare` içindeki derleme yalnız kullanıcı kurulum betiklerini çalıştırmayı seçtiğinde çalışır.
- Yaşam döngüsü betikleri varsayılan olarak çalışmaz: kurulum `--ignore-scripts` ile yapılır, bu yüzden bir `prepare` betiği çalışmaz. Kullanıcı onay penceresinde "Kurulum betiklerini çalıştır" seçeneğini işaretleyebilir (API'de `runScripts: true`). O zaman betikler kurulumda ve her güncellemede çalışır; betiklerin kullanıcının makinesinde güvenle çalışması gerekir. Kurulum ve güncelleme, betikler ne olursa olsun, kullanıcının onayını ister; çünkü eklenti kodu her oturumda yüklendiğinde çalışır.
- `@agz-yazilim/plugin-sdk` paketine bağımlı olma; ana makine sağlar.
- Güncelleme, yeniden kurmadan önce `git clean -fdx` çalıştırır; bu yüzden çıkışta takip edilmeyen dosyalar (bir kilit dosyası, elle yapılmış dosya) silinir; yalnız depo ve kurulum betiklerinin ürettikleri kalır.

## 5. GitHub'dan kur

Bir sürüm etiketle, sonra Ayarlar > Eklentiler > Eklenti kur bölümünde GitHub'ı seç, `owner/line-count` ve `v1.0.0` ref'ini gir. Kaynak biçimleri, sabitleme ve güncellemeler [GitHub sayfasında](./github.md). Paketlenmiş sonucu [test ve paketleme](./testing-packaging.md) sayfasındaki gibi dene.
