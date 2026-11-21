# Ajanlar

Bir oturumda işi bir **lider** (ana ajan) yönetir. Lider isteğini anlar, işi yapar ya da sınırlı parçalarını uzman ajanlara verir, sonucu doğrulayıp sana bildirir. Her uzman kendi bağlamında çalıştığı için senin konuşman uzamaz.

Uzmanlar başka uzman çağıramaz ve başka bir oturuma erişemez. Yalnız lider bu işleri yapar.

## Roller

| Rol | Ne yapar | Dosya değiştirir mi |
|---|---|---|
| lead (lider) | İsteği sahiplenir, işi yapar ya da parçalar, doğrular ve sana bildirir | Evet |
| explorer (keşifçi) | Kodu hızlıca arar; her bulguyu dosya yolu ve satır numarasıyla verir | Hayır |
| researcher (araştırmacı) | Bir soruyu kod ve güncel web kaynaklarından yanıtlar; kaynaklarını ve belirsizliklerini de verir | Hayır |
| analyst (analist) | Veriyi, günlükleri ve kodu ölçerek yanıtlar; betiklerini sonradan yeniden çalıştırmak için saklar | Hayır |
| worker (işçi) | Sınırlı bir değişikliği yapar, projenin denetimlerini çalıştırır ve kanıtla bildirir | Evet |
| verifier (doğrulayıcı) | Teslimi kullanıcının gözüyle sınar; her ölçütü ekran görüntüleriyle puanlar. Teslimi değiştirmez | Hayır |

Beceri geliştirici ve beceri bakımcısı adlı iki yardımcı ajan da vardır. Birincisi, beceri devirlerini sınanmış becerilere çevirir; ikincisi var olan becerileri onarır ya da birleştirir.

Bir eklenti ikinci görüş için salt okunur bir danışman sunabilir. Eklentiye özel ajan Ayarlar > Ajanlar'da görünür. Onu yalnızca kendi eklentisi, bir eklenti aracıyla başlatabilir; alt ajan aracı ve iş akışı görevleri bu ajanı başlatamaz. Bkz. [Ajan tanımları](./manifest.md#ajan-tanimlari).

## İş akışları ve paralel iş

Büyük bir iş lider tarafından birden çok parçaya bölünüp paralel çalıştırılabilir. Buna iş akışı denir: parçalar dalgalar hâlinde çalışır. İş akışını duraklatabilir, sürdürebilir ya da iptal edebilirsin.

Paralel uzmanlar aynı dosyayı aynı anda değiştiremez; bu kuralı [güvenlik sayfasında](./safety.md#ayni-dosyaya-iki-alt-ajan) anlatıyoruz.

## Hedefler ve yapılacaklar

- **Yapılacaklar:** Çok adımlı bir iş, oturumun üstünde bir yapılacaklar listesine dönüşür.
- **Hedef:** Hedefler motordan değil, uygulamayla gelen AGZ eklentisi `agz/goal`dan gelir. `/goal <amaç>` ile belirlersin; kabul ölçütleri `- ` ile başlayan satırlarla arkasından gelebilir. Ajan `run /goal <amaç>` satırını düğme olarak da sunabilir; hedef yalnız sen düğmeye basınca başlar. Mesaj kutusunun üstündeki hedef çubuğu eklentinin kendi görünümüdür.
  - Ajan her çalışmadan sonra, hedefin tamamlandığını ya da olanaksız olduğunu kanıtla bildirene kadar kendiliğinden devam eder. Yargıç ancak o zaman çalışır.
  - Yargıç gerçek bir model çağrısıdır: oturumun modeli ya da eklentinin `judgeModel` ayarındaki model. Karşılandı, henüz değil ya da olanaksız yanıtını verir. Henüz değil yanıtı eksik kalan somut maddeleri sıralar ve ajan bu listeyi alır. Art arda ret hedefi duraklatmaz.
  - Yargıç çağrısı başarısız olursa iddia yerinde kalır ve yargıç, her başarısızlıkta uzayan bir beklemeden sonra yeniden sorar.
  - Ajanın sana ihtiyacı olduğunda engellenmek yerine `needs_user` türünde bir engel (block) ile sorar. Hedef o zaman seni bekler ve bir sonraki mesajınla devam eder.
  - Hedef varsayılan olarak kendiliğinden 25 kez devam eder (eklentinin `continuationAllowance` ayarı), sonra sen sürdürene kadar durur.

## Botlar

Botlar oturumun ötesinde kalan ajanlardır: her birinin kendi klasörü, hafızası ve izinleri vardır. Botlar `~/.agz-code/bots/` altında durur ve Ayarlar > Botlar bölümünde görünür.

- **Ana bot:** Senin ana konuşman. Gelen işi uygun bota verir ya da kendisi yapar, botların zamanlamasını ayarlar ve yenilerini oluşturur.
- **Sabit bot:** Tek bir oturumu ve tek bir klasörü olan bot. İşini kendi `BOT.md` dosyasındaki talimatlarla yapar.
- **Hafıza bakım botu:** Hafızadaki kopyaları birleştirir, karışık kayıtları ayırır ve yanlış silinenleri geri getirir.

Bir eklenti `contributes["agz/bots/templates"]` altında, özeti paket göreli `{ "$file": "..." }` olan bir bot şablonu sunabilir; bunu `agz/bots` eklentisi kullanır, ama sen onaylamadan bot oluşmaz.
