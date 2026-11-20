# API referansı

`@agz-yazilim/plugin-sdk` sözleşmesi, sürüm 1.4.0: paketin dışa aktardığı her ad, imzası ve TSDoc açıklamasıyla. Burada yer almayan ev sahibi API nesnesi üyeleri sözleşmenin dışındadır; bkz. [uyumluluk](./compatibility.md).

## Çalışma zamanı

### PluginModelProvider

Eklentinin motor modülünün katkı verdiği bir OpenAI sohbet tamamlama sağlayıcısı. Ev sahibi, sağlayıcı kimliğini eklentinin tam kimliği ile `id` değerinden türetir; böylece iki eklenti asla aynı sağlayıcı yerini paylaşmaz ve sağlayıcıyı ancak modülün fabrikası döndükten sonra kaydeder.

API anahtarı bu nesnenin parçası değildir: `secretSetting`, `agzPlugin.settings` içindeki bir `secret` alanının adını verir ve ev sahibi değerini her istekte okur. Bu anahtarı olmayan sağlayıcı kullanılamaz; kimlik doğrulaması olmadan gönderilmez.

```ts
interface PluginModelProvider
```

**Üyeler**

- `id: string`

  Eklenti içinde benzersiz: 1 ile 64 arası harf, rakam, `.`, `_` ya da `-`, harf ya da rakamla başlar.

- `name: string`

  Sağlayıcı ve model listelerinin gösterdiği ad: 1 ile 80 karakter.

- `baseUrl: string`

  Uç nokta: bir `https` adresi ya da yerel bir sunucu için geri döngü adresinde (`localhost`, `127.0.0.0/8`, `[::1]`) `http`. Kullanıcı adı, parola, sorgu ya da parça içermez, en çok 2048 karakter.

- `models: PluginModelProviderModel[]`

  Sunduğu modeller: 1 ile 32 arası, her kimlik bir kez.

- `secretSetting: string`

  Bu sağlayıcının API anahtarını tutan, `agzPlugin.settings` içindeki bir `secret` alanının anahtarı.

### PluginModelProviderModel

Bir eklentinin OpenAI uyumlu sağlayıcısının sunduğu tek bir sohbet modeli.

```ts
interface PluginModelProviderModel
```

**Üyeler**

- `id: string`

  Sağlayıcının API'sinin beklediği model kimliği: 1 ile 128 arası harf, rakam, `.`, `_`, `:`, `/` ya da `-`; harf veya rakamla başlar.

- `name: string`

  Model listesinin gösterdiği ad: 1 ile 80 karakter.

- `contextWindow: number`

  Bağlam penceresi, token cinsinden: 1 ile 10.000.000 arası.

- `maxTokens: number`

  Bir yanıtın kullanabileceği en çok token: 1 ile 1.000.000 arası; `contextWindow` değerini aşmaz.

### SDK_VERSION

Bu SDK'nın sürümü; `package.json` dosyasının `version` alanıyla aynıdır. Bir eklentinin `engines["agz-plugin-sdk"]` aralığı buna göre denetlenir. Sözleşmeye eklenen yeni isteğe bağlı bir üye küçük sürüm; bir üyeyi kaldırmak ya da değiştirmek büyük sürümdür.

```ts
declare const SDK_VERSION: "1.4.0";
```

### Static

Bir TypeBox şemasının tarif ettiği TypeScript türü: `Static<typeof schema>`, şemanın kabul ettiği değerin türüdür.

```ts
type Static<T extends TSchema> = TypeBoxStatic<T>
```

### TSchema

Her TypeBox şemasının türü; bir aracın `parameters` alanının kısıtıdır.

```ts
type TSchema = TypeBoxSchema
```

### Type

Bir aracın `parameters` alanını tanımlayan TypeBox yapı taşları (`Type.Object`, `Type.String`, ...). SDK'nın bağlı olduğu `typebox` paketinin `Type` nesnesidir; ev sahibi, bir araç çağrısının argümanlarını sizin oluşturduğunuz şemaya göre doğrular.

```ts
declare const Type: typeof import("typebox");
```

### defineTool

Verilen araç tanımını döndürür ve parametre türlerini korur: `execute` içindeki `params` TypeBox şemasından çıkarılır. Bir aracı bir değişkene atarken ya da bir diziden geçirirken kullanın; aksi halde `params` türü genişlerdi.

```ts
declare const defineTool: <TParams extends TSchema, TDetails = unknown>(tool: ToolDefinition<TParams, TDetails>) => ToolDefinition<TParams, TDetails>;
```

## Eklenti API'si

### ExecOptions

`PluginAPI.exec` için seçenekler.

```ts
interface ExecOptions
```

**Üyeler**

- `signal?: AbortSignal`

  Komutu iptal eder ve sonlandırır.

- `timeout?: number`

  Komutu bu kadar milisaniye sonra sonlandırır.

- `cwd?: string`

  Çalışma dizini. Varsayılan: oturumunki.

### ExecResult

`PluginAPI.exec` ile sonuçlanan değer. Komutun başarısızlığı reddedilme değil, sıfırdan farklı bir `code` olarak gelir.

```ts
interface ExecResult
```

**Üyeler**

- `stdout: string`

  Komutun standart çıktıya yazdığı her şey.

- `stderr: string`

  Komutun standart hataya yazdığı her şey.

- `code: number`

  Çıkış kodu.

- `killed: boolean`

  Komutun `timeout` ya da `signal` nedeniyle sonlandırılıp sonlandırılmadığı.

### McpExposure

Modelin bir MCP sunucusunun araçlarına hangi yoldan ulaştığı; varsayılanı `"codemode"`tur. Bkz. `ToolExposure`.

```ts
type McpExposure = "codemode" | "deferred" | "direct" | "hidden"
```

### McpHttpServerConfig

Ev sahibinin HTTP üzerinden eriştiği bir MCP sunucusu.

```ts
interface McpHttpServerConfig extends McpServerConfigBase
```

**Üyeler**

- `type?: "http"`

- `url: string`

  Sunucunun URL'si.

- `headers?: Record<string, string>`

  İstek başlıkları. Değerler değişkenlere (`${NAME}`) ya da komutlara (`!cmd`) başvurabilir.

- `exposure?: McpExposure`

  Modelin sunucunun araçlarına hangi yoldan ulaştığı. Varsayılan: `"codemode"`.

- `description?: string`

  Sunucunun sunduğu şey, tek cümleyle. Sistem istemi sunucuyu bununla listeler ve araç araması araçlarını buna göre sıralar.

- `toolExposure?: Record<string, McpExposure>`

  Tek tek araçların görünürlüğü; `exposure` alanını geçersiz kılar. Anahtarlar, sunucunun sunduğu araç adlarıdır ya da `*` her karakter dizisiyle eşleşen desenlerdir. Tam ad, desenlere üstün gelir.

- `enabled?: boolean`

  Bağlanmadan girdiyi tutmak için `false` yapın. Varsayılan: `true`.

- `timeout?: number`

  İstek başına zaman aşımı, saniye cinsinden. Varsayılan: 60.

### McpServerConfig

Bir MCP sunucusunun yapılandırması; `PluginAPI.registerMcpServer` için.

```ts
type McpServerConfig = McpStdioServerConfig | McpHttpServerConfig
```

### McpStdioServerConfig

Ev sahibinin alt süreç olarak başlattığı ve standart giriş/çıkış üzerinden konuştuğu bir MCP sunucusu.

```ts
interface McpStdioServerConfig extends McpServerConfigBase
```

**Üyeler**

- `type?: "stdio"`

- `command: string`

  Çalıştırılacak program.

- `args?: string[]`

  Argümanları.

- `env?: Record<string, string>`

  Ortam değişkenleri. Değerler değişkenlere (`${NAME}`) ya da komutlara (`!cmd`) başvurabilir.

- `cwd?: string`

  Çalışma dizini. Göreli bir yol, oturumun çalışma dizinine göre çözülür.

- `exposure?: McpExposure`

  Modelin sunucunun araçlarına hangi yoldan ulaştığı. Varsayılan: `"codemode"`.

- `description?: string`

  Sunucunun sunduğu şey, tek cümleyle. Sistem istemi sunucuyu bununla listeler ve araç araması araçlarını buna göre sıralar.

- `toolExposure?: Record<string, McpExposure>`

  Tek tek araçların görünürlüğü; `exposure` alanını geçersiz kılar. Anahtarlar, sunucunun sunduğu araç adlarıdır ya da `*` her karakter dizisiyle eşleşen desenlerdir. Tam ad, desenlere üstün gelir.

- `enabled?: boolean`

  Bağlanmadan girdiyi tutmak için `false` yapın. Varsayılan: `true`.

- `timeout?: number`

  İstek başına zaman aşımı, saniye cinsinden. Varsayılan: 60.

### PluginAPI

Ev sahibinin eklentinin fabrikasına verdiği nesne: araçları, komutları, MCP sunucularını ve görünümleri kaydetme, olayları dinleme ve oturumda işlem yapma yolu. Ev sahibinin nesnesinde başka üyeler de vardır (sağlayıcılar, sanal modeller, ayarlar, olay veri yolu); bunlar bu sözleşmenin parçası değildir ve her sürümde değişebilir.

```ts
interface PluginAPI
```

**Üyeler**

- `on: <E extends PluginEventName>(event: E, handler: PluginEventHandlers[E]) => () => void`

  Bir olaya abone olur. Bir olayın işleyicileri kayıt sırasıyla çalışır; hata fırlatan bir işleyici bildirilir, diğerleri yine de çalışır.

  - **Parametre** `event`: `PluginEventName` değerlerinden biri; işleyicinin olay ve sonuç türleri buna göre belirlenir.
  - **Dönüş**: İşleyiciyi kaldıran bir işlev.

- `registerTool: <TParams extends TSchema = TSchema, TDetails = unknown>(tool: ToolDefinition<TParams, TDetails>) => void`

  Modelin (ve Code Mode'un) çağırabileceği bir aracı kaydeder.

- `registerTools: <TParams extends TSchema = TSchema, TDetails = unknown>(tools: readonly ToolDefinition<TParams, TDetails>[]) => void`

  Birden çok aracı tek seferde kaydeder. Oturumun araç kaydı her araç için değil, liste için bir kez yeniden kurulur. Bir tanım geçersizse hiçbiri kaydedilmez.

- `registerCommand: (name: string, options: PluginCommand) => void`

  Bir eğik çizgi komutu kaydeder.

- `getPluginSettings: () => Readonly<Record<string, unknown>>`

  Bu eklentinin ayarları (`agzPlugin.settings`): kaydedilmiş değerler, varsayılanlar uygulanmış ve gizli değerler dahil. Yalnızca bu eklentinin ayarları; paketin manifest kimliği yoksa `{}`. Gerektiğinde okuyun: `settings_change`, kullanıcı kaydettikten sonra tetiklenir.

- `getPluginPaths: () => PluginPaths`

  Eklentinin kendi klasörleri: verisini, önbelleğini ve günlüklerini tuttuğu yerler ile kurulu olduğu yer. Kendi seçtiğiniz bir yol yerine bunları kullanın; böylece kaldırma işlemi neyin eklentiye ait olduğunu bilir.

  - **Fırlatır**: Paketin manifest kimliği (`agzPlugin.id`) yoksa: yalnızca bir eklentinin klasörleri olur.

- `registerView: (id: string, view: PluginViewDefinition) => void`

  Uygulamanın bu eklenti için çizeceği bir görünümü kaydeder. Yalnızca manifest kimliği olan bir eklenti kaydedebilir ve kimlik `agzPlugin.ui.views` içinde bildirilmiş olmalıdır; bildirilmeyen bir kimlik bildirilir ve kaydedilmez.

- `invalidateView: (id: string) => void`

  Uygulamaya kayıtlı bir görünümü yeniden çizmesini ister. Aynı anda yapılan çağrılar tek bir istek olur.

- `registerMcpServer: (name: string, config: McpServerConfig) => void`

  Bu oturum için bir MCP sunucusu kaydeder; ayarlardaki bir `mcpServers` girdisinin yapılandırmasıyla. Eklenti yüklenirken kaydedilirse `session_start` olayında bağlanır; sonradan kaydedilirse hemen bağlanır. Aynı adı yeniden kaydetmek eklentinin önceki kaydının yerine geçer. Kayıt saklanmaz: her yüklemede yeniden kaydedin. Aynı adla yapılandırılmış bir sunucu öncelikli olur.

  - **Fırlatır**: Yapılandırma geçersizse ya da adı başka bir eklenti kaydetmişse.

- `unregisterMcpServer: (name: string) => void`

  Bu eklentinin kaydettiği bir MCP sunucusunu kaldırır ve bağlantısını kapatır.

- `sendMessage: <T = unknown>(message: CustomMessageInput<T>, options?: SendMessageOptions | undefined) => void`

  Oturuma bir özel ileti ekler.

- `sendUserMessage: (content: string | (ImageContent | TextContent)[], options?: SendUserMessageOptions | undefined) => void`

  Ajana bir kullanıcı iletisi gönderir. Her zaman bir tur başlatır.

- `appendEntry: <T = unknown>(customType: string, data?: T | undefined) => void`

  Durumu tutmak için oturuma özel bir kayıt ekler. Modele gönderilmez.

- `exec: (command: string, args: string[], options?: ExecOptions | undefined) => Promise<ExecResult>`

  Bir komutu kabuk olmadan çalıştırır. Başarısız bir komut sıfırdan farklı bir `code` ile sonuçlanır.

### PluginCommand

`PluginAPI.registerCommand` için bir eğik çizgi komutu.

```ts
interface PluginCommand
```

**Üyeler**

- `description?: string`

  Komut listesinde gösterilir.

- `handler: (args: string, ctx: PluginCommandContext) => Promise<void>`

  Kullanıcı komutu çağırdığında çalışır; `args`, komut adından sonraki metindir.

- `button?: boolean`

  Bir ajanın komutu yanıtında düğme olarak sunmasına izin verir (açıklama bloğunun `run /<ad> <argümanlar>` satırı). Komut yalnız kullanıcı düğmeye bastığında, yanıtın ait olduğu oturumda çalışır.

### PluginFactory

Bir eklenti kod dosyasının varsayılan olarak dışa aktardığı işlev: `PluginAPI` nesnesini alır ve sunduğu şeyleri kaydeder.

```ts
type PluginFactory = (api: PluginAPI) => void | Promise<void>
```

### PluginPaths

Bir eklentinin klasörleri; `PluginAPI.getPluginPaths` için. Hepsi mutlak yoldur. `data`, `cache` ve `logs` yalnızca eklentiye aittir ve çağrı döndüğünde vardır; `package` eklentinin kurulu olduğu yerdir ve içine yazılmamalıdır.

```ts
interface PluginPaths
```

**Üyeler**

- `data: string`

  Kalıcı durum. Güncellemelerde ve düz kaldırmada korunur; "verisiyle kaldır" onu siler.

- `cache: string`

  Yeniden üretilebilen şeyler. Kullanıcı ya da ev sahibi her an silebilir.

- `logs: string`

  Eklentinin ve başlattığı süreçlerin günlük dosyaları.

- `package: string`

  Kurulu paket: salt okunurdur ve her güncellemede başka bir klasörle değişir.

### SendMessageOptions

`PluginAPI.sendMessage` için seçenekler.

```ts
interface SendMessageOptions
```

**Üyeler**

- `triggerTurn?: boolean`

  İleti için bir tur başlatır.

- `deliverAs?: "followUp" | "nextTurn" | "steer"`

  Ajan çalışırken: `steer` geçerli araç çağrılarından sonra, `followUp` çalışmadan sonra, `nextTurn` bir sonraki çalışmayla teslim eder.

### SendUserMessageOptions

`PluginAPI.sendUserMessage` için seçenekler.

```ts
interface SendUserMessageOptions
```

**Üyeler**

- `deliverAs?: "followUp" | "steer"`

  Ajan çalışırken: `steer` geçerli araç çağrılarından sonra, `followUp` çalışmadan sonra teslim eder.

- `expandPromptTemplates?: boolean`

  Eklenti komutlarını çalıştırır; metindeki beceri komutlarını ve istem şablonlarını açar.

## Araçlar

### ToolAnnotations

Bir aracın ne yaptığına dair ipuçları; MCP araç açıklamalarının anlamıyla. Bunlar yazarın iddialarıdır, doğrulanmazlar; izin denetimleri hangi çağrıların onaylanacağına karar vermek için bunları kullanabilir.

```ts
interface ToolAnnotations
```

**Üyeler**

- `readOnlyHint?: boolean`

  Araç ortamını değiştirmez.

- `destructiveHint?: boolean`

  Araç veriyi yalnızca eklemek yerine silebilir ya da üzerine yazabilir. Salt okunur değilse anlamlıdır.

- `idempotentHint?: boolean`

  Aynı argümanlarla çağrıyı tekrarlamanın ek bir etkisi yoktur. Salt okunur değilse anlamlıdır.

- `openWorldHint?: boolean`

  Araç, kapalı bir alan yerine web gibi dış varlıkların açık dünyasına ulaşır.

### ToolDefinition

Modelin (ve Code Mode'un) çağırabileceği bir araç; `PluginAPI.registerTool` için.

```ts
interface ToolDefinition<TParams extends TSchema = TSchema, TDetails = unknown>
```

**Üyeler**

- `name: string`

  Modelin bir çağrıda kullandığı ad. Harf, rakam ve alt çizgi kullanın ve eklentinizin önekini ekleyin.

- `label: string`

  Kullanıcı arayüzünde gösterilen kısa ad.

- `description: string`

  Aracın ne yaptığı; onu okuyan model için yazılır: birimler, sınırlar, başarısızlık biçimleri.

- `promptSnippet?: string`

  Sistem istemindeki "kullanılabilir araçlar" listesi için tek satır. Bu olmadan araç o listede yer almaz.

- `promptGuidelines?: string[]`

  Araç etkinken sistem istemine eklenen yönerge maddeleri.

- `parameters: TParams`

  Parametreler, bir TypeBox şeması olarak. `execute` çalışmadan önce argümanlar bu şemaya göre doğrulanır.

- `outputSchema?: TSchema`

  Başarılı sonuçlardaki `structuredContent` değerinin JSON Schema'sı. Bunu bildiren bir araç her zaman `structuredContent` değerini ayarlar.

- `scope?: "main"`

  main olduğunda araç yalnız ana oturumlarda kullanılabilir.

- `exposure?: ToolExposure`

  Modelin araca hangi yoldan ulaştığı. Varsayılan: `"direct"`.

- `annotations?: ToolAnnotations`

  Aracın ne yaptığına dair ipuçları.

- `access?: readonly ToolAccessName[]`

  > **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

  Bu aracın gerektirdiği erişim; eklenti manifestinin erişim listesi içinde olmalıdır.

- `defaultActive?: boolean`

  Aracı kaydetmenin onu etkinleştirip etkinleştirmediği. Varsayılan: `direct` ve `model-only` araçlar için `true`; diğer görünürlükler kayıtta asla etkinleştirilmez.

- `executionMode?: "parallel" | "sequential"`

  `"sequential"`: diğer araç çağrılarının yanında asla çalışmaz. `"parallel"`: çalışabilir. Varsayılan: ev sahibinin ayarı.

- `stopStepOnError?: boolean`

  Sıralı bir adımda bir çağrı başarısız olursa, aynı asistan iletisinin kalan çağrıları çalıştırılmaz; her biri `skipped: ` ile başlayan bir hata sonucu alır.

- `prepareArguments?: ((args: unknown) => StaticType<[], "Encode", {}, {}, TParams>)`

  Doğrulamadan önce ham argümanları hazırlar; örneğin eski bir argüman biçimini kabul etmek için. `parameters` ile eşleşen bir nesne döndürmelidir. `agzPlugin.access` bildiren bir eklentinin aracı bunu tanımlayamaz: ev sahibi böyle bir aracı yüklemez.

- `execute: (toolCallId: string, params: StaticType<[], "Encode", {}, {}, TParams>, signal: AbortSignal | undefined, onUpdate: ToolUpdateCallback<TDetails> | undefined, ctx: ToolContext) => Promise<...>`

  Aracı çalıştırır.

  - **Parametre** `toolCallId`: Bu çağrının kimliği.
  - **Parametre** `params`: Doğrulanmış argümanlar.
  - **Parametre** `signal`: Çağrı iptal edildiğinde iptal olur. Ev sahibi iptal edemiyorsa `undefined`.
  - **Parametre** `onUpdate`: Kısmi sonuçları bildirir; dinleyen yoksa `undefined`.
  - **Parametre** `ctx`: Çalışan oturumun bağlamı.
  - **Dönüş**: Sonuç. Bir başarısızlığı hata sonucu olarak bildirmek için hata fırlatın.

### ToolExposure

Modelin bir araca hangi yoldan ulaştığı. "Çağrılabilir", Code Mode'un yaptığı gibi `ctx.executeTool()` ile diğer araçlardan çağrılabilmek anlamına gelir.

- `direct`: modele bildirilir ve çağrılabilir. Varsayılan budur.
- `model-only`: modele bildirilir, ancak başka araçlardan asla çağrılamaz.
- `codemode`: Code Mode betiklerinden çağrılabilir; modele bildirilmez.
- `deferred`: `codemode` gibidir, ancak Code Mode onu listelemez; araç araması onu bulabilir.
- `hidden`: kaydedilir, ama hiçbir çağrı ona ulaşamaz.

```ts
type ToolExposure = "direct" | "model-only" | "codemode" | "deferred" | "hidden"
```

### ToolResult

Bir aracın döndürdüğü sonuç; tam ya da kısmi güncelleme olarak.

```ts
interface ToolResult<TDetails = unknown>
```

**Üyeler**

- `content: (ImageContent | TextContent)[]`

  Modelin okuduğu şey: metin ve görseller.

- `details: TDetails`

  Kullanıcı arayüzü ve günlükler için serbest biçimli veri; modele gönderilmez.

- `structuredContent?: JsonValue`

  Aracın `outputSchema` şemasına uyan, makine tarafından okunabilir sonuç. Modele gönderilmez; Code Mode betikleri metin içeriği yerine bunu alır.

- `isError?: boolean`

  Hata fırlatmadan başarısızlığı bildirir: model `content` değerini bir hata sonucu olarak görür.

- `terminate?: boolean`

  Geçerli araç grubundan sonra ajanı durdurma ipucu; grubun her sonucu bunu ayarladığında etkili olur.

### ToolUpdateCallback

Bir aracın çalışırken kısmi sonuçları bildirmek için çağırdığı geri çağrı.

```ts
type ToolUpdateCallback<TDetails = unknown> = (partialResult: ToolResult<TDetails>) => void
```

## Bağlamlar

### AccessDeniedReason

> **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

Ev sahibinin erişimi reddetme nedenleri.

```ts
type AccessDeniedReason = | "declined"
	| "timeout"
	| "aborted"
	| "no_ui"
	| "not_declared"
	| "changed"
	| "off"
	| "untrusted"
	| "subagent"
```

### AccessRequest

> **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

Bir değişiklikten önce kullanıcıdan onay isteme.

```ts
interface AccessRequest
```

**Üyeler**

- `action: "delete" | "modify" | "send"`

  Onaylanacak eylem.

- `account?: string`

  Kullanılan hesap, en çok 200 karakter.

- `target: string`

  Hedef, en çok 500 karakter.

- `summary: string`

  Bir özet, en çok 1000 karakter.

- `details?: string`

  Tam içerik, en çok 4000 karakter.

### AccessTicket

> **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

Geçersiz kılınabilen bir onay.

```ts
interface AccessTicket
```

**Üyeler**

- `check: () => void`

  Onay artık geçerli değilse hata fırlatır.

### ExecuteToolOptions

`ToolContext.executeTool` için seçenekler.

```ts
interface ExecuteToolOptions
```

**Üyeler**

- `signal?: AbortSignal`

  İç içe çağrıyı iptal eder. Varsayılan: çağıran aracın sinyali.

- `onUpdate?: ToolUpdateCallback<unknown>`

  İç içe aracın kısmi sonuçlarını alır.

### PluginAccountInfo

> **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

Bildirilen bir hesabın durumu; belirteç eklenti koduna verilmez.

```ts
interface PluginAccountInfo
```

**Üyeler**

- `id: string`

- `provider: "google" | "microsoft"`

- `label?: LocalizedText`

- `state: "connected" | "disconnected" | "reconnect_required" | "unavailable" | "unconfigured"`

- `email?: string`

- `grantedScopes: readonly string[]`

- `missingScopes: readonly string[]`

### PluginCommandContext

Bir komut işleyicisinin aldığı bağlam: `PluginContext` ile birlikte yalnızca kullanıcının başlattığı bir komutun yapabileceği işlemler.

```ts
interface PluginCommandContext extends PluginContext
```

**Üyeler**

- `waitForIdle: () => Promise<void>`

  Ajan çalışan turunu bitirdiğinde çözülür.

- `ui: PluginUIContext`

  Kullanıcıdan girdi ister ve bildirimleri gösterir.

- `hasUI: boolean`

  Bir kullanıcının bağlı olup olmadığı; böylece `ui` diyaloglarına yanıt verilebilir.

- `isSubagent: boolean`

  Motorun bu oturumu bir alt ajan olarak başlatıp başlatmadığı; iş akışı görevleri dahildir.

- `cwd: string`

  Oturumun çalışma dizini.

- `signal: AbortSignal | undefined`

  Kullanıcı çalışan turu durdurduğunda iptal olur; ajan boşta iken `undefined`.

- `isIdle: () => boolean`

  Ajanın boşta (bir tur çalıştırmıyor) olup olmadığı.

- `isProjectTrusted: () => boolean`

  Kullanıcının bu oturumun proje klasörüne güvenip güvenmediği.

- `abort: () => void`

  Çalışan turu iptal eder.

### PluginContext

Bir olay işleyicisinin olayın yanında aldığı bağlam.

```ts
interface PluginContext
```

**Üyeler**

- `ui: PluginUIContext`

  Kullanıcıdan girdi ister ve bildirimleri gösterir.

- `hasUI: boolean`

  Bir kullanıcının bağlı olup olmadığı; böylece `ui` diyaloglarına yanıt verilebilir.

- `isSubagent: boolean`

  Motorun bu oturumu bir alt ajan olarak başlatıp başlatmadığı; iş akışı görevleri dahildir.

- `cwd: string`

  Oturumun çalışma dizini.

- `signal: AbortSignal | undefined`

  Kullanıcı çalışan turu durdurduğunda iptal olur; ajan boşta iken `undefined`.

- `isIdle: () => boolean`

  Ajanın boşta (bir tur çalıştırmıyor) olup olmadığı.

- `isProjectTrusted: () => boolean`

  Kullanıcının bu oturumun proje klasörüne güvenip güvenmediği.

- `abort: () => void`

  Çalışan turu iptal eder.

### PluginToolAccounts

> **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

Motorun tuttuğu hesaplarla istek gönderir.

```ts
interface PluginToolAccounts
```

**Üyeler**

- `get: (accountId: string) => Promise<PluginAccountInfo>`

  Bildirilen hesabın durumunu okur.

- `fetch: (accountId: string, url: string, init?: RequestInit | undefined, options?: { readonly ticket?: AccessTicket | undefined; } | undefined) => Promise<Response>`

  Sağlayıcının API kökenine istek gönderir; yazma için onay belgesi gerekir.

### PluginToolAgentRun

> **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

Ajan koşusunun sonucu.

```ts
interface PluginToolAgentRun
```

**Üyeler**

- `status: "completed" | "empty" | "partial" | "started" | "timeout"`

  Sonuç durumu veya arka plan koşusu için started.

- `text: string`

  Yanıt; arka plan koşusu başladığında boş.

- `sessionId?: string`

  Varsa ajan oturumunun kimliği.

### PluginToolAgentRunOptions

> **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

Paket ajanı çalıştırma seçenekleri.

```ts
interface PluginToolAgentRunOptions
```

**Üyeler**

- `agent: string`

  Paketin ajan kimliği.

- `prompt: string`

  Ajana verilen görev.

- `description: string`

  Kullanıcıya gösterilen kısa açıklama.

- `background?: boolean`

  Hemen döner ve sonucu arka plan raporu olarak sunar.

- `timeoutMs?: number`

  Milisaniye cinsinden süre sınırı (1..900000, varsayılan 360000).

- `answerReserveMs?: number`

  Yanıt için ayrılan süre; 0 ile timeoutMs arasında, varsayılan 0.

- `extendReadFor?: { paths: string[]; ms: number; }`

  Okuma süresi en çok 60000 milisaniye uzatılacak yollar.

- `tools?: ToolDefinition<TSchema, unknown>[]`

  Paket önekli, yalnız bu koşuda kullanılacak en çok 32 araç.

### PluginToolAgents

> **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

Bu eklentinin bildirdiği ajanları çalıştırır.

```ts
interface PluginToolAgents
```

**Üyeler**

- `run: (options: PluginToolAgentRunOptions) => Promise<PluginToolAgentRun>`

  Bir koşu başlatır; ön plan koşusu çağıran aracın iptal sinyalini izler.

### PluginUIContext

Eklentinin isteyebileceği kullanıcı arayüzü. Her yöntem `PluginContext.hasUI` gerektirir: kullanıcı arayüzü yoksa diyaloglar boş yanıtlarına (`false`, `undefined`) çözülür ve `notify` hiçbir şey göstermez.

```ts
interface PluginUIContext
```

**Üyeler**

- `select: (title: string, options: string[], opts?: UIDialogOptions | undefined) => Promise<string | undefined>`

  Bir liste gösterir ve seçilen seçeneğe çözülür; kullanıcı kapatırsa `undefined`.

- `confirm: (title: string, message: string, opts?: UIDialogOptions | undefined) => Promise<boolean>`

  Evet/hayır sorusu sorar ve yanıta çözülür.

- `input: (title: string, placeholder?: string | undefined, opts?: UIDialogOptions | undefined) => Promise<string | undefined>`

  Tek satırlık bir metin ister ve ona çözülür; kullanıcı kapatırsa `undefined`.

- `notify: (message: string, type?: "error" | "info" | "warning" | undefined) => void`

  Kısa bir bildirim gösterir. `type` varsayılanı `"info"`dur.

### ToolCallOutcome

`ToolContext.executeTool` ile çalıştırılan bir aracın sonucu; kancalar çalıştıktan sonra.

```ts
interface ToolCallOutcome
```

**Üyeler**

- `result: ToolResult<unknown>`

  Aracın sonucu; çağrı başarısız olduysa bir hata sonucu.

- `isError: boolean`

  Çağrının başarısız olup olmadığı.

- `durationMs?: number`

  Aracın kaç milisaniye çalıştığı; çalışmadıysa yok.

### ToolContext

Bir aracın `execute` işlevinin beşinci argümanı: çalışan oturumun `PluginContext` bağlamı. İptal sinyali ve ilerleme geri çağrısı `execute`un üçüncü ve dördüncü argümanlarıdır.

```ts
interface ToolContext extends PluginContext
```

**Üyeler**

- `accounts?: PluginToolAccounts`

  > **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

  Ev sahibi sunduğunda bildirilen hesaplar.

- `agents?: PluginToolAgents`

  > **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

  agents izniyle ana oturumda paket ajanlarını çalıştırır.

- `access: { approve(request: AccessRequest): Promise<AccessTicket>; check(): void; }`

  > **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

  Bu çağrı için onay ve süregelen erişim denetimleri.

- `executeTool: (name: string, args: unknown, options?: ExecuteToolOptions | undefined) => Promise<ToolCallOutcome>`

  Başka bir aracı, modelin çağrısıyla aynı doğrulama, kanca ve denetimlerden geçirerek çalıştırır. Araç başarısız olduğunda reddetmez: bilinmeyen araçlar, geçersiz argümanlar, engellenen çağrılar ve fırlatılan hatalar `isError: true` ile döner.

- `ui: PluginUIContext`

  Kullanıcıdan girdi ister ve bildirimleri gösterir.

- `hasUI: boolean`

  Bir kullanıcının bağlı olup olmadığı; böylece `ui` diyaloglarına yanıt verilebilir.

- `isSubagent: boolean`

  Motorun bu oturumu bir alt ajan olarak başlatıp başlatmadığı; iş akışı görevleri dahildir.

- `cwd: string`

  Oturumun çalışma dizini.

- `signal: AbortSignal | undefined`

  Kullanıcı çalışan turu durdurduğunda iptal olur; ajan boşta iken `undefined`.

- `isIdle: () => boolean`

  Ajanın boşta (bir tur çalıştırmıyor) olup olmadığı.

- `isProjectTrusted: () => boolean`

  Kullanıcının bu oturumun proje klasörüne güvenip güvenmediği.

- `abort: () => void`

  Çalışan turu iptal eder.

### UIDialogOptions

Eklentinin `PluginUIContext` üzerinden açtığı bir diyaloğun seçenekleri.

```ts
interface UIDialogOptions
```

**Üyeler**

- `signal?: AbortSignal`

  İptal edildiğinde diyaloğu kapatır.

- `timeout?: number`

  Diyaloğu bu kadar milisaniye sonra kapatır.

### isAccessDenied

> **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

Ev sahibinin erişim reddini SDK ile ev sahibi modül sınırları arasında tanır.

```ts
declare const isAccessDenied: (error: unknown) => error is Error & { reason: AccessDeniedReason; };
```

## Olaylar ve iletiler

### AgentEndEvent

Ajan çalışmayı bıraktığında tetiklenir.

```ts
interface AgentEndEvent
```

**Üyeler**

- `type: "agent_end"`

- `messages: SessionMessage[]`

  Çalışmanın iletileri.

### AgentStartEvent

Ajan çalışmaya başladığında tetiklenir.

```ts
interface AgentStartEvent
```

**Üyeler**

- `type: "agent_start"`

### AssistantMessage

Modelin yazdığı bir ileti.

```ts
interface AssistantMessage
```

**Üyeler**

- `role: "assistant"`

- `content: (TextContent | ThinkingContent | ToolCallContent)[]`

  Metin, akıl yürütme ve araç çağrıları, sırayla.

- `provider: string`

  Bunu üreten sağlayıcı.

- `model: string`

  Bunu üreten model.

- `stopReason: "aborted" | "deferred" | "error" | "length" | "pending" | "stop" | "toolUse"`

  Modelin neden durduğu.

- `errorMessage?: string`

  `stopReason` `"error"` olduğunda hata metni.

- `timestamp: number`

  İsteğin başladığı zaman; Unix epoch'tan bu yana milisaniye cinsinden.

### BeforeAgentStartCustomEvent

Bir özel ileti tarafından başlatılan bir ajan çalışmasının başında tetiklenir.

```ts
interface BeforeAgentStartCustomEvent
```

**Üyeler**

- `type: "before_agent_start"`

- `messageType: "custom"`

  Çalışma bir özel iletiyle başlar.

- `systemPrompt: string`

  Önceki işleyicilerden sonra sistem istemi.

- `message: CustomMessage<unknown>`

  Çalışmayı başlatan ileti.

### BeforeAgentStartEvent

Bir ajan çalışması başlamadan önce tetiklenir.

```ts
type BeforeAgentStartEvent = BeforeAgentStartUserEvent | BeforeAgentStartCustomEvent
```

### BeforeAgentStartEventResult

Bir `before_agent_start` işleyicisinin bu çalışma için değiştirebileceği şeyler.

```ts
interface BeforeAgentStartEventResult
```

**Üyeler**

- `message?: CustomMessageInput<unknown>`

  Çalışmadan önce eklenen bir özel ileti.

- `systemPrompt?: string`

  Bu çalışma için bütün sistem istemini değiştirir. Sonraki işleyiciler değişikliği görür.

### BeforeAgentStartUserEvent

Bir kullanıcı iletisi ya da `triggerTurn` ile bir özel ileti tarafından başlatılan her ajan çalışmasının başında tetiklenir.

```ts
interface BeforeAgentStartUserEvent
```

**Üyeler**

- `type: "before_agent_start"`

- `messageType: "user"`

  Çalışma bir kullanıcı iletisiyle başlar.

- `systemPrompt: string`

  Önceki işleyicilerden sonra sistem istemi.

- `prompt: string`

  Kullanıcının istem metni.

- `images?: ImageContent[]`

  İsteme eklenen görseller.

### CustomEntryDraft

Bir işleyicinin tur bittiğinde oturuma eklediği kayıt; oturumda tutulur, modele gönderilmez.

```ts
interface CustomEntryDraft
```

**Üyeler**

- `type: "custom"`

- `customType: string`

  Kaydın türünü adlandırır.

- `data?: unknown`

  Tutulacak veri.

### CustomMessage

Bir eklentinin ya da ev sahibinin `sendMessage` ile eklediği ileti.

```ts
interface CustomMessage<TDetails = unknown>
```

**Üyeler**

- `role: "custom"`

- `customType: string`

  İletinin türünü adlandırır; sizin, gönderirken seçtiğiniz.

- `content: string | (ImageContent | TextContent)[]`

  Metin ya da metin ve görseller.

- `display: boolean`

  Kullanıcı arayüzünün bunu gösterip göstermediği.

- `details?: TDetails`

  Kullanıcı arayüzü için veri; modele gönderilmez.

- `timestamp: number`

  İletinin oluşturulma zamanı; Unix epoch'tan bu yana milisaniye cinsinden.

### CustomMessageEntryDraft

Bir işleyicinin tur bittiğinde oturuma eklediği ileti kaydı.

```ts
interface CustomMessageEntryDraft
```

**Üyeler**

- `type: "custom_message"`

- `customType: string`

  İletinin türünü adlandırır.

- `content: string | (ImageContent | TextContent)[]`

  Metin ya da metin ve görseller.

- `display: boolean`

  Kullanıcı arayüzünün bunu gösterip göstermediği.

- `details?: unknown`

  Kullanıcı arayüzü için veri; modele gönderilmez.

### CustomMessageInput

Bir eklentinin sağladığı özel iletinin alanları.

```ts
interface CustomMessageInput<TDetails = unknown>
```

**Üyeler**

- `customType: string`

  İletinin türünü adlandırır.

- `content: string | (ImageContent | TextContent)[]`

  Metin ya da metin ve görseller.

- `display: boolean`

  Kullanıcı arayüzünün bunu gösterip göstermediği.

- `details?: TDetails`

  Kullanıcı arayüzü için veri; modele gönderilmez.

### HostMessage

Ev sahibinin kendi kullanımı için oturumda tuttuğu bir ileti. Sözleşmenin parçası yalnızca rolü ve zamanıdır.

```ts
interface HostMessage
```

**Üyeler**

- `role: "bashExecution" | "branchSummary" | "compactionSummary" | "system"`

- `timestamp: number`

  İletinin oluşturulma zamanı; Unix epoch'tan bu yana milisaniye cinsinden.

### InputEvent

Kullanıcı girdisi geldiğinde, ajan onu işlemeden önce tetiklenir.

```ts
interface InputEvent
```

**Üyeler**

- `type: "input"`

- `text: string`

  Girdi metni.

- `images?: ImageContent[]`

  Eklenen görseller.

- `source: "extension" | "interactive" | "rpc"`

  Girdinin nereden geldiği.

- `streamingBehavior?: "followUp" | "steer"`

  Ajan çalışırken girdinin nasıl teslim edildiği; boştayken `undefined`.

### InputEventResult

Bir `input` işleyicisinin kararı: `continue` girdiyi olduğu gibi bırakır, `transform` onu değiştirir, `handled` onu tüketir ve ajan onu hiç görmez.

```ts
type InputEventResult = | { action: "continue" }
	| { action: "transform"; text: string; images?: ImageContent[] }
	| { action: "handled" }
```

### PluginEventName

Bir eklentinin `PluginAPI.on` ile abone olabileceği olayların adları.

```ts
type PluginEventName = | "session_start"
	| "session_shutdown"
	| "settings_change"
	| "tool_call"
	| "tool_result"
	| "input"
	| "turn_start"
	| "turn_end"
	| "agent_start"
	| "agent_end"
	| "before_agent_start"
	| "session_compaction_state"
	| "session_compact"
```

### PluginHandler

Bir olay işleyicisi: olay ve bağlam girer, isteğe bağlı bir sonuç çıkar (sonradan da olabilir).

```ts
type PluginHandler<E, R = undefined> = (event: E, ctx: PluginContext) => Promise<R | void> | R | void
```

### SessionCompactEvent

Ev sahibi oturumun bağlamını sıkıştırdıktan sonra tetiklenir: önceki iletiler artık bir özet olduğu için eklentinin konuşmaya eklediği bir not kaybolmuş olabilir. Ev sahibinin olay nesnesinde daha fazla alan vardır; sözleşmenin parçası yalnız buradakilerdir.

```ts
interface SessionCompactEvent
```

**Üyeler**

- `type: "session_compact"`

- `reason: string`

  Sıkıştırmayı neyin başlattığı: `manual`, `threshold`, `overflow`, `idle` ya da `expired`.

### SessionCompactionStateEvent

Ev sahibi oturumun bağlamını özetlemeden (sıkıştırmadan) hemen önce tetiklenir. İşleyici eklentinin canlı durumundan birkaç düz satır döndürebilir; ev sahibi bunları özetin durum bloğuna eklentinin kimliği altında koyar, böylece sıkıştırmadan sonra da model bu durumu bilir. İşleyicinin 3 saniyesi vardır; fırlatılan hata ya da zaman aşımı blokta adıyla anılır.

```ts
interface SessionCompactionStateEvent
```

**Üyeler**

- `type: "session_compaction_state"`

- `reason: string`

  Sıkıştırmayı neyin başlattığı: `manual`, `threshold`, `overflow`, `idle` ya da `expired`.

### SessionCompactionStateResult

Bir `session_compaction_state` işleyicisinin döndürdüğü şey.

```ts
interface SessionCompactionStateResult
```

**Üyeler**

- `stateLines?: string`

  Eklentinin durumundan birkaç düz satır (yaklaşık 1000 karakterde kesilir); boş ya da yoksa hiçbir şey eklenmez.

### SessionMessage

Oturumdaki bir ileti. Okumak için `role` değerine göre ayırın.

```ts
type SessionMessage = UserMessage | AssistantMessage | ToolResultMessage | CustomMessage | HostMessage
```

### SessionShutdownEvent

Eklentinin kodu kapatılmadan önce tetiklenir: çıkışta, yeniden yüklemede ya da oturum değiştiğinde. Kaynakları burada serbest bırakın.

```ts
interface SessionShutdownEvent
```

**Üyeler**

- `type: "session_shutdown"`

- `reason: "fork" | "new" | "quit" | "reload" | "resume"`

  Eklentinin neden kapatıldığı.

- `targetSessionFile?: string`

  Oturum değiştirildiğinde, yerine geçen oturum dosyası.

### SessionStartEvent

Bir oturum başladığında, yüklendiğinde ya da yeniden yüklendiğinde tetiklenir.

```ts
interface SessionStartEvent
```

**Üyeler**

- `type: "session_start"`

- `reason: "fork" | "new" | "reload" | "resume" | "startup"`

  Oturumun neden başladığı.

- `previousSessionFile?: string`

  Önce etkin olan oturum dosyası. `"new"`, `"resume"` ve `"fork"` için bulunur.

### SettingsChangeEvent

Kullanıcı eklentinin ayarlarını kaydettiğinde tetiklenir.

```ts
interface SettingsChangeEvent
```

**Üyeler**

- `type: "settings_change"`

- `settings: Readonly<Record<string, unknown>>`

  `PluginAPI.getPluginSettings`in şimdi döndürdüğü değer.

### ThinkingContent

Bir asistan iletisinin akıl yürütme metni.

```ts
interface ThinkingContent
```

**Üyeler**

- `type: "thinking"`

- `thinking: string`

  Akıl yürütme metni.

### ToolCallContent

Bir asistan iletisinin içindeki bir araç çağrısı.

```ts
interface ToolCallContent
```

**Üyeler**

- `type: "toolCall"`

- `id: string`

  Çağrının kimliği; araç sonucu iletisi aynı kimliği taşır.

- `name: string`

  Aracın adı.

- `arguments: JsonObject`

  Modelin gönderdiği argümanlar.

### ToolCallEvent

Bir araç çalışmadan önce tetiklenir. Bir işleyici çağrıyı engelleyebilir. `input` değiştirilebilir: argümanları düzeltmek için yerinde değiştirin; sonraki işleyiciler değişikliği görür. Argümanlar yeniden doğrulanmaz.

```ts
interface ToolCallEvent
```

**Üyeler**

- `type: "tool_call"`

- `toolCallId: string`

  Çağrının kimliği.

- `parentToolCallId?: string`

  Bu çağrıyı başka bir araç (örneğin bir Code Mode betiği) yaptığında bulunur.

- `toolName: string`

  Aracın adı.

- `input: Record<string, unknown>`

  Argümanlar.

### ToolCallEventResult

Bir `tool_call` işleyicisinin kararı.

```ts
interface ToolCallEventResult
```

**Üyeler**

- `block?: boolean`

  Çağrıyı engeller. Bunun yerine argümanları değiştirmek için `event.input` nesnesini değiştirin.

- `reason?: string`

  Çağrı engellendiğinde modelin hata olarak gördüğü metin.

- `terminate?: boolean`

  Bu çağrı engellendiğinde, geçerli araç grubundan sonra ajanı durdurma ipucu. Grubun her sonucu bunu ayarladığında etkili olur.

### ToolResultEvent

Bir araç çalıştıktan sonra tetiklenir. Bir işleyici sonucu değiştirebilir.

```ts
interface ToolResultEvent
```

**Üyeler**

- `type: "tool_result"`

- `toolCallId: string`

  Çağrının kimliği.

- `parentToolCallId?: string`

  Bu çağrıyı başka bir araç yaptığında bulunur.

- `toolName: string`

  Aracın adı.

- `input: Record<string, unknown>`

  Aracın çalıştığı argümanlar.

- `content: (ImageContent | TextContent)[]`

  Modelin okuyacağı içerik.

- `details: unknown`

  Aracın `details` değeri.

- `structuredContent?: JsonValue`

  Aracın `structuredContent` değeri.

- `isError: boolean`

  Çağrının başarısız olup olmadığı.

### ToolResultEventResult

Bir `tool_result` işleyicisinin değiştirdikleri. Bıraktığı alanlar olduğu gibi kalır; ancak `structuredContent` döndürmeden `content` değiştirilirse yapılandırılmış içerik düşer, çünkü artık eşleşmeyebilir. Korumak için ikisini de döndürün.

```ts
interface ToolResultEventResult
```

**Üyeler**

- `content?: (ImageContent | TextContent)[]`

  Modelin okuduğu içeriği değiştirir.

- `details?: unknown`

  Ayrıntıları değiştirir.

- `structuredContent?: JsonValue`

  Yapılandırılmış içeriği değiştirir.

- `isError?: boolean`

  Hata işaretini değiştirir.

### ToolResultMessage

Bir araç çağrısının sonucu, modelin gördüğü biçimiyle.

```ts
interface ToolResultMessage
```

**Üyeler**

- `role: "toolResult"`

- `toolCallId: string`

  Yanıtladığı çağrının kimliği.

- `toolName: string`

  Aracın adı.

- `content: (ImageContent | TextContent)[]`

  Modelin okuduğu içerik.

- `isError: boolean`

  Çağrının başarısız olup olmadığı.

- `timestamp: number`

  Sonucun oluşturulma zamanı; Unix epoch'tan bu yana milisaniye cinsinden.

### TurnEndEvent

Her turun sonunda tetiklenir.

```ts
interface TurnEndEvent
```

**Üyeler**

- `type: "turn_end"`

- `turnIndex: number`

  Turun çalışma içindeki sırası, 0'dan başlar.

- `message: SessionMessage`

  Turun ürettiği asistan iletisi.

- `toolResults: ToolResultMessage[]`

  Turun çağırdığı araçların sonuçları.

- `outcome: "aborted" | "completed" | "error"`

  Çalışmanın nasıl bittiği; bu tur sonuncuysa bilinir.

### TurnEndEventResult

Bir `turn_end` işleyicisinin değiştirebileceği şeyler.

```ts
interface TurnEndEventResult
```

**Üyeler**

- `entries?: (CustomEntryDraft | CustomMessageEntryDraft)[]`

  Oturuma eklenen kayıtlar.

- `continue?: boolean`

  Bu turdan sonra ajanın bir istek daha yapmasını sağlar.

### TurnStartEvent

Her turun başında tetiklenir (bir model isteği ve onun istediği araç çağrıları).

```ts
interface TurnStartEvent
```

**Üyeler**

- `type: "turn_start"`

- `turnIndex: number`

  Turun çalışma içindeki sırası, 0'dan başlar.

- `timestamp: number`

  Turun başladığı zaman; Unix epoch'tan bu yana milisaniye cinsinden.

### UserMessage

Kullanıcının yazdığı bir ileti.

```ts
interface UserMessage
```

**Üyeler**

- `role: "user"`

- `content: string | (ImageContent | TextContent)[]`

  Metin ya da metin ve görseller.

- `timestamp: number`

  İletinin oluşturulma zamanı; Unix epoch'tan bu yana milisaniye cinsinden.

## İçerik

### ImageContent

Bir iletide ya da araç sonucunda yer alan görsel.

```ts
interface ImageContent
```

**Üyeler**

- `type: "image"`

- `data: string`

  Base64 ile kodlanmış görsel verisi.

- `mimeType: string`

  Ortam türü, örneğin `image/png`.

### JsonObject

Bir JSON nesnesi: metin anahtarlar ve JSON değerleri.

```ts
type JsonObject = { [key: string]: JsonValue }
```

### JsonValue

Herhangi bir JSON değeri.

```ts
type JsonValue = null | boolean | number | string | readonly JsonValue[] | JsonObject
```

### TextContent

Bir iletide ya da araç sonucunda yer alan metin parçası.

```ts
interface TextContent
```

**Üyeler**

- `type: "text"`

- `text: string`

  Metin.

## Manifest

### AccessName

> **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

Bir eklentinin bildirebileceği erişim anahtarları.

```ts
type AccessName = "read" | "subagents" | "modify" | "send" | "delete" | "download" | "automations"
```

### LocalizedText

Uygulamanın iki dilindeki metin.

```ts
interface LocalizedText
```

**Üyeler**

- `en: string`

  İngilizce.

- `tr: string`

  Türkçe.

### PluginAccountDeclaration

> **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

Eklentinin bildirdiği bir OAuth hesabı.

```ts
interface PluginAccountDeclaration
```

**Üyeler**

- `id: string`

  Eklenti içinde benzersiz, küçük harfli hesap kimliği.

- `provider: "google" | "microsoft"`

  OAuth sağlayıcısı.

- `scopes: string[]`

  Sağlayıcıdan istenen kapsamlar.

- `label?: LocalizedText`

  Kullanıcıya gösterilen ad.

### PluginBinaries

Çalıştırılabilir dosya adlarını platform derlemelerine eşler.

```ts
type PluginBinaries = Record<string, Partial<Record<PluginBinaryTarget, PluginBinary>>>
```

### PluginBinary

Yerel çalıştırılabilir dosyanın paketlenmiş bir derlemesi.

```ts
interface PluginBinary
```

**Üyeler**

- `path: string`

  Paket içindeki çalıştırılabilir dosya yolu.

- `sha256: string`

  Paketlenmiş dosyanın küçük harfli onaltılık SHA-256 karması.

### PluginBinaryTarget

Motorun çalıştığı platform ve işlemci mimarisi.

```ts
type PluginBinaryTarget = | "linux-x64"
	| "linux-arm64"
	| "darwin-x64"
	| "darwin-arm64"
	| "win32-x64"
	| "android-arm64"
```

### PluginBotApproval

Bir şablondan yapılan botun kullanıcıya bildirim verip vermeyeceği ya da kendi başına bitip bitmeyeceği.

```ts
type PluginBotApproval = "report" | "final"
```

### PluginBotTemplate

Kullanıcının Ayarlar > Botlar bölümünden oluşturabileceği bir bot; asla canlı bir bot değildir.

```ts
interface PluginBotTemplate
```

**Üyeler**

- `id: string`

  Eklenti içinde benzersiz.

- `name: string`

  Botun adı: küçük harfle başlayan, ardından 1 ila 47 küçük harf, rakam ya da tire.

- `description: LocalizedText`

  Botun ne yaptığı.

- `brief: string`

  Botu yönlendiren `BOT.md` metninin paket içindeki yolu.

- `suggestedPermissions?: string`

  Bot için önerilen izinler.

- `suggestedApproval?: PluginBotApproval`

  Önerilen onay kipi.

### PluginManifest

Bir eklentinin `package.json` dosyasındaki `agzPlugin` alanı. Kaynak yolları paket köküne göredir.

```ts
interface PluginManifest
```

**Üyeler**

- `schemaVersion: 1`

  Manifest biçiminin sürümü. Her zaman 1.

- `id: string`

  Eklentinin kimliği: küçük harf, rakam, `.`, `_` ve `-` ile yazılan `<yayıncı>/<ad>` (yalnız `<ad>` da kabul edilir). Kurulu iki eklenti aynı kimliği paylaşamaz.

- `name?: string`

  Görünen ad.

- `description?: string`

  Eklentinin ne yaptığı.

- `publisher?: string`

  Kimin yayımladığı.

- `homepage?: string`

  Eklentinin ana sayfası (https).

- `icon?: string`

  Eklenti için gösterilen, paket içindeki tek bir png, webp ya da svg dosyası (en çok 32 KB).

- `extensions?: string[]`

  `PluginFactory` dışa aktaran eklenti kod dosyaları.

- `skills?: string[]`

  Beceri klasörleri ya da dosyaları.

- `prompts?: string[]`

  İstem şablonları.

- `themes?: string[]`

  Temalar.

- `agents?: string[]`

  Ajan tanımları.

- `systemPrompt?: string`

  Sistem istemi düzenlemelerini içeren, paket içindeki tek bir JSON dosyası; içeriği bir `PluginSystemPrompt`tur.

- `engine?: string`

  Ev sahibinin, eklenti açıkken bir kez (oturum başına değil) yüklediği, paket içindeki tek bir modül (ts, mts, js ya da mjs). Varsayılan dışa aktarımı `@agz-yazilim/plugin-sdk/unstable` içindeki bir `PluginEngineFactory`dir.

- `binaries?: PluginBinaries`

  Motor modülünün hedef platforma özel çalıştırılabilir dosyaları; native ve process izinlerini gerektirir.

- `mcpServers?: Record<string, McpServerConfig>`

  Eklentinin getirdiği MCP sunucuları, ada göre (en çok 16). Ev sahibi bunları eklentiyi yükleyen her oturumda `registerMcpServer` gibi kaydeder ve eklenti kodu çalıştırmadan listeler. Bir stdio sunucusunun `command`, `args`, `cwd` ve `env` değerlerinde `${pluginDir}` kurulu paket klasörünü gösterir; `cwd` varsayılan olarak o klasördür.

- `userContent?: PluginUserContent[]`

  Eklentinin, kendi klasörleri dışında kullanıcıya ait olanı tuttuğu yerler. Kaldırma bunları asla silmez.

- `permissions?: PluginPermission[]`

  Eklentinin neye ihtiyaç duyduğu; kullanıcı listeyi kurmadan önce görür. Bir beyandır, kum havuzu değildir.

- `settings?: PluginSettingField[]`

  Eklentinin ayar formu, sıralı (en çok 32 alan). Değerleri ev sahibi saklar, paketi değil.

- `ui?: PluginUiManifest`

  Uygulamanın eklenti için çizdiği arayüz.

- `bots?: PluginBotTemplate[]`

  Kullanıcının bota dönüştürebileceği bot şablonları.

- `access?: AccessName[]`

  > **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

  Erişim anahtarları, varsayılan olarak kapalı; verildiğinde `read` içermelidir.

- `accessNotes?: Partial<Record<AccessName, LocalizedText>>`

  > **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

  Bildirilen erişim anahtarları için yerelleştirilmiş ayrıntılar.

- `accounts?: PluginAccountDeclaration[]`

  > **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

  OAuth hesapları; accounts izni ve erişim bildirimi gerektirir.

### PluginPermission

Bir eklentinin neye ihtiyaç duyduğunu söyleyebileceği değerler: `network` (başka sunucularla konuşur), `filesystem` (kendi klasörleri ve oturumun projesi dışındaki dosyalar), `process` (program başlatır), `native` (kendi ikili dosyalarını getirir ve çalıştırır), `ui` (uygulama penceresine kendi kodunu ekler), `secrets` (kimlik bilgisi saklar), `sessions` (başka oturumları okur ya da yönetir), `memory` (genel hafıza), `git` (projenin deposunu değiştirir), `notifications` (kullanıcıya bildirim gönderir), `usage` (sağlayıcı kotalarını ve kullanım rakamlarını okur), `providers` (model sağlayıcıları katkılar). Motor modülünün `notify` çağrısı `notifications`, `quotas` çağrısı `usage`, `providers` çağrısı da `providers` iznini gerektirir: izin yoksa çağrı hata fırlatır.

```ts
type PluginPermission = | "network"
	| "filesystem"
	| "process"
	| "native"
	| "ui"
	| "secrets"
	| "sessions"
	| "memory"
	| "git"
	| "notifications"
	| "usage"
	| "automations"
	| "agents"
	/** View the design assigned to a session; does not choose or remove designs or run servers. */
	| "designer"
	/** Contribute model providers to the engine's model list (`engine.providers.register`). */
	| "providers"
	/** Use engine-owned OAuth accounts. */
	| "accounts"
```

### PluginSettingEnumOption

Bir `enum` ayarının tek bir seçeneği.

```ts
interface PluginSettingEnumOption
```

**Üyeler**

- `value: string`

  Saklanan değer.

- `label: LocalizedText`

  Kullanıcının gördüğü metin.

### PluginSettingField

`agzPlugin.settings` alanlarından biri; aynı zamanda bir görünümün `form` bloğunun alan sözcüğüdür. Tür değeri belirler: `string`, `number`, `boolean` ve `enum` bir değer saklar (isteğe bağlı bir varsayılanla); `secret` yalnızca yazılabilirdir: varsayılanı yoktur ve uygulama onu bir daha göstermez, yalnızca son karakterlerini gösterir.

```ts
type PluginSettingField = | (PluginSettingBase & { type: "string"; default?: string; maxLength?: number })
	| (PluginSettingBase & { type: "number"; default?: number; min?: number; max?: number; integer?: boolean })
	| (PluginSettingBase & { type: "boolean"; default?: boolean })
	| (PluginSettingBase & { type: "enum"; options: PluginSettingEnumOption[]; default?: string })
	| (PluginSettingBase & { type: "secret" })
```

### PluginToolView

Aynı eklentinin kaydettiği bir aracın kartını süsler. `key`, özellik adlarından oluşan noktalı bir yoldur (`total`, `page.items`). Görünüm yalnızca karta ekler: tam argümanlar ve sonuç erişilebilir kalır.

```ts
interface PluginToolView
```

**Üyeler**

- `tool: string`

  Süslediği aracın adı.

- `card?: "agent"`

  Aracı ajan kartı olarak çizer ve gruplar.

- `title?: LocalizedText`

  Kartın başlığı.

- `subject?: { from: PluginToolViewSource; key: string; }`

  Kısa bir konu satırı.

- `facts?: { label: LocalizedText; from: PluginToolViewSource; key: string; values?: Record<string, LocalizedText> | undefined; }[]`

  Etiket ve değer çiftleri. `values`, en çok 32 ham değeri (1–64 karakterlik anahtarlar) yerelleştirilmiş etiketlerle eşler; eşleşmeyen değerler olduğu gibi gösterilir.

- `sections?: { label: LocalizedText; from: PluginToolViewSource; key: string; as: PluginToolViewSectionAs; }[]`

  Kartın daha büyük parçaları.

### PluginToolViewSectionAs

Bir araç kartı bölümünün değerini nasıl çizdiği.

```ts
type PluginToolViewSectionAs = "text" | "json" | "kv" | "list" | "markdown"
```

### PluginToolViewSource

Bir araç kartı parçasının değerini nereden okuduğu: çağrının argümanları ya da sonucu (yapılandırılmış içerik; yoksa metinden ayrıştırılan JSON).

```ts
type PluginToolViewSource = "args" | "result"
```

### PluginUiManifest

`agzPlugin.ui` alanının bildirdikleri: araç kartı süslemeleri, görünümler ve masaüstü arayüz modülü.

```ts
interface PluginUiManifest
```

**Üyeler**

- `toolViews?: PluginToolView[]`

  Eklentinin kendi araç kartlarının süslemeleri.

- `views?: PluginViewDeclaration[]`

  Eklentinin kaydettiği görünümler.

- `module?: PluginUiModuleDeclaration`

  Tek dosyalık masaüstü arayüz modülü; ui izni gerektirir.

### PluginUiModuleDeclaration

Cihaz onayıyla çalışan önceden derlenmiş masaüstü arayüz modülü.

```ts
interface PluginUiModuleDeclaration
```

**Üyeler**

- `entry: string`

  Paket içinde derlenmiş JavaScript modülünün yolu (en çok 4 MiB).

- `settings?: boolean`

  Modül kendi ayar bölümünü çiziyorsa true.

### PluginUserContent

Bir eklentinin kullanıcının kendi işini (tasarımlar, belgeler gibi) tuttuğu yer: oturumun proje klasörü altında `project:<göreli yol>` ya da AGZ Code ana klasörü altında `home:<göreli yol>`.

```ts
interface PluginUserContent
```

**Üyeler**

- `path: string`

  `project:<göreli yol>` ya da `home:<göreli yol>`.

- `description: LocalizedText`

  Orada ne tutulduğu, birkaç sözcükle.

### PluginViewDeclaration

Eklentinin `PluginAPI.registerView` ile kaydedebileceği bir görünüm (`statusbar` görünümü: motor modülünün `registerView` işleviyle).

```ts
interface PluginViewDeclaration
```

**Üyeler**

- `id: string`

  `registerView` ile çağrılan kimlik.

- `title: LocalizedText`

  Görünümün başlığı.

- `icon: PluginViewIcon`

  Görünümün simgesi.

- `place: PluginViewPlace`

  Uygulamanın gösterdiği yer.

- `refreshSeconds?: number`

  Yalnız `place: "statusbar"` ile: uygulama görünümü gösterdiği sürece bu sıklıkta (1 ile 3600 saniye arası) yeniden çizdirir. Verilmezse görünüm yalnız `invalidateView` çağrısından ya da bir eylemden sonra yeniden çizilir.

### PluginViewIcon

Bir görünümün adlandırabileceği simgeler (kebab-case Lucide adları).

```ts
type PluginViewIcon = | "activity"
	| "blocks"
	| "book-open"
	| "bookmark"
	| "bot"
	| "box"
	| "boxes"
	| "bell"
	| "bug"
	| "calendar"
	| "chart-bar"
	| "chart-line"
	| "chart-pie"
	| "clock"
	| "cloud"
	| "code"
	| "cpu"
	| "database"
	| "file-text"
	| "folder"
	| "gauge"
	| "git-branch"
	| "globe"
	| "hard-drive"
	| "heart"
	| "image"
	| "key"
	| "layout-dashboard"
	| "link"
	| "list"
	| "list-checks"
	| "lock"
	| "mail"
	| "map"
	| "memory-stick"
	| "message-square"
	| "package"
	| "play"
	| "plug"
	| "puzzle"
	| "rocket"
	| "search"
	| "server"
	| "settings"
	| "shield"
	| "sparkles"
	| "star"
	| "table"
	| "tag"
	| "terminal"
	| "user"
	| "users"
	| "workflow"
	| "wrench"
	| "zap"
```

### PluginViewPlace

Uygulamanın bir görünümü nerede gösterdiği. `panel`: oturumun sağ panelindeki bir sekme. `sidebar`: projenin bir sayfası. `statusbar`: uygulamanın durum çubuğunda bir öğe ve ondan açılan panel; böyle bir görünüm bir oturuma değil motora aittir, bu yüzden onu eklentinin motor modülü (`agzPlugin.engine`) kaydeder. `composer`: oturumun yazma alanının üstünde bir çubuk; boş çizim onu gizler.

```ts
type PluginViewPlace = "panel" | "sidebar" | "statusbar" | "composer"
```

### ToolAccessName

> **Deneysel: API herhangi bir sürümde değişebilir ya da kaldırılabilir**

Bir aracın bildirebileceği erişim adları.

```ts
type ToolAccessName = "read" | "modify" | "send" | "delete" | "download"
```

## Sistem istemi düzenlemeleri

### PluginPromptAddOp

Bir bölüme blok ekler. Kapalı bölümler dahil her bölümde kullanılabilir.

```ts
interface PluginPromptAddOp
```

**Üyeler**

- `op: "add"`

- `section: string`

  Bloğu alacak bölümün kimliği.

- `after?: string`

  Yeni bloğun arkasına geleceği blok. Yoksa ya da bir blok adı vermiyorsa, yeni blok bölümün sonuna eklenir.

- `id: string`

  Yeni bloğun kimliği; listesinde ve istemde benzersiz. Eklentinizin kimliğiyle başlatın.

- `text: string`

  Bloğun metni, 1 ila 20.000 karakter.

### PluginPromptAddSectionOp

Blokları ile birlikte bir bölüm ekler.

```ts
interface PluginPromptAddSectionOp
```

**Üyeler**

- `op: "add-section"`

- `after?: string`

  Yeni bölümün arkasına geleceği bölüm. Yoksa ya da bir bölüm adı vermiyorsa, yeni bölüm istemin sonuna eklenir.

- `id: string`

  Yeni bölümün kimliği; listesinde ve istemde benzersiz. Eklentinizin kimliğiyle başlatın.

- `heading: string`

  Bölümün başlığı, 1 ila 200 karakter.

- `blocks: PluginPromptBlock[]`

  Bölümün blokları, en çok 100.

### PluginPromptBlock

Yeni bir bölümün bloğu; `PluginPromptAddSectionOp` için.

```ts
interface PluginPromptBlock
```

**Üyeler**

- `id: string`

  Yeni bloğun kimliği; listesinde benzersiz: tek `.` ya da `-` ile birleştirilmiş küçük harf ve rakamlar. Eklentinizin kimliğiyle başlatın.

- `text: string`

  Bloğun metni, 1 ila 20.000 karakter.

### PluginPromptOp

Sistem isteminde bir düzenleme; `op` değerine göre ayırın.

```ts
type PluginPromptOp = | PluginPromptReplaceOp
	| PluginPromptRemoveOp
	| PluginPromptAddOp
	| PluginPromptAddSectionOp
```

### PluginPromptRemoveOp

Var olan bir bloğu kaldırır. `base`, `PluginPromptReplaceOp` ile aynı çalışır. Kapalı bölümlerde kullanılamaz.

```ts
interface PluginPromptRemoveOp
```

**Üyeler**

- `op: "remove"`

- `target: string`

  Kaldırılacak bloğun kimliği.

- `base: string`

  Bloğun geçerli metninin özeti.

### PluginPromptReplaceOp

Var olan bir bloğun metnini değiştirir. `base`, bloğun motordaki geçerli metninin özetine eşit olmalıdır; motor güncellemesi bu metni değiştirirse işlem `stale` olur ve uygulanmaz. Kapalı bölümlerde kullanılamaz.

```ts
interface PluginPromptReplaceOp
```

**Üyeler**

- `op: "replace"`

- `target: string`

  Değiştirilecek bloğun kimliği, örneğin `base.working.ground-claims`.

- `base: string`

  Bloğun geçerli metninin SHA-256 özetinin ilk 16 onaltılık karakteri; Ayarlar > Ajanlar > Sistem istemi bunu listeler.

- `text: string`

  Yeni metin, 1 ila 20.000 karakter.

### PluginSystemPrompt

`PluginManifest.systemPrompt` alanının adını verdiği JSON dosyası: ajanın sistem isteminde düzenlemeler, kod olarak değil veri olarak. `all` her ajana uygulanır; `agents` her ajan kimliği için bir liste tutar, yalnızca o ajana uygulanır ve bir hedef için listenin işlemi `all` işlemine üstün gelir. Her liste en çok 200 işlem tutar. Bir liste bir hedefi bir kez değiştirebilir (`replace` ya da `remove`) ve yeni bir kimliği bir kez bildirebilir. `replace` ve `remove` işlemleri `identity`, `role`, `instructions-and-trust` ve `approval-modes` kapalı bölümlerinde kullanılamaz; motor bunları `locked` olarak gösterir. Dosyanın tüm metni (her `text`, başlık ve blok metni) en çok 32.768 karakterdir. Bu türün adını vermediği bir alan, motorun tüm dosyayı reddetmesine yol açar. Ayarlar'da kullanıcının yaptığı düzenleme, aynı hedefteki eklenti düzenlemesine üstün gelir.

```ts
interface PluginSystemPrompt
```

**Üyeler**

- `all?: PluginPromptOp[]`

  Her ajan için düzenlemeler.

- `agents?: Record<string, PluginPromptOp[]>`

  Ajan kimliği başına düzenlemeler.

## Görünümler

### PluginGitDiff

Tek bir dosyanın farkı; `binary` ve `too_large` bölüm olmadan gelir.

```ts
interface PluginGitDiff
```

**Üyeler**

- `path: string`

- `origPath?: string`

- `staged: boolean`

- `kind: "binary" | "text" | "too_large"`

- `change: "added" | "copied" | "deleted" | "modified" | "renamed" | "unchanged"`

- `hunks: PluginGitHunk[]`

- `additions: number`

- `deletions: number`

### PluginGitDiffLine

Bir farkın tek satırı.

```ts
interface PluginGitDiffLine
```

**Üyeler**

- `kind: "add" | "context" | "del"`

- `text: string`

- `oldLine?: number`

- `newLine?: number`

- `noNewline?: boolean`

  Satırın dosya sonunda yeni satırı yok.

### PluginGitDiffRequest

`diff` ne alır: durumdaki bir yol, bir yeniden adlandırmanın kaynak yolu, hazırlanmış taraf, bağlam satırları.

```ts
interface PluginGitDiffRequest
```

**Üyeler**

- `path: string`

- `origPath?: string`

- `staged?: boolean`

- `context?: number`

### PluginGitFileStatus

Oturumun deposunda değişen tek bir dosya. Yollar depo köküne göredir.

```ts
interface PluginGitFileStatus
```

**Üyeler**

- `path: string`

- `origPath?: string`

  Bir yeniden adlandırmanın ya da kopyalamanın kaynağı.

- `index: PluginGitStatusLetter`

  Hazırlanmış taraf: HEAD ile indeks arası.

- `worktree: PluginGitStatusLetter`

  Hazırlanmamış taraf: indeks ile çalışma ağacı arası.

- `kind: "changed" | "renamed" | "unmerged" | "untracked"`

- `score?: number`

  Yeniden adlandırma ya da kopyalama benzerliği, 0 ile 100 arası.

- `added?: number`

  Çalışma ağacında eklenen ve silinen satırlar (dosya metinse).

- `removed?: number`

- `statKind?: PluginGitNumstatKind`

- `stagedAdded?: number`

  İndekste eklenen ve silinen satırlar (dosya metinse).

- `stagedRemoved?: number`

- `stagedStatKind?: PluginGitNumstatKind`

- `submodule?: boolean`

  Kayıt bir alt modüldür.

- `editedBy?: { sessionId: string; agentId?: string | undefined; tool: string; at: number; }`

  Bu motorun dosyayı yazan son ajan araç çağrısı (biliniyorsa).

### PluginGitHunk

Bir dosyanın farkının tek bir bölümü.

```ts
interface PluginGitHunk
```

**Üyeler**

- `header: string`

  `@@ -a,b +c,d @@ bölüm` satırı.

- `oldStart: number`

- `oldLines: number`

- `newStart: number`

- `newLines: number`

- `lines: PluginGitDiffLine[]`

### PluginGitNumstatKind

Bir satır sayısının neden yok olduğu: `binary` ikili dosya (ya da UTF-8 olmayan içerik), `too_large` dosya sayılamayacak kadar büyük, `unavailable` dosya okunamadı.

```ts
type PluginGitNumstatKind = "binary" | "too_large" | "unavailable"
```

### PluginGitStatus

Oturumun deposunun durumu.

```ts
interface PluginGitStatus
```

**Üyeler**

- `root: string`

  Deponun çalışma ağacı kökü.

- `prefix: string`

  Oturumun dizini, `root`a göre (`""`: kökün kendisi).

- `branch: string | null`

  Geçerli dal; HEAD ayrıkken `null`.

- `head: string | null`

  HEAD commit'i; ilk commit'ten önce `null`.

- `upstream?: string`

- `ahead?: number`

- `behind?: number`

- `files: PluginGitFileStatus[]`

  Hazırlanmış, hazırlanmamış ve izlenmeyen dosyalar; yok sayılan dosyalar listelenmez.

- `truncated: boolean`

- `revision: string`

  Deponun durumu değiştiğinde değişir.

### PluginGitStatusLetter

Değişen bir dosyanın tek harflik durumu: `.` değişmedi, `M` değişti, `T` türü değişti, `A` eklendi, `D` silindi, `R` yeniden adlandırıldı, `C` kopyalandı, `U` birleştirilmedi, `?` izlenmiyor.

```ts
type PluginGitStatusLetter = "." | "M" | "T" | "A" | "D" | "R" | "C" | "U" | "?"
```

### PluginJson

En çok 8 düzey derinliğinde bir JSON değeri.

```ts
type PluginJson = null | boolean | number | string | PluginJson[] | { [key: string]: PluginJson }
```

### PluginText

Dile bağlı olmayan metin ya da dil başına bir metin.

```ts
type PluginText = string | LocalizedText
```

### PluginView

`render` işlevinin döndürdüğü değer. Görünüm, uygulamanın kendi bileşenleriyle çizdiği veridir; uygulamada hiçbir eklenti kodu çalışmaz. Ev sahibi, bir sınırı aşan görünümü bütünüyle reddeder: 20 bölüm, bölüm başına 50 blok, başlıkta 200 karakter, metinde 10.000 karakter, kodda 20.000 karakter, liste ya da anahtar-değer bloğunda 100 öğe, 12 tablo sütunu, 200 tablo satırı, 32 form alanı, seri başına 240 değer, grafik başına 5 seri, bir düğme yükünde 4096 karakter ve tüm görünümde 262.144 karakterlik JSON.

```ts
interface PluginView
```

**Üyeler**

- `status?: PluginViewStatus`

  Yalnız `place: "statusbar"` ile bildirilen görünümde: öğenin çubukta gösterdiği. Verilmezse öğe, görünümün simgesini ve başlığını gösterir.

- `sections: PluginViewSection[]`

  Bölümler, sırayla. Durum çubuğu görünümünde bunlar öğeden açılan paneldir.

### PluginViewActionInput

Uygulamanın bir eylemle gönderdikleri: düğmenin `payload` değeri ya da formun `values` değerleri.

```ts
interface PluginViewActionInput
```

**Üyeler**

- `blockId: string`

  Bunu gönderen düğmenin ya da formun kimliği.

- `payload?: PluginJson`

  Düğmenin yükü.

- `values?: Readonly<Record<string, PluginViewFieldValue>>`

  Formun değerleri.

### PluginViewActionResult

Bir eylem, hata fırlatarak ya da `{ error }` döndürerek başarısızlığını bildirir; uygulama metni gösterir.

```ts
interface PluginViewActionResult
```

**Üyeler**

- `error?: string`

  Uygulamanın başarısızlık olarak gösterdiği metin.

### PluginViewBlock

Bir bölümün tek bir bloğu. `kind` değerine göre ayırın.

```ts
type PluginViewBlock = | (BlockBase & {
			kind: "designPreview";
			screen: string;
			state?: string;
			width?: number;
			theme?: string;
			locale?: string;
	  })
	| (BlockBase & { kind: "text"; text: PluginText; muted?: boolean })
	| (BlockBase & { kind: "keyValue"; items: Array<{ label: PluginText; value: PluginText }> })
	| (BlockBase & {
			kind: "metric";
			label: PluginText;
			value: string | number;
			hint?: PluginText;
			tone?: PluginViewTone;
	  })
	| (BlockBase & {
			/** One figure with its facts and its recent values as a small line. */
			kind: "stat";
			icon?: PluginViewIcon;
			label: PluginText;
			value: string | number;
			tone?: PluginViewTone;
			/** Short facts under the value; at most 6. */
			details?: PluginText[];
			/** The recent values, oldest first; at most 240, none negative. */
			series?: number[];
			/** Fixes the line's scale (100 for a percentage); otherwise the largest value sets it. */
			max?: number;
	  })
	| (BlockBase & {
			/** A chart of up to 5 series over the same points. */
			kind: "chart";
			type: PluginViewChartType;
			/** The chart's accessible name. */
			label: PluginText;
			/** The names of the points; as many as the longest series. */
			x?: string[];
			/** At most 240 values per series. */
			series: Array<{ name: PluginText; values: number[]; tone?: PluginViewTone }>;
			/** Fixes the scale's top. */
			max?: number;
			/** Written after a value, for example `%` or `ms`. */
			unit?: string;
	  })
	| (BlockBase & {
			/** A share of a whole as a ring. */
			kind: "ring";
			label: PluginText;
			value: number;
			/** The whole; default 100. */
			max?: number;
			/** What the ring reads as; default the percent. */
			text?: string;
			hint?: PluginText;
			tone?: PluginViewTone;
	  })
	| (BlockBase & {
			kind: "table";
			/** `align: "end"` puts a column of numbers against its right edge. */
			columns: Array<{ key: string; label: PluginText; align?: "start" | "end" }>;
			/** At most 200 rows; more go through an action. The keys are column keys. */
			rows: Array<Record<string, PluginViewCell>>;
			empty?: PluginText;
	  })
	| (BlockBase & { kind: "list"; items: Array<{ text: PluginText; description?: PluginText }>; ordered?: boolean })
	| (BlockBase & { kind: "badge"; text: PluginText; tone?: PluginViewTone })
	| (BlockBase & { kind: "alert"; tone: Exclude<PluginViewTone, "neutral">; title?: PluginText; text: PluginText })
	| (BlockBase & { kind: "code"; code: string; language?: string })
	| (BlockBase & { kind: "progress"; label?: PluginText; value: number; max?: number })
	| (BlockBase & { kind: "empty"; title: PluginText; description?: PluginText })
	| {
			kind: "button";
			id: string;
			label: PluginText;
			/** The action name `PluginViewDefinition.action` receives. */
			action: string;
			payload?: PluginJson;
			variant?: PluginViewButtonVariant;
			/** A question the app asks before it runs the action. */
			confirm?: PluginText;
	  }
	| {
			kind: "form";
			id: string;
			/** The `agzPlugin.settings` vocabulary; a field's `key` is its stable id. */
			fields: PluginSettingField[];
			/** Current values of the non-secret fields. */
			values?: Record<string, PluginViewFieldValue>;
			submit: { label: PluginText; action: string; confirm?: PluginText };
	  }
	| {
			kind: "link";
			id: string;
			label: PluginText;
			/** http or https only; the app opens it externally and shows the host. */
			url: string;
	  }
```

### PluginViewButtonVariant

Bir düğmenin görünümü.

```ts
type PluginViewButtonVariant = "primary" | "secondary" | "destructive"
```

### PluginViewCell

Bir tablo hücresinin içeriği.

```ts
type PluginViewCell = PluginText | number | boolean | null
```

### PluginViewChartType

Bir `chart` bloğunun serilerini nasıl çizdiği.

```ts
type PluginViewChartType = "line" | "area" | "bar"
```

### PluginViewContext

`render` ve `action` işlevlerinin aldıkları.

```ts
interface PluginViewContext
```

**Üyeler**

- `locale: PluginViewLocale`

  İstemcinin dili.

- `cwd: string`

  Oturumun çalışma dizini; motor modülünün kaydettiği görünümde kullanıcının ev dizini.

- `statusOnly?: boolean`

  Paneli kapalı bir durum çubuğu görünümü: yalnız `status` gösterilir, bu yüzden `render` bölüm döndürmeyebilir.

- `signal: AbortSignal`

  Ev sahibinin zaman sınırı geçtiğinde iptal olur.

- `git?: PluginViewGit`

  Oturumun salt okunur Git'i; `git` izni yoksa, görünüm bir kenar çubuğu ya da durum çubuğu görünümüyse ya da ev sahibi bunu sunmuyorsa bulunmaz.

### PluginViewDefinition

`PluginAPI.registerView` için bir görünüm.

```ts
interface PluginViewDefinition
```

**Üyeler**

- `render: (ctx: PluginViewContext) => PluginView | Promise<PluginView>`

  Görünümü döndürür. Hiçbir şeyi değiştirmemelidir: ev sahibi, uygulama görünüme ihtiyaç duyduğunda onu çağırır.

- `action?: ((name: string, input: PluginViewActionInput, ctx: PluginViewContext) => void | PluginViewActionResult | Promise<...>)`

  Görünümde bir düğmenin ya da formun adını verdiği eylemi çalıştırır. Bir başarısızlığı bildirmek için `{ error }` döndürün ya da hata fırlatın.

### PluginViewFieldValue

Bir `form` alanının tuttuğu değer. Gizli bir alanın değeri uygulamaya asla geri gönderilmez.

```ts
type PluginViewFieldValue = string | number | boolean
```

### PluginViewGit

Görünümü gösteren oturumun Git deposuna salt okunur erişim. Yalnız eklentinin manifesti `git` iznini listelediğinde ve görünüm bir oturumda gösterildiğinde bulunur; yalnızca kendisiyle geldiği `render` ya da `action` çağrısı sırasında çalışır.

```ts
interface PluginViewGit
```

**Üyeler**

- `status: () => Promise<PluginGitStatus>`

  Oturumun deposundaki değişen dosyalar.

- `diff: (request: PluginGitDiffRequest) => Promise<PluginGitDiff>`

  Tek bir dosyanın farkı.

### PluginViewLocale

Uygulamanın iki dili. Ev sahibi, istemcinin dilini `render`a iletir.

```ts
type PluginViewLocale = "en" | "tr"
```

### PluginViewSection

İsteğe bağlı bir başlığı olan blok grubu.

```ts
interface PluginViewSection
```

**Üyeler**

- `id?: string`

  Görünüm içinde benzersiz.

- `title?: PluginText`

  Bölümün başlığı.

- `collapsed?: boolean`

  Bölümü, kullanıcı başlığından açana kadar kapalı çizer; bu durumda bölümün başlığı olmalıdır.

- `blocks: PluginViewBlock[]`

  Bloklar, sırayla.

### PluginViewStatus

Bir durum çubuğu görünümünün çubukta gösterdiği: en çok 4 gösterge. Hiç gösterge yoksa öğe gösterilmez.

```ts
interface PluginViewStatus
```

**Üyeler**

- `items: PluginViewStatusItem[]`

### PluginViewStatusItem

Durum çubuğu öğesinin bir göstergesi: kısa bir etiket ve değeri.

```ts
interface PluginViewStatusItem
```

**Üyeler**

- `label?: PluginText`

  Örneğin `CPU`.

- `value: string`

  En çok 40 karakter, örneğin `%12`.

- `tone?: PluginViewTone`

  Değeri renklendirir.

- `ring?: number`

  Değerden sonra, bu yüzdeye (0 ile 100 arası) kadar dolu bir halka çizer.

### PluginViewTone

Bir metriğin, rozetin ya da uyarının renk rolü.

```ts
type PluginViewTone = "neutral" | "info" | "success" | "warning" | "danger"
```
