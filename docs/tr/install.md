# Kurulum

agz-code bir masaüstü uygulamasıdır. Uygulamanın arkasında bir motor çalışır; ajanları, oturumları, hafızayı ve ayarları o yönetir. Bu sayfa kurulumu, veri klasörünü, güncelleme kanallarını ve verileri başka bir bilgisayara taşımayı anlatır.

## Linux'a kurmak

[İndirme sayfasından](/indir/) iki paketten birini al. İndirdiğin dosyanın SHA-256 değerini, kartta yazan değerle karşılaştırarak doğrula: `sha256sum <dosya>`.

**AppImage** (`agz-code_<sürüm>_amd64.AppImage`) kurulum gerektirmez. Dosyayı çalıştırılabilir yap, sonra başlat:

```sh
chmod +x agz-code_<sürüm>_amd64.AppImage
./agz-code_<sürüm>_amd64.AppImage
```

**Debian ve Ubuntu tabanlı sistemlerde (.deb)** paketi `apt` ile kur:

```sh
sudo apt install ./<indirdiğin-dosya>.deb
```

## Windows

Windows kurulum dosyası indirme sayfasında yer alır, ama agz-code henüz gerçek bir Windows bilgisayarında test edilmedi; bu sayfadaki adımların hiçbiri orada doğrulanmadı. Aşağıdaki tablolar kodu okuyarak çıkarıldı. Önemli bir işi Windows'ta yapmadan önce bunu bil.

Ajanların komut çalıştırabilmesi için bir bash kabuğu gerekir. [Git for Windows](https://git-scm.com/download/win) kur; yoksa her komut `No bash shell found` hatasıyla durur. Cygwin ya da MSYS2 gibi başka bir bash kullanıyorsan onu PATH'e ekle. `agz.json` dosyasındaki `shellPath` ayarı yalnız ajan komutlarına uyar, Designer'ın önizleme sunucularına uymaz.

**Windows'ta kapalı olanlar**

| Özellik | Ne görürsün | Yerine ne yapmalısın |
|---|---|---|
| Kimlik bilgisi dosyası kalkanı | Ayarlar > Ajanlar, "Kimlik bilgisi dosyaları" bölümünde bir uyarı çıkar: ajanın çalıştırdığı bir komut, agz-code'un kimlik bilgisi dosyalarındaki sağlayıcı anahtarlarını, OAuth belirteçlerini ve kayıtlı parolaları okuyabilir. Düzenleme ve yazma araçları yine bu dosyalara yazmayı reddeder. | Ajanların komut çalıştırmasına yalnız güvendiğin projelerde izin ver. Komutların bu anahtarları okumaması gerekiyorsa agz-code'u Linux'ta kullan. |
| Salt okunur kabuk, araştırmacı ajan | Oturum başında uyarı çıkar ve ajanın her bash çağrısı reddedilir. | Ajanın okuma ve web araçlarını kullan; denetimleri kendin çalıştır. |
| Salt okunur kabuk, öteki salt okunur ajanlar | Oturum başında uyarı çıkar. Yalnız bir örüntü denetimi açık yazmaları durdurur; bir betik ya da kurulum projeyi yine değiştirebilir. | Oturumdan sonra projedeki değişiklikleri denetle, örneğin `git status` ile. |
| Komut bellek koruması | Uyarı çıkmaz. Komutlar Linux'taki ayrı systemd kapsamını almaz; bu kapsam sayesinde sistem, bellek tükendiğinde yalnız sorunlu komutu sonlandırabilir. | Bellek kullanımını Görev Yöneticisi'nden izle. Belleği şişiren bir arka plan işlemini ajandan durdurmasını iste ya da Görev Yöneticisi'nden sonlandır. |
| Beceri örnek testleri | Test, `skill test sandbox unavailable: Linux bubblewrap is required` hatasıyla durur. | Bu testleri Linux'ta çalıştır. |
| Chrome bağlantısı | Chrome bağlantısı ayarları, bağlantının bu sistemde henüz kullanılamadığını söyler. | Uygulama içi tarayıcıyı kullan. |
| Terminal | Terminal paneli, terminalin Linux ya da macOS gerektirdiğini söyler. | Windows Terminal gibi kendi terminalini kullan. |

**Windows'ta farklı çalışanlar**

| Özellik | Ne görürsün | Yerine ne yapmalısın |
|---|---|---|
| Arka plan işlemini durdurma | `process_kill` işlem ağacını hemen sonlandırır; düzgün kapanma adımı yoktur. İşlem 3 saniye sonra hâlâ çalışıyorsa durdurma tekrarlanır. | İşlemin yazmalarını bitirmesini bekle ya da işi kaydettikten sonra kendin durdur. |
| Özel dosya kipleri | Uyarı çıkmaz. agz-code'un Linux ve macOS'ta özel tuttuğu dosyalar (ayarlar, oturum açma verileri, erişim belirteçleri) bulundukları klasörün izinlerini alır. | Veri klasörünü Windows kullanıcı profilinde tut (varsayılan budur) ve paylaşılan yerlere kopyalama. |
| Dosya konumu denetimi | Uyarı çıkmaz. Motor, bir dosyanın yerini açtığı dosyadan değil yolundan denetler; okuma ya da yazma sırasında yerine takılan bir bağlantı bu denetimi geçebilir. | Ajanları, başka programların aynı anda değiştirdiği klasörlerde çalıştırma. |
| Chrome belleği | Uyarı çıkmaz. agz-code Chrome'un belleğini okuyamaz; bu yüzden çok büyüyen bir sayfa kendiliğinden yenilenmez. | Uzun oturumlarda Chrome'un belleğini Görev Yöneticisi'nden izle; sürekli büyürse görevi sonlandır. |

## Veri nerede durur

Motorun ayar ve oturum klasörü `~/.agz-code/agent`'tır. Öteki veriler `~/.agz-code/` altındadır:

| Yol | İçerik |
|---|---|
| `~/.agz-code/agent/` | Ayarlar (`agz.json`), oturumlar, özel ajan profilleri, sağlayıcı kimlik dosyaları |
| `~/.agz-code/memory/` | Genel hafıza ve günlük yedekleri |
| `~/.agz-code/bots/` | Botların klasörleri ve hafızaları |
| `~/.agz-code/skills/` | Genel beceriler |
| `~/.agz-code/plugins/` | Eklenti deposu: kurulu eklentiler, kayıtları, ayarları, gizli değerleri ve kendi verileri (bkz. [Depolama](./storage.md)) |
| `~/.agz-code/data/` | Üretilen görseller, sesler ve 3B modeller |
| `~/.agz-code/AGENTS.md` | Genel talimatların |

Bir projenin kendi ayarları o projenin `.agz-code/` klasöründe durur ve depoyla birlikte gider. Bu klasör projenin eklentilerini de anar (`plugins.json`) ve eklenti ayarlarının projeye ait değerlerini tutar (`plugin-config/`); eklenti paketlerinin kendisi her zaman eklenti deposundadır.

## Güncellemeler ve kanallar

Güncellemeleri Ayarlar > Güncellemeler bölümünden denetlersin. Denetim masaüstü uygulamasında ve bağlı bir motorla çalışır. Güncelleme kanalı, bir denetimde hangi sürümlerin sunulacağını belirler; kanalı değiştirmek hiçbir şeyi kurmaz.

| Kanal | Sunulan sürümler |
|---|---|
| Alfa | Her sürüm, erken deneme sürümleri dahil |
| Beta | Beta ve kararlı sürümler |
| Kararlı | Yalnız kararlı sürümler |

## Verileri başka bir makineye taşımak

Verilerini tek bir arşive koymak ve başka bir makinede açmak için motorun `data-archive` komutunu kullanırsın. Komut motorun veri klasörü kilidini alır; uygulama çalışıyorsa çıkış kodu 75 ile durur, bu yüzden önce uygulamayı kapat.

```sh
<motor> data-archive export ~/agz-veri.tar.gz
<motor> data-archive import ~/agz-veri.tar.gz
```

`<motor>` yerine kurulumuna uygun motor dosyasını yaz:

- Linux deb: `/opt/agz-code/resources/agz-engine`
- AppImage: uygulamayı bir kez açtıktan sonra `~/.cache/agz-code/engine/<sürüm>/agz-engine`. Ya da imajı `./agz-code_<sürüm>_amd64.AppImage --appimage-extract` ile aç ve `squashfs-root/resources/agz-engine` dosyasını kullan.

Dışa aktarma, aşağıda sayılanlar dışında her şeyi alır: oturumlar, hafıza, `agz.json` ve öteki ayarlar, genel `AGENTS.md`, genel beceriler, botlar, özel ajan profilleri ve üretilen dosyalar. Eklenti deposundan kurulu eklentilerin kaydını, ayarlarını ve verilerini alır.

Şunlar dışarıda kalır:

- Sağlayıcı anahtarları, oturum açma bilgileri ve eklentilerin gizli değerleri (`plugins/secrets.json`). Bunları yalnız `export` komutuna `--with-credentials` verirsen eklersin.
- Kurulu eklenti paketleri. Arşiv onların kaydını taşır: içe aktarımdan sonra onları Ayarlar > Eklentiler'deki Güncelle ile yeniden kur (bkz. [Depolama](./storage.md#baska-bir-bilgisayara-tasimak)).
- Ayar dosyalarındaki gizli değerler (API anahtarları, MCP başlıkları). Bunlar boşaltılır; içe aktarma hangilerinin boşaldığını listeler ve sen yeniden girersin.
- Tarayıcı profili ve çerezler, önbellekler, günlükler, geçici dosyalar, geçmiş dizini ve projelerin `.agz-code/` klasörleri.

İçe aktarma kuralları:

- Hedef veri klasörü ile `skills`, `bots`, `memory`, `data`, `plugins` klasörleri ve `AGENTS.md` boş olmalı ya da hiç bulunmamalı. Dolu biriyle karşılaşırsa komut hiçbir şey yazmadan durur. Hedef farklıysa `--target <agentDir>` ile belirt.
- Hedefteki motor, arşivi yazan sürümle aynı ya da daha yeni olmalı.
- Çıkış kodu 0 tamamlandı, 1 hata, 75 motor çalışıyor demektir.

Arşivi hassas say: oturum metinlerinde yazdığın her şey gizli değer içermese bile arşivde bulunur.

Sonraki adım: [İlk oturum](./first-session.md).
