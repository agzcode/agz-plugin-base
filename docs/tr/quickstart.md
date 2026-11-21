# Hızlı başlangıç

Bu sayfa `agz plugin` komutuyla bir eklenti oluşturur, uygulamada bağlar ve aracını çağırır. Komut [Komut satırı](./cli.md) sayfasında anlatılır.

## Başlamadan önce

- Node.js 22.19 veya daha yeni.
- `agz plugin create` kitten gelir: `@agz-yazilim/plugin-kit` kurulu bir klasörde `npx agz plugin` olarak çalıştırın.

## Eklentiyi oluşturmak

Boş bir klasörde önce `npm init -y` çalıştırın: orada bir `package.json` ya da `node_modules` yoksa npm, bunlardan birini içeren en yakın üst klasöre kurar. Sonra kiti npm'den kurun, eklentiyi onunla oluşturun ve eklentinin bağımlılıklarını kurun:

```sh
npm init -y
npm install --save-dev --save-exact --ignore-scripts @agz-yazilim/plugin-kit@1.5.0
npx agz plugin create notes-helper --kind skill+extension --id acme/notes-helper
cd notes-helper
npm install --ignore-scripts
```

`create`, eklentiyi oluşturan kitin ve onun SDK'sının sürümlerini `devDependencies` içine yazar; bu yüzden eklenti klasöründeki `npm install` aynı sürümleri kurar.

Eklentinin kimliği `acme/notes-helper` olur: `acme` yayıncıdır, yani yayımladığınız her şey için seçtiğiniz ad; onu kendi adınızla değiştirin. `skill+extension` türü, `skills/notes-helper` içinde bir beceri ve `extensions/index.ts` içinde uzantı kodu verir. Uzantı dosyası şöyle başlar:

```ts
import { defineTool, type PluginAPI, Type } from "@agz-yazilim/plugin-sdk";

const echo = defineTool({
	name: "notes_helper_echo",
	label: "Notes Helper echo",
	description: "Return the given text unchanged. Replace this with the plugin's real tool.",
	parameters: Type.Object({ text: Type.String({ description: "The text to return." }) }),
	// "codemode": callable from Code Mode scripts, not declared to the model on every turn.
	exposure: "codemode",
	execute: async (_toolCallId, params) => ({ content: [{ type: "text", text: params.text }], details: {} }),
});

export default function (agz: PluginAPI) {
	agz.registerTool(echo);
	// A hook runs before the call: here it refuses an empty echo with a reason the agent can read.
	agz.on("tool_call", async (event) => {
		if (event.toolName === "notes_helper_echo" && String(event.input.text ?? "") === "") {
			return { block: true, reason: "notes_helper_echo needs a non-empty text" };
		}
		return undefined;
	});
}
```

Hazır olduğunda yankı aracını eklentinin kendi aracıyla değiştirin; [Eklenti kodu API'si](./extension-api.md) bir aracın, bir kancanın ve diğer parçaların neler yapabildiğini anlatır.

## Denetlemek ve test etmek

```sh
npm test
npx agz plugin check
```

`npm test`, şablonun `test/` klasörüne koyduğu test dosyasını çalıştıran `agz plugin test` komutunu çalıştırır. `check` manifesti, SDK aralığını ve tipleri denetler ve paketin içereceği dosyaları listeler. İkisi de geçerse 0 ile çıkar.

## Uygulamada bağlamak

1. Ayarlar > Eklentiler'i açın ve yerel bir klasörden eklenti kurun: `notes-helper` klasörünü seçin. Satırında Geliştirme rozeti görünür. Klasör kopyalanmaz: uygulama onu olduğu yerden okur; bu yüzden bir sonraki değişikliğiniz yeni bir kurulum gerektirmez.
2. Açık oturumların yüklemesi için Oturumları yenile düğmesine basın. Yeni bir oturum başlarken yükler.

## Aracı çağırmak

Aracın erişim biçimi `codemode`dur: model onu her turda görmez, bir Code Mode betiği `tools.<araç adı>(argümanlar)` biçiminde çağırır. Bir oturum açın ve ajandan şu betiği Code Mode'da çalıştırmasını isteyin:

```js
return await tools.notes_helper_echo({ text: "hello" });
```

Sonuç `hello` içerir. Sonra aynı çağrıyı boş bir metinle, `{ text: "" }` ile çalıştırmasını isteyin: kanca onu reddeder ve betik `notes_helper_echo needs a non-empty text` hatasıyla başarısız olur.

## Geliştirmeye devam etmek

`npx agz plugin dev` her değişiklikten sonra klasörü denetler ve Ctrl+C'ye kadar çalışır. Klasör bağlıyken uygulama, bir değişiklikten sonra eklentiyi yükleyen oturumları yeniden yükler. Eklenti hazır olduğunda `npx agz plugin pack` denetler ve arşivi klasöre yazar. Katalog üzerinden dağıtmak için [Genel katalogda imzalı sürümler](./testing-packaging.md#genel-katalogda-imzali-surumler) adımlarını izle.

## Buradan sonrası

`create` şablonları bir aracı, bir kancayı ve bir beceriyi kapsar. Öteki katkı türleri için `agz-plugin-base` deposunda kopyalanacak bir şablon ve her birinin tam bir örneği vardır: arka plan işi için motor modülü, manifestte bildirilen MCP sunucusu, proje kapsamlı ayarlar, eklentinin kendi veri klasörü, panel görünümü ve kodsuz eklenti (ajanlar, istemler, bot şablonu). Listesi [Örnek eklentiler](./examples.md) sayfasındadır.
