# Namaz Yolu sitesi: yükleme notları

Site `server/tools/build_site.py` ile üretilir (`python3 server/tools/build_site.py`) ve `server/site-yeni/` klasörüne yazılır.
Veri sorumlusu adı: `server/tools/site_common.py` içindeki `CONTROLLER` değeri.

Hostinger `public_html` içine yüklenecekler:
1. `site-yeni/` içindeki her şey (mevcut `gizlilik.html` ve `index.html` yerine geçer; `mesajlar/`, `sunucu/` klasörlerine dokunma).
2. `yonetim/` klasörü. `config.sample.php` dosyasını `config.php` yapıp şifre özetini yaz. Panel `../sunucu/config.php` (hatim veritabanı) ve `../mesajlar/` klasörünü kullanır.
3. `icerik/` klasörü panel ilk kaydettiğinde kendiliğinden oluşur (ramazan.json, duyuru.json).
