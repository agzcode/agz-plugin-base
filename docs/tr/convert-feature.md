# Var olan bir özelliği eklentiye çevirmek

Çalışan bir özelliğin var: bir beceri, bir proje aracı, bir MCP sunucusu kurulumu ya da özel bir ajan. Bunu eklenti paketine taşımak onu tek yerden kurulabilir, bir bütün olarak açılıp kapatılabilir (Ayarlar > Eklentiler), güncellenebilir ve paylaşılabilir yapar. Bu sayfa her durum için önceki ve sonraki dosya düzenini ve taşımanın nasıl doğrulanacağını verir. Manifest alanları [manifest sayfasında](./manifest.md), kod API'si [eklenti kodu API'si sayfasında](./extension-api.md), araçlı beceriler [beceri eklentilerinde](./skill-plugins.md) anlatılır.

## Her durumda geçerli kurallar

- Eklentiyi özgün konumların dışında yeni bir klasörde kur, örneğin `~/plugins/<id>`. Eklenti doğrulanana kadar aslını koru, sonra aslını kaldır (sonraki madde).
- Asıl ile eklenti aynı şeyi birlikte sağlamamalı. `~/.agz-code/skills` ya da `<project>/.agz-code/skills` altındaki aynı adlı beceri kazanır, eklentinin kopyası `shadowed` olarak bildirilir. `mcp.json` içindeki aynı adlı MCP sunucusu kayıt edilene baskın gelir. `agents/` altındaki özel ajan dosyası paketinkine baskın gelir. Eklentiyi denemeden önce aslını yoldan çek.
- Her kaynağı `agzPlugin` içinde bildir ve her değişiklikten sonra `manifest_check` çalıştır. Hiçbir dosyayla eşleşmeyen bir yol yükleme hatasıdır.
- Adımları plugin-dev becerisi `skill_load` ile yüklendikten sonra Code Mode'dan çalıştır: `tools.skill__plugin_dev__scaffold({kind: "convert", id: "<id>", target: "<folder>"})` kaynakları zaten içeren bir klasörün `package.json` dosyasına `agzPlugin` anahtarını ekler (`skills/`, `extensions/`, `prompts/`, `themes/`, `agents/` klasörlerini kendisi bulur), `tools.skill__plugin_dev__manifest_check({path: "<folder>"})` onu doğrular.

## Bir beceri

Önce, beceri klasörü bir beceri kökünde durur:

```
~/.agz-code/skills/release-notes/
  SKILL.md
  tools/draft.json
  scripts/draft.mjs
  examples/basic.json
```

Sonra, aynı klasör bütün olarak paketin `skills/` altına taşınır:

```
~/plugins/release-notes/
  package.json
  skills/release-notes/
    SKILL.md
    tools/draft.json
    scripts/draft.mjs
    examples/basic.json
```

`package.json` içindeki manifest:

```json
{
  "name": "release-notes",
  "version": "1.0.0",
  "files": ["skills"],
  "agzPlugin": {
    "schemaVersion": 1,
    "id": "release-notes",
    "skills": ["skills/release-notes"]
  }
}
```

Davranışta ne değişir:

- Kapsam. Kullanıcı kapsamına kurulan eklenti becerisi her projede genel beceri olarak sunar. Proje kapsamına kurulan eklenti onu proje becerisi olarak sunar: yalnız güvenilen projede ve yalnız betik araçlarıyla (modül araçları proje becerilerinde reddedilir).
- Açma kapama. Eklenti, Ayarlar > Eklentiler'de kendi anahtarı, güncelleme ve kaldırma düğmesi olan tek satırdır. Kapatınca beceri yönlendirmeden ve yüklemeden çıkar.
- Öncelik. Beceri kökleri şu sırayla okunur: yerleşik, `~/.agz-code/skills`, açılmış diğer klasörler, proje kökleri, en son eklenti becerileri. Eklentinin kopyası sunulsun diye aslını kaldır.
- Yollar. Betik paket dosyalarını `AGZ_SKILL_DIR` ile okur; beceri taşınınca içinde bir şey değişmez.

Doğrulama:

1. Eklenti klasöründe `manifest_check`, `ok: true` ve `resources.skills` altında `skills/release-notes/SKILL.md` döndürür.
2. Aslını beceri kökünden çıkar, eklenti klasörünü yerel yol olarak bağla ([hızlı başlangıç](./quickstart.md)) ve Oturumları yeniden yükle'yi kullan.
3. Yeni oturumda beceriyi skill_load ile yükle, araçlarından birini Code Mode'dan çağır; çıktıyı aslının verdiğiyle karşılaştır.
4. Eklenti kurulduktan sonra `tools.skill_test({skill: "release-notes"})` paketi doğrular ve örneklerini çalıştırır (ayrıntı [test ve paketleme](./testing-packaging.md) sayfasında).

## Bir proje uzantısı

Önce, `.agz-code/tools/` altındaki bir dosya ya da klasör uzantı olarak yüklenir:

```
<project>/.agz-code/tools/line-count.ts
```

```ts
import { Type } from "@earendil-works/pi-coding-agent";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "line_count",
    label: "Line count",
    description: "Count the lines of a text.",
    parameters: Type.Object({ text: Type.String() }),
    execute: async (_id, params) => ({ content: [{ type: "text", text: String(params.text.split("\n").length) }], details: {} }),
  });
}
```

Sonra dosya bir paketin `extensions/index.ts` yerine taşınır ve importu ana makinenin sağladığı SDK olur:

```
~/plugins/line-count/
  package.json
  extensions/index.ts
```

```ts
import { defineTool, type PluginAPI, Type } from "@agz-yazilim/plugin-sdk";

export default function (agz: PluginAPI) {
  agz.registerTool(
    defineTool({
      name: "line_count",
      label: "Line count",
      description: "Count the lines of a text. Returns the number as text. Changes nothing.",
      parameters: Type.Object({ text: Type.String() }),
      exposure: "codemode",
      annotations: { readOnlyHint: true },
      execute: async (_id, params) => ({ content: [{ type: "text", text: String(params.text.split("\n").length) }], details: {} }),
    }),
  );
}
```

```json
{
  "name": "line-count",
  "version": "1.0.0",
  "files": ["extensions"],
  "agzPlugin": {
    "schemaVersion": 1,
    "id": "line-count",
    "extensions": ["extensions/index.ts"]
  }
}
```

Davranışta ne değişir:

- Güven. `<project>/.agz-code/tools/` altındaki dosya yalnız güvenilen projede yüklenir. Kullanıcı kapsamındaki eklenti her projede yüklenir, yani kodu çalıştığın her yerde çalışır; proje kapsamındaki eklenti güvenilen proje kuralını korur.
- Eski `@earendil-works/pi-coding-agent` importu hâlâ çözülür, ama yeni kod `@agz-yazilim/plugin-sdk` kullanır; bunu bağımlılık olarak ekleme, ana makine sağlar.
- Sunum. Her araca `exposure` ver: `direct` modele bildirilir; `codemode` Code Mode betiklerinden çağrılır; `deferred` araç aramasıyla bulunup Code Mode'dan çağrılır. Uzantı dosyasından kaydedilen ve hiçbir profilde listelenmeyen araçlar, salt okunur explorer ve verifier dahil her profile eklenir. Değişiklik yapan araçları kendi güvenlik denetimleriyle tasarla; bkz. [erişim kuralları](./extension-api.md).
- Asıl dosyayı kaldır; aynı araç adının iki kaydı çakışır.
- Satır güncelleme ve kaldırma kazanır. `tools/` altındaki serbest dosya yalnız kapatılabilir.

Doğrulama: `manifest_check` `extensions/index.ts` dosyasını listeler; Oturumları yeniden yükle'den sonra Code Mode'da `await tools.line_count({text: "a\nb"})` `2` döndürür.

## Bir MCP sunucusu kurulumu

Önce, sunucu `<project>/.agz-code/mcp.json` içinde (ya da agz.json'un `mcp` bölümünde) tanımlıdır:

```json
{
  "mcpServers": {
    "docs": { "command": "npx", "args": ["-y", "@example/docs-mcp"], "env": { "DOCS_TOKEN": "${DOCS_TOKEN}" } }
  }
}
```

Sonra bir uzantı aynı ayarı `registerMcpServer` ile kaydeder; ayar nesnesi bir `mcpServers` girdisiyle aynı biçimdedir:

```ts
import type { PluginAPI } from "@agz-yazilim/plugin-sdk";

export default function (agz: PluginAPI) {
  agz.registerMcpServer("docs", {
    command: "npx",
    args: ["-y", "@example/docs-mcp"],
    env: { DOCS_TOKEN: "${DOCS_TOKEN}" },
    description: "Search the example documentation.",
    exposure: "codemode",
  });
}
```

```json
{
  "name": "docs-mcp-plugin",
  "version": "1.0.0",
  "files": ["extensions"],
  "agzPlugin": { "schemaVersion": 1, "id": "docs-mcp", "extensions": ["extensions/index.ts"] }
}
```

Davranışta ne değişir:

- Kayıt saklanmaz: uzantı sunucuyu her yüklemede kaydeder, yani sunucu eklenti açık olduğu sürece vardır. Eklentiyi kapatmak sunucuyu kaldırır.
- Aynı adlı yapılandırılmış sunucu kazanır. Önce `docs` girdisini `mcp.json` ya da agz.json'dan sil.
- Anahtarları paketin dışında tut. Değerler ortam değişkenlerine `${NAME}` ile başvurabilir; kullanıcı bunları kendi ortamında tanımlar.
- Sunucu pakette gelen bir betikse yolunu uzantı dosyasından mutlak olarak ver: `fileURLToPath(new URL("../server/mcp.mjs", import.meta.url))`. Göreli bir `cwd` ya da yol paketin değil oturumun çalışma dizinine göre çözülür. Komut (`node`, `npx`) kullanıcının makinesinde bulunmalı.

Doğrulama: Oturumları yeniden yükle'den sonra sunucunun araçları, sunucuya erişimi olan bir ajan için `mcp__docs__<tool>` adıyla görünür; erişimi olmayan ajan için sunucu başlatılmaz ve araçları listelenmez (kural için eklenti kodu API'si sayfasının MCP sunucuları bölümüne bakın). Code Mode'da `await searchTools("docs")` onları listeler. Bu kayıt biçimi bir stdio test sunucusuyla çalıştırıldı (`docs-mcp` adlı sunucu için `mcp__docs_mcp__pid` aracı göründü; tireler alt çizgi olur).

## Özel bir ajan

Önce, ajan dosyası `<project>/.agz-code/agents/` ya da `~/.agz-code/agent/agents/` altında durur:

```
<project>/.agz-code/agents/reviewer.md
```

Sonra aynı dosya pakete girer ve manifest onu `agents` içinde listeler:

```
~/plugins/review-agents/
  package.json
  agents/reviewer.md
```

```markdown
---
name: reviewer
description: Reviews a change and reports defects with evidence.
base: explorer
tools: [readJ, grepJ]
---
You review changes. Report each defect with the file and line.
```

```json
{
  "name": "review-agents",
  "version": "1.0.0",
  "files": ["agents"],
  "agzPlugin": { "schemaVersion": 1, "id": "review-agents", "agents": ["agents"] }
}
```

Davranışta ne değişir:

- Dosya kuralları değişmez: `name` dosya adından `.md` çıkarılmış hâline eşittir, `base` explorer, researcher, worker, verifier ya da analyst'ten biridir, `tools` tabanın araçlarının alt kümesidir.
- Öncelik. Aynı adlı genel ya da proje ajanı paketinkine baskın gelir; paketinki gölgelenmiş olarak bildirilir. Asıl dosyayı kaldır.
- Kapsam. Kullanıcı kapsamlı eklenti ajanı her yerde sunar; proje kapsamlı olan yalnız güvenilen projede. Kapalı eklenti ajan sunmaz.
- Dosyayı hâlâ bir ajan klasöründeyken `agent_check` ile denetle; yalnız oradaki dosyaları okur. Sonra taşı.

Doğrulama: `manifest_check` `resources.agents` altında `agents/reviewer.md` dosyasını listeler; eklenti kurulduktan sonra ajan Ayarlar > Ajanlar'da ve `subagent` aracının listesinde görünür. Paket motorun ajan yükleyicisiyle yüklendiğinde `reviewer` ajanı, `explorer` tabanı ve `readJ`, `grepJ` araçlarıyla döndü.
