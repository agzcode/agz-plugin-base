# Beceri eklentileri

Beceri, ajanlara bir yöntem öğreten `SKILL.md` içeren klasördür; isteğe bağlı olarak araçlar, betikler ve örnekler taşır. Beceri eklentisi, manifestin `skills` alanıyla bir ya da birkaç beceri yayımlar. Uzantı koduna gerek duymaz. Beceri biçiminin kendisi skill-creator becerisinin konusudur; bu sayfa eklenti yazarının ihtiyacını anlatır.

## Dizin düzeni

```
my-plugin/
  package.json                      agzPlugin.skills: ["skills/my-plugin"]
  skills/my-plugin/
    SKILL.md                        frontmatter ve gövde
    tools/count_words.json          her dosyada bir araç tanımı
    scripts/count_words.mjs         aracın giriş noktası
    examples/two-lines.json         araç başına bir örnek, toplamda en az üç
    references/  assets/            isteğe bağlı belgeler ve veri
```

Beceri şablonundan manifest:

```json
{
	"name": "my-plugin",
	"version": "0.1.0",
	"description": "A starting point for a plugin.",
	"type": "module",
	"license": "MIT",
	"files": ["skills", "README.md"],
	"engines": {
		"agz-plugin-sdk": "^1"
	},
	"scripts": {
		"test": "agz plugin test"
	},
	"devDependencies": {
		"@agz-yazilim/plugin-kit": "1.3.0",
		"@agz-yazilim/plugin-sdk": "1.3.0",
		"@types/node": "22.19.19",
		"typescript": "7.0.2"
	},
	"agzPlugin": {
		"schemaVersion": 1,
		"id": "my-plugin",
		"name": "My Plugin",
		"description": "A starting point for a plugin.",
		"skills": ["skills/my-plugin"]
	}
}
```

Becerinin ihtiyaç duyduğu her şeyi pakete koy: betikler, referanslar, varlıklar ve lisanslar. Beceri içindeki göreli yollar paketlendikten sonra da çalışmalıdır. `pack_check`, bildirilen beceri klasörünün npm'in dışarıda bıraktığı her dosyasını işaretler.

## SKILL.md

```md
---
name: my-plugin
description: 'A starting point for a plugin.'
metadata:
  version: 0.1.0
  agz-kind: routed
---

# My Plugin

Replace this body with the procedure agents should follow. Name the tools, say when to use them and what a good result looks like.

Call `count_words({text})` to count the words, lines and characters of a text. It reads nothing from disk and changes nothing.
```

| Alan | Kural |
|---|---|
| `name` | Zorunlu. Tire ile bağlı küçük harfli sözcükler, en çok 64 karakter. Klasör adına eşit olmalıdır. |
| `description` | Zorunlu, en çok 1024 karakter. Becerinin ne yaptığını söyle; kullanıcıların kendi dillerinde yazdığı ifadelerle `Use when ...` ve `Not for ...` ekle. Yönlendirici bunu okur. |
| `metadata.version` | `1`, `1.2` ya da `1.2.3` gibi. Paketi değiştirdiğinde yükselt. |
| `metadata.agz-kind` | `routed` (varsayılan) ya da `direct`. Ajanlar routed becerisini skill_route ile bulur, skill_load ile yükler. |

Gövdeyi 500 satırın altında tut. Ayrıntıyı `references/` içine koy.

Daha güçlü bir yerde aynı ada sahip beceri kazanır: yerleşik, genel, proje sırasıyla. Kaybeden gölgelenmiş olarak bildirilir ve yüklenmez.

## Araçlar

Araç tanımı `tools/<araç>.json` dosyasıdır. Dosya adı (`.json`'sız) `name` alanına eşit olur.

```json
{
	"name": "count_words",
	"description": "Count the words, lines and characters of a text. Words are runs of non-space characters, lines are separated by line breaks, characters are Unicode code points. Fails when text is missing or longer than 200000 characters.",
	"surface": "codemode",
	"mutating": false,
	"input": {
		"type": "object",
		"properties": { "text": { "type": "string", "maxLength": 200000, "description": "The text to count." } },
		"required": ["text"],
		"additionalProperties": false
	},
	"output": {
		"type": "object",
		"properties": {
			"words": { "type": "integer" },
			"lines": { "type": "integer" },
			"characters": { "type": "integer" }
		},
		"required": ["words", "lines", "characters"]
	},
	"run": { "kind": "script", "entry": "count_words.mjs" }
}
```

| Alan | Kural |
|---|---|
| `name` | `^[a-z][a-z0-9_]*$`, en çok 40 karakter. |
| `description` | Zorunlu. Ajanlar okur: birimleri, sınırları ve hata durumlarını yaz. |
| `mutating` | Her araçta bildir. Bir şey yazan araç için `true`, yalnız okuyan için `false`. Salt okunur ajanlar `mutating` araç çağıramaz. |
| `input` | Üst düzeyi `"type": "object"` olan JSON Schema. |
| `output` | JSON Schema. Nesne şeması, Code Mode çağrılarının nesneye çözülmesini sağlar. |
| `run` | `{ "kind": "script" ya da "module", "entry": "<dosya>" }`. Giriş `scripts/` klasörüne göreli olur ve paketin içinde kalmalıdır. |

Şema alt kümesi: `type`, `enum`, `const`, `properties`, `required`, `additionalProperties`, `items`, `minItems`, `maxItems`, `minLength`, `maxLength`, `pattern`, `minimum`, `maximum`, `anyOf`, `oneOf` ve `allOf`. `$ref` ve çok şemalı `items` reddedilir. Çalışma zamanı girdiyi çalıştırmadan önce, çıktıyı çalıştırdıktan sonra denetler.

### Betik araçları

Betik, çağrı başına bir alt süreç olarak çalışır. Giriş `.mjs`, `.py` ya da `.sh` olur. Girdi stdin'den tek JSON belgesi olarak gelir. stdout'a tek JSON belgesi yaz, günlükleri stderr'e yaz. Sıfır olmayan çıkış koduyla ve neyin düzeltileceğini söyleyen iletiyle başarısız ol. Çağrı 30 saniye ve 1 MiB çıktıyla sınırlıdır. Paketin kendi dosyalarını `AGZ_SKILL_DIR` ortam değişkeniyle oku; çalışma dizini kullanıcının projesidir.

```js
import { readFileSync } from "node:fs";

const { text } = JSON.parse(readFileSync(0, "utf8"));
const trimmed = text.trim();
process.stdout.write(
	JSON.stringify({
		words: trimmed === "" ? 0 : trimmed.split(/\s+/).length,
		lines: text === "" ? 0 : text.split(/\r?\n/).length,
		characters: [...text].length,
	}),
);
```

### Modül araçları

Modül aracı, `execute(input, context)` dışa aktaran bir `.mjs` ya da `.js` dosyasıdır. Motor sürecinin içinde çalışır; bu yüzden yalnız Node yerleşiklerini kullanabilir, bloklamamalı ve çıkmamalıdır. Proje becerisinde modül aracı reddedilir (`module-project-scope`). Kullanıcı kapsamlı eklentinin becerisi genel beceri olarak, proje kapsamlı eklentinin becerisi proje becerisi olarak yüklenir; yani proje kapsamlı eklenti modül aracı taşıyamaz. Betik araçlarını tercih et: süreç başına yalıtılırlar ve her kapsamda çalışırlar.

## Örnekler

Her araç için `examples/` içinde bir örnek gerekir. Araçlı becerinin en az üç geçen örneği ve her araç için bir örneği olmalıdır.

```json
{ "tool": "count_words", "name": "two lines", "input": { "text": "Hello world.\nSecond line here." }, "expected": { "words": 5, "lines": 2, "characters": 30 } }
```

`input`, aracın girdi şemasına uymalıdır. `expected` yalnız denetlemek istediğin alanları içerebilir.

## Becerinin araçlarını çağırmak

Beceri için skill_load yapıldıktan sonra ajanlar araçlarını Code Mode'dan `skill__<skill>__<araç>` olarak çağırır; beceri adındaki tireler alt çizgi olur:

```js
const counted = await tools.skill__my_plugin__count_words({ text: "one two three" });
return counted.words;
```

Araç, çıktı nesnesine çözülür. Hata `skill__<skill>__<araç>: <hata>` iletisiyle reddedilir. Code Mode olmayan ajanlar `skill_execute({ skill, tool, input })` kullanır.

## Test ve değerlendirme

skill-creator becerisinin Code Mode araçları beceriyi denetler: `tools.skill_test({ skill })` paketi doğrular ve her örneği çalıştırır; `tools.skill_eval({ skill, cases })` ihtiyaç ifadelerinin beceriyi ilk üçe yerleştirdiğini denetler. Motorun plugin-dev testi, iskeleti kurulan şablonlarda aynı paket denetimini (`testSkillPackage`) çalıştırır.

## Yayımla

1. Beceri klasörünü `agzPlugin.skills` içinde bildir.
2. `manifest_check` çalıştır: `skills` listesinde `SKILL.md` yolu görünmeli.
3. `pack_check` çalıştır ve her `missing` girdisini düzelt.
4. Paketi bağla ya da yayımla (bkz. [hızlı başlangıç](./quickstart.md)).

Eklentide kanca, komut ya da MCP sunucusu da gerekiyorsa `extensions` ekle (bkz. [eklenti kodu API'si](./extension-api.md)). Birkaç beceri eklemek için her klasörü ya da `skills/*` gibi bir glob'u listele (bkz. [manifest](./manifest.md)).
