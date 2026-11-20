# GitHub'dan geliştirme

Bir eklenti GitHub deposundan kurulabilir, yerel bir klonla geliştirilebilir ve o depodan güncellenebilir; hangi güncellemeleri alacağını ref belirler. Bu sayfa motorun kabul ettiği kaynak biçimlerini, sabitleme ve güncellemenin nasıl davrandığını ve geliştirme döngüsünü verir. Aşağıdaki davranış, GitHub yerine geçen yerel bir depoyla çalıştırıldı (kur, etiketle, dal, güncelle, kaldır).

## Kaynak biçimleri

Kurucu kısa biçimleri ayarlara `git:github.com/owner/repo[@ref]` olarak yazar ve `https://github.com/owner/repo` adresini https üzerinden klonlar. `git:` ya da `https://` kaynağındaki bir `#ref`, ayarlarda `@ref` olarak saklanır.

| Girdiğin | Saklanan |
|---|---|
| `owner/repo` | `git:github.com/owner/repo` |
| `owner/repo@v1.2.0` | `git:github.com/owner/repo@v1.2.0` |
| `github:owner/repo@main` | `git:github.com/owner/repo@main` |
| `git:github.com/owner/repo@v1` | değişmez |
| `git:github.com/owner/repo#v1` | `git:github.com/owner/repo@v1` |
| `https://github.com/owner/repo` | değişmez |
| `https://github.com/owner/repo.git@v1` | değişmez |
| `https://github.com/owner/repo#v1` | `https://github.com/owner/repo@v1` |

Ref bir etiket, bir dal (`feature/x` olur) ya da bir commit'tir; harf, rakam, `.`, `_`, `/` ve `-` içerir, `-` ile başlamaz. Ayarlar > Eklentiler > Eklenti kur bölümünde GitHub türünde bir Depo alanı ve isteğe bağlı bir Ref alanı vardır.

Reddedilenler:

| Biçim | Neden |
|---|---|
| `ssh://git@github.com/owner/repo`, `git@github.com:owner/repo.git` | Kurulum işi yalnız https ile klonlar; bu biçimler hiç kabul edilmez |
| `http://github.com/owner/repo` | Düz http reddedilir; https kullan |
| `https://user:pw@github.com/owner/repo` | Adres kimlik bilgisi taşıyamaz; böylece ayarlara asla girmezler |
| `owner/repo#main`, `github:owner/repo#main` | Kısa biçim yalnız `@ref` alır: `owner/repo@main` yaz. `#ref`, `git:` ve `https://` biçimlerinde kabul edilir |
| `owner/repo/sub` | Yalnız `owner/repo` ve isteğe bağlı `@ref` |
| `git:github.com/repo` | Ana makineden sonra `<owner>/<repo>` gerekir |
| `owner/repo@-x` | Ref `-` ile başlayamaz |

## Sabitleme ve güncelleme

Bir kaynağın hangi güncellemeleri alacağını ref belirler. Etiket ya da commit ref'i sabitlenmiştir: asla kaymaz ve Ayarlar onun için güncelleme sunmaz. Dal ref'i (`@main`) ya da ref'siz kaynak (deponun varsayılan dalı) ise, uzaktaki o dal çıkarılandan ilerlediğinde güncelleme sunulur.

`v1.0.0` ve sonra `v1.1.0` etiketli depoyla çalıştırmanın gösterdiği:

| Kaynak | Güncelleme denetimi | Güncelle'den sonra |
|---|---|---|
| `owner/line-count@v1.0.0` | güncelleme sunulmaz | `v1.0.0` kalır (etiket yeniden çekilir) |
| `owner/line-count` | varsayılan dal ilerlediyse güncelleme sunulur | varsayılan dalın en yeni commit'ine geçer (`1.1.0`) |
| `owner/line-count@main` | `main` ilerlediyse güncelleme sunulur | Güncelle `main`'in o anki ucuna geçirir |
| ayarlarda ref `@v1.0.0` yapıldı | yok | Güncelle `v1.0.0`'ı yeniden çıkarır |

Yani etiket ya da commit asla kaymaz. Dal, varsayılan dal dahil, yalnız kullanıcı Güncelle'ye bastığında ilerler. Yerel yolların güncellenecek bir şeyi yoktur. Yeni sürüm çıkarmak için etiket gönder ve kullanıcılara ref'i değiştirmelerini söyle.

Kurulum ve güncelleme, `package.json` varsa çıkışta `npm install --omit=dev --legacy-peer-deps --ignore-scripts` çalıştırır. Kurulum betikleri yalnız kullanıcı onay penceresinde Kurulum betiklerini çalıştır seçeneğini işaretlerse çalışır; kurulum ve güncelleme her durumda onay ister ([Git projesini eklentiye çevirmek](./convert-git-project.md)). Çıkış, ajan dizininin (kullanıcı kapsamı) ya da `<project>/.agz-code/git` (proje kapsamı) altında `git/github.com/<owner>/<repo>` içinde durur; eklenti deponun köküdür, yani `package.json` dosyasında `agzPlugin` manifesti olmalı.

## Özel depolar

https üzerinden bir özel depo, git kimlik yardımcın (örneğin gh, Git Credential Manager ya da libsecret) onu zaten okuyabiliyorsa kurulur ve güncellenir. agz-code kimlik bilgisi saklamaz ve hiçbir zaman sormaz: git kimlik sormadan çalışır; okuyamadığı bir depo, git kimlik yardımcısından söz eden bir hatayla başarısız olur. ssh biçimleri reddedilmeye devam eder. Alternatif, depoyu kendi git ayarınla klonlayıp klonu yerel yol olarak kurmaktır (sonraki bölüm); güncellemeler senin `git pull` komutundur.

## Yerel klonla geliştir

```sh
git clone git@github.com:owner/my-plugin.git ~/src/my-plugin
```

1. Klonda `manifest_check` çalıştır; `ok` olana kadar.
2. Ayarlar > Eklentiler > Eklenti kur bölümünde Yerel yol'u seç (ya da Klasör seç) ve klonun mutlak yolunu gir. Yerinde okunur ve Geliştirme rozetini gösterir.
3. Her değişiklikten sonra Oturumları yeniden yükle'yi kullan. Hiçbir şey kopyalanmaz, yenilenecek bir şey yoktur.
4. Çalışınca yerel yol girdisini kaldır ve GitHub kaynağını bir etiketle kur.

## Etiket yayımla

```sh
git tag v1.0.0
git push origin v1.0.0
```

Sonra Ayarlar'dan `owner/my-plugin@v1.0.0` kur. Etiketlemeden önce `pack_check` ve [test ve paketleme sayfasındaki](./testing-packaging.md) denetimleri çalıştır: depo kökü eklentidir, bu yüzden `package.json` içindeki `files` Git kurulumunu sınırlamaz (bütün çıkış kullanılır), ama npm paketlerini sınırlar.
