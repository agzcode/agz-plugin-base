# Güvenlik ve onaylar

agz-code ajanlara bilgisayarında gerçek işler yaptırır: dosya düzenler, komut çalıştırır, tarayıcıyı kullanır. Bu sayfa hangi korumaların açık olduğunu, neyin senin onayına bırakıldığını ve hangi sınırların kaldığını anlatır.

## Kimlik bilgileri

Sağlayıcı anahtarların, oturum açma belirteçlerin ve kayıtlı parolaların durduğu dosyalar Linux'ta ajanın kabuğundan gizlenir. Ajanın komutları [bubblewrap](https://github.com/containers/bubblewrap) (`bwrap`) ile çalışır ve şu dosyalar komutlara boş görünür:

- `~/.agz-code/agent/auth.json` ve `mcp-auth.json`; `agz/` altındaki `provider-accounts.json` ve `server-tokens.json`
- Masaüstü uygulamasının `engines.json` (uzak motorların belirteçleri) ve `browser-passwords.json` (kayıtlı parolalar) dosyaları

Okuma araçları bu dosyaları göstermez, düzenleme ve yazma araçları bu yolları reddeder. Diğer dosyalara yazma serbesttir.

Bu bir tam yalıtım değildir:

- Ajan dosyalara yazmaya ve ağa çıkmaya devam eder. Bu bir kum havuzu (sandbox) değildir.
- Komut, kullanıcının D-Bus üzerinden erişilen systemd oturumunu ya da anahtarlığı kullanabilir. Bu yol kapatılmaz.
- Linux dışında bu koruma yoktur: ajanın komutları anahtarlarını okuyabilir. Uygulamanın koruma ekranı her sistem için durumu açıkça söyler.
- bubblewrap kurulu değilse koruma kapalıdır. Koruma ekranı bunu gösterir; `bwrap` paketini kurup uygulamayı yeniden başlatman gerekir.

## Onaylar

Beş işlem sınıfı senin kararına bağlanabilir. Her sınıf için ajan ya sorar, ya izin verilir ya da reddedilir:

| Sınıf | Ne zaman sorulur |
|---|---|
| Uzak sunucuya yayımlama | `git push`, `gh release create`, paket yayımlama, `docker push` |
| Proje dışında silme | Proje ve geçici klasörler dışındaki bir yolda `rm` ve benzerleri |
| Kayıtlı girişli sitede form gönderme | Uygulama içi tarayıcı, girişli olduğun bir sitede form gönderir |
| Kişilere mesaj gönderme | Posta programları, GitHub sorun ve çekme isteği yorumları, mesaj gönderen MCP araçları |
| Beceri için MCP sunucusu açma | Yüklü bir beceri MCP sunucusunu başlatır; her beceri ve sunucu için bir kez sorulur |

Soru penceresinde üç seçenek vardır: "Bir kez izin ver", "Bu projede her zaman izin ver" (MCP sorusunda "Bu beceri ve sunucuya her zaman izin ver") ve "Reddet". Yanıt verilmezse 300 saniye sonra istek reddedilir.

Sınırları da bil:

- Onay, komut metnine bakarak karar verir. Komutu çalışma anında kuran yapılar (`$(echo git) push` gibi) algılamayı atlatır. Komut metnindeki `CDPATH` ele alınır: `cd` göreli bir adla yapılırsa klasör bilinmez sayılır ve ardından gelen göreli silme sorulur. Motorun kendi ortamındaki `CDPATH` ajanların çalıştırdığı komutlardan çıkarılır; böylece `cd sub`, onayın varsaydığı gibi geçerli klasörün altındaki `sub`'a gider. `find` ile silme başlangıç yoluna bakılarak denetlenir: proje ve geçici klasörler dışındaki bir başlangıç yolu sorulur, proje içindeki sorulmaz. Başlangıç yolu proje kökü ya da üst klasörlerinden biriyse ve komutta onu dışarıda bırakabilecek bir şey yoksa bu da sorulur (`find <proje kökü> -delete`); `-name`, `-type` ya da `-mindepth 1` gibi bir koşul varsa başlangıç yolunun silinmediği kabul edilir.
- Kişilere mesaj sınıfı kabuktaki posta programlarını, `gh` yorumlarını ve mesaj gönderen MCP araçlarını kapsar. MCP araçları adlarına bakılarak seçildiği için bazı mesaj araçları kaçabilir.

Sınıf ayarlarını Ayarlar > Onaylar bölümünde değiştirirsin. İlk açılış sihirbazının seçimi [ilk oturum sayfasında](./first-session.md#onaylar) anlatılır.

## Harcama tavanları

Ayarlar > Kullanım ve maliyet > Kullanım tavanları bölümünde gün ya da oturum için bir tavan koyarsın. Tavan dolar (liste fiyatına göre), token ya da model dakikası (modelin yanıt vermek için harcadığı süre) olarak ölçülür.

Tavana varınca iş durur ve bekler; hiçbir çalışma kaybolmaz. Sürdür ile kaldığı yerden devam eder ya da tavanı yükseltirsin. Günlük tavan gün değiştiğinde yeniden açılır. Mevcut kurulumlarda tavan kapalı gelir.

## Aynı dosyaya iki alt ajan

Bir liderin alt ajanları aynı dosyayı aynı anda değiştiremez. Dosyayı ilk düzenleyen ajan o dosyanın sahibi olur. Bir başka alt ajan aynı dosyayı düzenlemeye kalkarsa sahibin adıyla reddedilir; sahibin çalışması bitene kadar istek reddedilmeye devam eder. Lider bu kuralın dışındadır: lider her dosyaya yazabilir. İş akışının çocukları kendi kilidiyle korunur.

Kapsam dışı kalanlar: komut kabuğu ya da MCP araçlarıyla yapılan yazmalar. Alt ajanın, daha önce dokunmadığı bir dosyayı `write` ile baştan yazması sonuca bir not olarak eklenir.

## Ajanın düzenlemelerini geri almak

Değişiklikler paneli ajanın dosya düzenlemelerini geri almana izin verir. Bir turu ya da bütün oturumu geri alabilirsin. Git olmasa da çalışır; geri almadan önce panel neyin geri yükleneceğini gösterir.

- Ajandan sonra bir başkası aynı dosyayı değiştirdiyse, ajanın değişikliği yine geri alınır; yeter ki ajanın dokunduğu satırların hiçbiri o kişi tarafından değiştirilmemiş olsun. Bu satırlar değiştirildiyse dosyaya dokunulmaz ve dosya dışarıda bırakılanlar listesinde görünür.
- Terminal komutlarının yaptığı değişiklikler geri alınamaz. Panel bunları ayrıca listeler.

## Uzak motor

Uygulama başka bir bilgisayarda çalışan bir motora da bağlanabilir; telefon da bu yolla bağlanır. Motor varsayılan olarak yalnız kendi bilgisayarında (`127.0.0.1`) dinler. Uzak erişimi Ayarlar > Uzak erişim bölümünde açarsın.

- Her istemci bir erişim belirteci sunmak zorundadır. Motor belirteçleri yalnız özet olarak saklar; belirteç oluşturulduğunda bir kez gösterilir.
- Motor bağlantıyı kendisi şifrelemez: düz HTTP ve WebSocket kullanır. Başka bir ağdan bağlanacaksan şifreli bir tünel kullan: SSH port yönlendirmesi, bir VPN ya da TLS sonlandıran bir ters vekil ya da tünel.
- Motor bir ters vekil ya da tünelin arkasında çalışıyorsa yalnız bu bilgisayarda dinlemeye devam edebilir.
