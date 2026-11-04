# İslami Yaşam

Namaz vakitleri, Kur'an-ı Kerim, kıble pusulası ve günlük ibadet araçları sunan Android uygulaması (Expo / React Native).

## Özellikler (v0.1)

- **Ana sayfa:** sıradaki vakte geri sayım, günün vakitleri, Miladi + Hicri tarih, günün ayeti
- **Namaz vakitleri:** 30 günlük liste. Diyanet yöntemiyle (imsak 18°, yatsı 17°, temkinli) cihaz konumuna göre internetsiz hesaplanır
- **Bildirimler:** vakit girişinde ve isteğe bağlı olarak vakitten 5–45 dk önce
- **Kur'an-ı Kerim:** 114 sure, Arapça metin + Diyanet meali, açılan sureler internetsiz okunur
- **Kıble pusulası:** konuma göre kıble açısı, hizalanınca titreşim
- **Zikirmatik** ve **kaza namazı takibi**
- **Ayarlar:** konum, bildirim tercihleri, Hicri tarih düzeltmesi

## APK nasıl alınır

`main` dalına her gönderimde GitHub Actions APK'yı derler ve **Releases** sayfasına koyar. Telefondan son sürümü açıp `.apk` dosyasını indirip kurabilirsin.

## Geliştirme

```bash
npm install
npx tsc --noEmit
npx expo run:android   # bağlı cihaz veya emülatörde geliştirme sürümü
```

Kod `src/` altında: ekranlar `src/app/`, hesaplama ve veri `src/lib/`, sabit veriler `src/data/`.

## Kaynaklar

- Mushaf sayfa/satır düzeni: [quran-qcf4](https://github.com/MohamadHajjRabee/quran-qcf4) paketinin JSON verisi (MIT). `scripts/build-mushaf-layout.mjs` ile `src/data/mushaf-layout.json` dosyasına dönüştürülür. Paketteki Kral Fahd fontları ticari kullanıma izinli olmadığı için **kullanılmaz**.
- Kur'an fontu: [Amiri Quran](https://github.com/aliftype/amiri) (SIL Open Font License 1.1)
- Ayet ayet ses: cdn.islamic.network (alquran.cloud)

- Namaz vakti hesabı: [adhan-js](https://github.com/batoulapps/adhan-js) (Türkiye yöntemi)
- Kur'an metni ve meal: [alquran.cloud](https://alquran.cloud) — `quran-uthmani`, `tr.diyanet`
