# Hafıza

Hafıza, ajanların oturumlar arasında hatırladığı bilgilerdir: kararlar, tercihler, proje bilgisi ve edinilen dersler. Her parça bir **kayıt**tır: kısa bir başlık, tek cümlelik bir açıklama, Markdown içerik ve öteki kayıtlara bağlar. Ajan bir işe başlamadan önce hafızasına bakar; bildiğini yeniden çıkarmak zorunda kalmaz.

Kalıcı kurallarını hafızaya değil `AGENTS.md` dosyalarına yaz. Hafıza bilgi ve geçmiş içindir.

## Ne kaydedilir

Lider ve botlar kayıt yazabilir. İşçi de yazabilir. Keşifçi, analist, araştırmacı ve doğrulayıcı yalnız okur ve arar. Eklentinin yanıt ajanı da çalıştığı sürece genel hafızayı okuyup arayabilir, ancak kayıt yazamaz.

Kayıtları Hafıza sayfasında görür, düzenler ve birbirine bağlarsın. Hafıza bakım botu kopyaları birleştirir, eskimiş kayıtları düzeltir.

## Kapsam: proje ve genel

Her kayıt ya bir projeye aittir ya da geneldir:

- Bir projenin klasöründen yazılan kayıt o projeye girer. O proje çalışırken yalnız onun kayıtları ve genel kayıtlar görünür; öteki projelerin kayıtları görünmez.
- Bir projeden değil de genel olarak yazılan kayıt, her projede görünür.

Hafıza iki ayrı depodur. Genel hafıza `~/.agz-code/memory/` altında durur. Her botun kendi hafızası `~/.agz-code/bots/<bot>/memory/` altında durur ve projesi yoktur. İki depo arasında bağ kurulmaz; bir botun genel hafızaya erişimi yoktur, yalnız okuma ya da okuma ve yazma olarak verilebilir.

## Ajanın hafızayı kullanması

- Her kullanıcı mesajında motor, mesaja yakın kayıtların kimliğini, başlığını ve açıklamasını mesajın yanına ekler. İçerikleri eklenmez; yakın kayıt yoksa hiçbir şey eklenmez.
- İşçi ve doğrulayıcı görevlerine bu ipucu eklenmez. Lider onlara gereken kayıtları kimliğiyle verir.
- Lider ve bot oturumları açılışta hafıza kayıtlarının bir başlık listesini alır. Oturum sırasında yazılan kayıtlar bu listede yer almaz; ajan onları aramayla bulur.

## Arama

Arama her zaman kelimelerle yapılır. Gömme açıksa (OpenRouter bağlı ve anlamsal arama açık) anlam araması da eklenir. Gömme kapalıysa ya da alınamazsa arama yalnız kelimelerle çalışır ve sonuç bunu söyler.

## Yedekler ve geri yükleme

- Genel hafıza her gün bir kez `~/.agz-code/memory/backups/` klasörüne yedeklenir. Son yedi günlük yedek tutulur.
- Ayarlar > Hafıza > Yedekler bölümü yedekleri yeniden eskiye doğru listeler. "Geri yükle" yalnız genel hafızada çalışır ve yalnız çalışan masaüstü uygulamasında yapılabilir. Seçilen günün hafızası geri gelir; o günden sonraki değişiklikler kaybolur.
- Geri yüklemeden önce mevcut hafıza `backups/pre-restore-<ms>.db` adıyla kopyalanır, yani hiçbir şey kaybolmaz. Yedek bozuksa ya da eksikse hiçbir şey değişmez ve neden gösterilir.
- Her yedekte `memory/export/memory.jsonl` dosyası yeniden yazılır. Bu dosya her kaydı bir satırda tutar; veritabanı zarar görürse kayıtlar buradan kurtarılabilir.

## Geçmiş ve geri alma

Her yazma geçmişe düşer: zaman, oturum, yazanın rolü ya da botu (uygulamadan yapılan değişiklik için "user"), işlem ve eski ile yeni metin. Düzenleme ve geri alma satırları kaydın önceki halini de tutar; bu anlık görüntüler 90 gün saklanır.

- Düzenlenmiş bir kayıt, hafıza bakım botu tarafından o düzenlemeden önceki haline döndürülebilir.
- Silinen bir kaydın içeriği ve bağları geçmişte kalır. Hafıza bakım botu bu kaydı kendi kimliğiyle geri getirebilir.
- Geçmişi uygulama göstermez; bakım botu `memory_history` aracıyla süzer.
