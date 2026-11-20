# Güvenlik

Bu sayfa bir eklentinin neye erişebildiğini ve ev sahibinin hangi korumaları uyguladığını anlatır. Ev sahibi eklenti kodunu bir kum havuzuna (sandbox) koymaz; bu yüzden aşağıdaki korumalar kodun etrafındaki adımları kapsar, kodun kendisini değil.

## Ne çalışır, hangi yetkiyle

Bir eklentinin uzantı kodu, onu yükleyen her oturumda motor sürecinde, motorun yetkisiyle çalışır. Araçları, kancaları ve komutları dosya okuyup yazabilir, ağı kullanabilir ve `api.exec` üzerinden süreç başlatabilir; `api.exec` komutu bir kabuk olmadan çalıştırır. Eklentinin motor modülü (`agzPlugin.engine`) aynı süreçte, aynı yetkiyle, eklenti açık olduğu sürece bir kez çalışır; hiçbir oturum açık değilken de. Kurmadan önce eklentinin kodunu okuyun.

## İzinler

Bir eklenti neye ihtiyaç duyduğunu `agzPlugin.permissions` içinde bildirebilir. [İzinlerin tam listesi](./manifest.md#izinler) manifest sayfasındadır.

Liste bir beyandır; eklenti kodunu yalıtmaz. Motor listeyi gösterir ve kullanıcının onayını kaydeder. Motorun bazı API'leri ilgili iznin bildirilmesini ister, ama liste eklenti kodunun yapabileceklerini sınırlamaz. Yalnız `network` bildiren bir eklenti yine dosya okuyabilir ve program başlatabilir, çünkü kodu motorun yetkisiyle çalışır. Liste, yazarın eklentinin ne yaptığını söylediğini kullanıcıya gösterir ve sonraki bir değişikliği görünür kılar:

- Uygulama izin bildiren bir eklentiyi kurarken kurulum, indirme bittikten sonra bekler. Uygulama listeyi düz sözlerle gösterir; kurulum yalnız kullanıcı onaylarsa sürer. Vazgeçilirse indirilen kopya atılır.
- Güncelleme de aynı biçimde bekler, ama yalnız kurulu sürümün onaylanmadığı izinler için.
- Yerel klasör yerinde okunur; bu yüzden manifesti her an değişebilir. Yeni bir izin bildirdiğinde eklentinin kartında bir not çıkar ve kullanıcı onu orada onaylar. Not bilgilendirir; eklentinin yüklenmesini durdurmaz.
- Bekleme yalnız istemci isterse olur (motorun API'sinde `askPermissions`); uygulama ister. İstemeyen bir istemci, örneğin kullanıcısı olmayan bir betik, beklemez: kurulum isteğinin kendisi onaydır.

## Eklenti erişimi

Standart erişim API'si deneyseldir (`@experimental`). Kurulumda gösterilen izin listesinden farklı olarak `agzPlugin.access`, motorun eklentiye ait kayıtlı uzantı araçlarının her çağrısında denetim yapmasını sağlar. Bu manifest alanı isteğe bağlıdır. Liste tekrarsız olmalı, `read` içermeli ve yalnızca şu adları kullanmalıdır:

| Ad | Ne sağlar |
|---|---|
| `read` | Kullanıcı verisini okuma. Her araç çağrısı için gerekli. |
| `subagents` | Alt ajanlara ve iş akışı görevlerine okuma ve indirme araçlarını kullanma izni. |
| `modify` | Her işlem için onay alarak veri değiştirme. |
| `send` | Her işlem için onay alarak veri gönderme. |
| `delete` | Her işlem için onay alarak veri silme. |
| `download` | İndirilen dosyaları kaydetme. |
| `automations` | Olay kaynaklarını kullanıcının kurduğu otomasyonlara açma. |

Bildirilen her ad için Ayarlar > Eklentiler > eklentinin ayarları > Erişim bölümünde bir düğme görünür. Başlangıçta hepsi kapalıdır. Diğerlerini değiştirmek için önce Okuma'yı açmak gerekir. İsteğe bağlı `agzPlugin.accessNotes` nesnesi, düğmenin bu eklentide ne işe yaradığını açıklar. Her anahtar `agzPlugin.access` listesinde bulunmalıdır; her notta dil başına en çok 500 karakterlik `en` ve `tr` metni bulunmalıdır. `settings` anahtarlarını `access_` ile başlatmayın: motor bu öneki [kullanıcı kapsamındaki erişim düğmelerine](./storage.md#erisim-dugmeleri) ayırır.

Motor, erişim bildiren bir eklentinin aracını çalıştırmadan önce şu koşulları denetler:

- Eklenti kullanıcı kapsamında olsa bile proje güvenilir olmalıdır. Okuma ve aracın bildirdiği tüm erişim düğmeleri açık olmalıdır. Bir hizmette oturum açmak ajana erişim vermez.
- Alt ajanlar ve iş akışı görevleri yalnızca okuma ve indirme araçlarını kullanabilir. Bunun için `access_subagents` da açık olmalıdır.
- `modify`, `send` veya `delete` bildiren her araç, uygulamanın arayüzünün bağlı olduğu bir ana oturum gerektirir. Araç, değişikliği yapmadan önce [yapacağı işlem için onay](./extension-api.md#arac-erisimi-ve-onay) istemelidir. Arayüzsüz çalışmalarda bu işlemler yapılamaz.

Otomasyon kaynağını kaydetmek için `agzPlugin.permissions` içinde yine `automations` izni gerekir. Deneysel erişim sözleşmesine göre, erişim bildiren bir eklentinin kaynakları ancak `access_read` ve `access_automations` açıkken listelenir ve olay iletebilir. Bu, iş akışı görevine eklentinin yazma işlemi yapan araçlarını çağırma izni vermez.

Bu denetim, ajanın eklentiye ait kayıtlı uzantı araçlarını kullanmasını sınırlar. **Eklentinin kendi kodunu yalıtmaz:** kancalar, komutlar ve motor modülü kodu motorun yetkileriyle çalışmaya devam eder. Bir veriyi okuma veya indirme izni, onu başkasına gönderme izni değildir. MCP araçları aşağıdaki ayrı ajan erişimi kurallarına uyar.

Dışarıdan alınan e-postaları, iletileri, belgeleri ve diğer içerikleri güvenilmeyen veri olarak ele alın; bunlar talimat değildir. İçeriğe gömülü talimatlardan alıcı ya da işlem seçmeyin. Bu verileri güvenilir talimatlardan ayrı tutun. Onay gerektiren bir işlemden önce kullanıcıya gerçek hedefi ve işlemin içeriğini gösterin.

## Eklenti hesapları

Hesap erişimi deneyseldir. `agzPlugin.accounts` içinde kimlik, `google` veya `microsoft` sağlayıcısı ve kapsamları bildirin; `permissions` listesine `accounts`, `access` listesine `read` ekleyin. Oturum açmak ajana erişim vermez; kullanıcı Okuma'yı da açmalıdır. Oturum açma yalnızca motorun çalıştığı yerel makinede başlatılabilir. `reconnect_required`, kullanıcının hesabı yeniden bağlaması gerektiğini belirtir.

Belirteç motorda kalır; hesap API'si onu eklenti koduna vermez. Bu API, eklentinin diğer kodunu yalıtmaz; ama her istek aşağıdaki kurallara tabidir ve birini çiğneyen çağrı hiçbir şey göndermez:

- **URL**, bildirilen sağlayıcının https API kökenlerinden birinde bir metindir. Yerine bir `Request` nesnesi verilirse reddedilir; düz `http` de reddedilir, loopback adresi dahil: bir sağlayıcıyı yerel sunucuya yalnız motorun kendi testleri yöneltebilir.
- **Seçenekler** tek bir düz nesnedir ve isteğe yalnız `method`, `headers` ile `body` kopyalanır. `dispatcher`, `signal` ya da `redirect` gibi başka her anahtar ve nesnenin yerine verilen bir `Request` ya da sınıf örneği reddedilir. `Authorization` üstbilgisini kendiniz vermeyin: hesabın belirtecini motor ekler. `body` bir metin, `Uint8Array`, `ArrayBuffer` ya da `URLSearchParams` olabilir.
- **Yönlendirmeler** izlenmeden araca döner; böylece belirteç başka bir sunucuya gitmez. 401 yanıtında belirteç bir kez yenilenir ve istek bir kez tekrarlanır.
- **Salt okuma aracı** GET veya HEAD gönderir. Tek POST'ları Microsoft Graph'ın iki okuma uç noktasıdır: JSON gövdesinde boş olmayan ve tümü GET olan bir `requests` listesi taşıması gereken `$batch` ile POST olması gereken `search/query`. Böyle bir aracın bunlar dışındaki her GET/HEAD dışı isteği reddedilir.
- **Yazma aracı** `modify`, `send` veya `delete` bildirir ve aynı araç çağrısında kendi `ctx.access.approve()` çağrısının döndürdüğü onay belgesini verir. Motor belgeyi bu çağrıya, o işlem için kendisinin verdiğini denetler: eklentinin kendi ürettiği ya da başka bir araç çağrısından gelen belge reddedilir.
- **Alt ajanlar, iş akışı görevleri ve motor modülleri** Graph dahil yalnız GET veya HEAD gönderir.

Her fetch için `access_read` açık olmalıdır.

## MCP araçları ve ajan erişimi

Bir eklentinin MCP sunucusu, kodunun geri kalanıyla aynı yetkiyle çalışır; ama bir ajan onun araçlarını yalnızca kullanıcı o sunucuyu o ajana verdiyse çağırabilir. Varsayılanda hiçbir ajan MCP sunucusuna erişmez; ana ajan (lead) da dahildir; yüklü bir beceri, kullanıcının onayıyla yapılandırılmış bir sunucuyu ana ajana açabilir. Kullanıcı sunucuyu Ayarlar > Ajanlar > Araçlar'da verir. Ajanın erişimi kapsamayan her MCP aracı ya da kaynak aracı çağrısı, sunucuya ulaşmadan reddedilir. Kural ve ret metni için [eklenti kodu API'si sayfasına](./extension-api.md) bakın.

## Gizli bilgiler

`secret` türündeki bir ayar, eklentinin normal ayarlarının dışında tutulur. Motor onu eklenti deposunun `secrets.json` dosyasında (`~/.agz-code/plugins/secrets.json`, yalnız kullanıcı okuyabilir) saklar; bu dosya, sağlayıcı anahtarlarını tutan `auth.json` dosyasından ayrıdır. Uygulama yalnızca bir gizli değerin ayarlı olduğunu ve değer dört karakter ya da daha uzunsa son dört karakterini görür. Eklentinin kendi uzantıları gizli değerlerini `getPluginSettings()` ile okur; bu çağrı yalnızca o eklentinin kendi alanlarını döndürür. Bu sınır API'nin sınırıdır, motorun değil: eklentinin kodu motorun yetkisiyle çalışır ve kimlik bilgisi kalkanı onu sarmadığı için `secrets.json` ve `auth.json` dosyalarını doğrudan okuyabilir. Bu yüzden kurulu her eklenti, diğer eklentilerin gizli değerlerini ve sağlayıcı anahtarlarını okuyabilir. Yalnızca kodunu okuduğunuz eklentileri kurun.

Normal ayarlar deponun `config/<anahtar>.json` dosyasında saklanır. Düz bir kaldırma eklentinin ayarlarını ve gizli değerlerini sonraki bir kurulum için bırakır; "Ayarlarını ve verisini de sil" kutusu işaretliyken yapılan kaldırma bunları siler (bkz. [Depolama](./storage.md#kaldirma-neyi-siler)). Bir projenin bir eklentinin ayarları için tuttuğu kendi değerleri proje klasöründe durur ve hiçbir zaman gizli değer içermez. Bir kimlik bilgisini varsayılan değere, paketin bir dosyasına ya da bir URL'ye koymayın. Örneğin issue-tracker örneği, URL'sinde kimlik bilgisi olan bir uç noktayı reddeder ve belirteci Authorization üstbilgisi (Bearer) olarak gönderir.

## Kurma ve güncelleme

- Bir npm paketi `npm install --ignore-scripts` ile kurulur; böylece yaşam döngüsü betikleri (`preinstall`, `install`, `postinstall` ve `prepare`) çalışmaz. `runScripts: true` ile yapılan bir kurulum ya da güncelleme bunları çalıştırır. Betikleri atlanmış bir paket `scripts_not_run` sorununu alır; sorun hangi paketlerin etkilendiğini adıyla söyler.
- Git kaynağı klonlanır ve aynı bayrakla kurulur; yani klonun `prepare` betiği varsayılan olarak çalışmaz.
- Kurma ve güncelleme açık bir onay ister (motorun API'sinde `confirm: true`).
- Kurma ve güncelleme onayları, eklentinin motorun yetkileriyle çalıştığını ve diğer eklentilerin gizli değerlerini ile sağlayıcı anahtarlarını okuyabileceğini uyarır. İzin bildiren bir eklenti, [İzinler](#izinler) bölümünde anlatılan ikinci onayı alır.
- Paket bir hazırlık klasörüne indirilir ve yalnız tamamlandığında kurulu sürüm olur. Güncelleme kurulu klasörü hiç değiştirmez: yeni sürümü onun yanına ekler.
- Kurulu iki eklenti aynı kimliği paylaşmaz. `agzPlugin.id` değeri başka bir kaynaktan zaten kurulu olan bir kurulum, kayıt ya da kurulu bir sürüm değişmeden reddedilir; böylece bir paket, kullanıcının zaten sahip olduğu bir eklentinin yerini, ayarlarını ya da verisini alamaz. Kimlik indirilen paketten okunur: hazırlık klasörüne indirme ve işaretlediyseniz kurulum betikleri o ana kadar çalışmış olur.
- Yerel bir klasör kopyalanmaz. Motor onu olduğu yerden okur; klasör geliştiricinin kendi klasörüdür.

## Kurulumdan sonra değişen dosyalar

Motorun kurduğu ya da güncellediği bir npm ya da git paketi için motor, paketin sürümünü, npm bütünlük değerini ya da git işlemesini ve dosyalarının bir özetini kaydeder. Her yüklemede kurulu dosyalar bu kayıtla karşılaştırılır. Dosyaları sonradan değişmiş bir paket yüklenmez; satırı `changed_since_install` der. Yerel klasör denetlenmez: değişmesi beklenir. Kayıt, kullanıcının kendi yetkilerine sahip birini durdurmaz; çünkü o kaydı dosyaların yanında yeniden yazabilir.

## Güvenilmeyen projeler

Bir proje eklentilerini `<proje>/.agz-code/plugins.json` dosyasında anar. Bu dosya ve projenin kendi ayar değerleri yalnızca kullanıcı o projeye güvendiğinde etkili olur. Güvenilmeyen bir projede oturumlar onun eklentilerini yüklemez; liste bunları salt okunur gösterir ve değiştirmek için güven gerekir. Kullanıcı kapsamındaki eklentiler proje güveninden bağımsız yüklenir. Projenin dosyası eklentileri yalnız anar: paketler, öteki her kurulumla aynı onayla, kullanıcının eklenti deposuna kurulur.

## Kimlik bilgisi kalkanı

Motor kendi kimlik bilgisi dosyalarını ajanların erişiminden uzak tutar. Bunlar sağlayıcı anahtarları, MCP OAuth belirteçleri, motorun erişim belirteçleri, uzak motorların belirteçleri ve tarayıcının kayıtlı parolalarıdır; ayrıca kullanıcının `agents.json` içindeki `shellHiddenPaths` alanına eklediği yollar. Kalkan üç şey yapar:

- `edit` ve `write`, bu yolları her işletim sisteminde reddeder; sembolik ve sabit bağlantılar üzerinden gelen erişimler de reddedilir.
- bubblewrap (`bwrap`) kurulu bir Linux'ta her kabuk komutu, var olan kimlik bilgisi dosyaları ve klasörleri maskelenmiş olarak çalışır. Diğer sistemlerde ya da bwrap yoksa ya da engellenmişse kabuk maskelenmez; Ayarlar nedenini gösterir.
- Kalkan, ajanın `edit` ve `write` araçlarını ve kabuk komutlarını sarar. Motor sürecinde çalışan bir eklentinin uzantı kodunu sarmaz.

Sınırları:

- Kimlik bilgisi dosyalarını doğrudan okumaya karşı gizler. Yalıtım değildir: yazma açık kalır, diğer dosyalar bilerek okunabilir kalır; bunlar arasında `~/.ssh`, `~/.git-credentials` ve `~/.config/gh` vardır.
- Kendi kullanıcı ad alanına ihtiyaç duyan bir komut (iç içe `bwrap`, `unshare`, rootless podman ya da Chromium kum havuzu) sarmalayıcının içinde başarısız olur.
- Yazabilen bir beceri betiği sarmalanmaz.
- Kullanıcının D-Bus oturumu erişilebilir kalır; bir komut yine masaüstü anahtarlığına ulaşabilir.
- Kalkan diğer araçlar için bir güvence vermez; bu sayfa, diğer araçların kimlik bilgisi dosyalarını reddettiğini iddia etmez.
