# -*- coding: utf-8 -*-
"""Namaz Yolu sitesini üretir: python3 server/tools/build_site.py  ->  server/site-yeni/"""
import os, shutil, json, sys
sys.path.insert(0, os.path.dirname(__file__))
from site_common import *
import site_legal

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(ROOT, "site"); OUT = os.path.join(ROOT, "site-yeni")

def ic(path, extra=""):
    return f'<div class="ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" aria-hidden="true">{path}</svg></div>'
ICONS = ['<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
 '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>', '<path d="M4 12l5 5L20 6"/>',
 '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>', '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>']

H = {
"tr": dict(
 title="Namaz Yolu · Ezan Vakti, Kur'an-ı Kerim ve Kıble Uygulaması",
 desc="Namaz Yolu: bulunduğun yere göre ezan vakitleri ve bildirimler, Medine mushafıyla Kur'an-ı Kerim, kıble pusulası, namaz takibi, hatim, Ramazan imsakiyesi, dualar ve resimli Cuma mesajları. Ücretsiz Android uygulaması.",
 h1='Günlük ibadet yolunda <span>yanında.</span>',
 lead="Bulunduğun yere göre dakikası dakikasına ezan vakitleri, Medine mushafıyla Kur'an-ı Kerim, kıble pusulası, namaz takibi, hatim ve dualar. Hepsi tek, sade ve ücretsiz bir uygulamada.",
 play="Google Play'den indir", more="Neler var?", note="Android telefon, tablet ve Android TV için · 9 dil · Hesap açmak gerekmez",
 f_h="İhtiyacın olan her şey", f_s="İnternet olmadan da çalışan vakit hesabı, hesap açmadan kullanım ve telefonunda kalan verilerle.",
 feats=[("Ezan vakitleri ve bildirim","Türkiye'de Diyanet yöntemiyle, diğer ülkelerde yerel yöntemle hesaplanan vakitler; uygulama kapalıyken de gelen bildirimler ve seçilebilir ezan sesleri."),
  ("Kur'an-ı Kerim","Medine mushafı düzeninde okuma, okunan ayetin vurgulandığı tilavet, Diyanet meali ve 30-60-90 günlük okuma planı."),
  ("Kıble ve camiler","Telefon eğik dursa bile doğru gösteren kıble pusulası ve yakındaki camilere yol tarifi."),
  ("Namaz takibi ve hatim","Kıldığın vakitleri işaretle, serini koru; kaza takibi, rozetler ve ailenle birlikte ortak hatim."),
  ("Ramazan","İmsakiye, iftar ve sahur geri sayımı, sahur hatırlatması ve oruç takvimi."),
  ("Dualar ve rehber","Resimli abdest ve namaz rehberi, kaynaklı dualar, tesbihat, zikirmatik ve Esmaül Hüsna.")],
 r_h="Ramazan'da da yanında", r_s="Sahur ve iftar vakitlerini, geri sayımı ve oruç takvimini tek yerde gör.",
 r_li=["30 günlük imsakiye: sahur, iftar ve tüm vakitler","İftara ve sahura geri sayım, ana sayfada Ramazan kartı","Sahur hatırlatması (kaç dakika önce istediğini sen seç)","Oruç takvimi ve kaza orucu takibi"],
 s_h="Sade, okunaklı, çini esintili", s_s="Telefonda, tablette ve Android TV'de aynı sade deneyim. Beş tema, büyük yazılar, ana ekran widget'ları ve TV için büyük vakit panosu.",
 tabs=("Telefon","Tablet","Android TV"),
 ph=["Sıradaki vakte geri sayım","Günün vakitleri, güneş yayı","30 günlük vakit listesi","Kur'an-ı Kerim ve sureler","Kıble pusulası","Resimli Cuma ve kandil mesajları","Kaynaklı dualar","Resimli abdest ve namaz rehberi","Ramazan imsakiyesi","Kandiller ve dini günler","Hatim ve ortak hatim","Namaz takibi","Esmaül Hüsna","Rozetler"],
 tb=["Ana sayfa: iki sütunlu düzen","Gün sayfası ve güneş yayı","Resimli mesajlar","30 günlük vakitler","Tüm araçlar"], tvc=["Çini teması","Gece teması","Zümrüt teması"],
 m_h="Resimli Cuma ve kandil mesajları", m_s="Cuma, kandil, Ramazan ve bayramlar için hazır resimli mesajları ve günün ayetini tek dokunuşla WhatsApp ve Instagram'da paylaş.",
 faq_h="Sık sorulanlar", faq_s="Aklına takılan başka bir şey varsa bize yazabilirsin.",
 faq=[("Namaz Yolu ücretsiz mi?","Evet. Ücretsiz sürümde reklam gösterilir; dilersen tek seferlik ödemeyle reklamları kaldırıp tüm resimli mesajların kilidini açabilirsin."),
  ("Namaz vakitleri Diyanet ile aynı mı?","Türkiye'de Diyanet İşleri Başkanlığı'nın kullandığı yöntemle hesaplanır. Diğer ülkelerde bulunduğun ülkenin yaygın yöntemi otomatik seçilir; istersen ayarlardan değiştirebilirsin."),
  ("İnternet olmadan çalışır mı?","Namaz vakitleri, kıble ve bildirimler internetsiz çalışır. Kur'an sayfaları ve sureler ilk açılışta indirilip telefona kaydedilir."),
  ("Konum izni vermek zorunda mıyım?","Hayır. Konum izni vermeden şehir listesinden kendi şehrini seçerek de doğru vakitleri alabilirsin."),
  ("Verilerim nerede tutuluyor?","Namaz takibi, oruç, hatim ve ayarların yalnızca telefonunda durur. Ayrıntılar için Gizlilik Politikası ve KVKK Aydınlatma Metni'ne bak."),
  ("Bildirimler neden gecikiyor?","Bazı telefonlar pil tasarrufu için uygulamaları kısıtlar. Uygulamadaki bildirim güvenilirliği kartından gerekli izinleri tek dokunuşla açabilirsin.")],
 ld_desc="Ezan vakitleri, Kur'an-ı Kerim, kıble, namaz takibi, hatim ve dualar."),
"en": dict(
 title="Namaz Yolu · Prayer Times, Quran and Qibla App",
 desc="Namaz Yolu: location-based prayer times and notifications, the Quran in Madinah Mushaf layout, qibla compass, prayer tracking, khatm, Ramadan timetable, supplications and image messages. Free Android app.",
 h1='Your companion on the <span>daily path of worship.</span>',
 lead="Accurate prayer times for where you are, the Quran in Madinah Mushaf layout, a qibla compass, prayer tracking, khatm and supplications. All in one simple, free app.",
 play="Get it on Google Play", more="What's inside?", note="For Android phones, tablets and Android TV · 9 languages · No account needed",
 f_h="Everything you need", f_s="Prayer times that work offline, no account required, and your data stays on your phone.",
 feats=[("Prayer times and notifications","Times calculated with the Diyanet method in Türkiye and the local method elsewhere; notifications even when the app is closed, and a choice of adhan sounds."),
  ("The Quran","Read in Madinah Mushaf layout, recitation with the verse highlighted, translation and 30-60-90 day reading plans."),
  ("Qibla and mosques","A qibla compass that stays accurate even when the phone is tilted, and directions to nearby mosques."),
  ("Prayer tracking and khatm","Mark the prayers you pray and keep your streak; qada tracking, badges and a group khatm with your family."),
  ("Ramadan","Timetable, iftar and suhoor countdown, suhoor reminder and a fasting calendar."),
  ("Supplications and guide","Illustrated ablution and prayer guide, sourced supplications, tasbih, dhikr counter and the Names of Allah.")],
 r_h="With you in Ramadan too", r_s="See suhoor and iftar times, the countdown and your fasting calendar in one place.",
 r_li=["30-day timetable: suhoor, iftar and all prayer times","Countdown to iftar and suhoor, Ramadan card on the home screen","Suhoor reminder (you choose how many minutes before)","Fasting calendar and qada fast tracking"],
 s_h="Simple, readable, tile-inspired", s_s="The same clean experience on phone, tablet and Android TV. Five themes, large text, home-screen widgets and a big prayer-time board for TV.",
 tabs=("Phone","Tablet","Android TV"),
 ph=["Countdown to the next prayer","Today's times, sun arc","30-day prayer list","The Quran and surahs","Qibla compass","Friday and holy-night image messages","Sourced supplications","Illustrated ablution and prayer guide","Ramadan timetable","Holy nights and religious days","Khatm and group khatm","Prayer tracking","Names of Allah","Badges"],
 tb=["Home: two-column layout","Day page and sun arc","Image messages","30-day times","All tools"], tvc=["Tile theme","Night theme","Emerald theme"],
 m_h="Friday and holy-night image messages", m_s="Share ready-made image messages for Fridays, holy nights, Ramadan and Eid, and the verse of the day, on WhatsApp and Instagram with one tap.",
 faq_h="FAQ", faq_s="If you have another question, write to us.",
 faq=[("Is Namaz Yolu free?","Yes. The free version shows ads; with a one-time payment you can remove ads and unlock all image messages."),
  ("Are prayer times the same as Diyanet?","In Türkiye they are calculated with the method used by the Presidency of Religious Affairs (Diyanet). Elsewhere your country's common method is chosen automatically; you can change it in settings."),
  ("Does it work offline?","Prayer times, qibla and notifications work offline. Quran pages and surahs are downloaded on first open and saved on the phone."),
  ("Do I have to share my location?","No. Without location permission you can pick your city from the list and still get correct times."),
  ("Where is my data kept?","Prayer tracking, fasting, khatm and settings stay only on your phone. See the Privacy Policy for details."),
  ("Why are notifications delayed?","Some phones restrict apps to save battery. Use the notification reliability card in the app to enable the needed permissions in one tap.")],
 ld_desc="Prayer times, the Quran, qibla, prayer tracking, khatm and supplications."),
}

def home(lang):
    h = H[lang]; t = L[lang]
    cards = "".join(f'<div class="card">{ic(ICONS[i])}<h3>{n}</h3><p>{d}</p></div>' for i, (n, d) in enumerate(h["feats"]))
    pk = ["t-vakitler","t-gun","t-vakitler","t-kuran","t-kible","t-mesajlar","t-dualar","t-rehber","t-imsakiye","t-dini-gunler","t-hatim","t-namaz-takip","t-esma","t-rozetler"]
    pk[0] = "t-acilis"; pk[1] = "t-gun"; pk[2] = "t-vakitler"
    ph = "".join(f'<figure class="slide"><div class="phone sm"><img src="/img/ekran/{pk[i]}.webp" alt="{e(c)}" width="450" height="1000" loading="lazy"></div><figcaption>{c}</figcaption></figure>' for i, c in enumerate(h["ph"]))
    tk = ["tab-_","tab-_gun","tab-_mesajlar","tab-_vakitler","tab-_araclar"]
    tb = "".join(f'<figure class="slide"><div class="tablet"><img src="/img/ekran/{tk[i]}.webp" alt="{e(c)}" width="1180" height="820" loading="lazy"></div><figcaption>{c}</figcaption></figure>' for i, c in enumerate(h["tb"]))
    tv = "".join(f'<figure class="slide"><div class="tv"><img src="/img/ekran/{f}.webp" alt="{e(c)}" width="1280" height="720" loading="lazy"></div><figcaption>{c}</figcaption></figure>' for f, c in zip(["tv-_tv","tvgece-_tv","tvzumrut-_tv"], h["tvc"]))
    arrows = '<div class="arrows"><button class="prev" type="button" aria-label="‹">‹</button><button class="next" type="button" aria-label="›">›</button></div>'
    faq = "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in h["faq"])
    rli = "".join(f"<li>{x}</li>" for x in h["r_li"])
    body = f'''<div class="wrap"><div class="hero"><div>
<h1>{h["h1"]}</h1><p class="lead">{h["lead"]}</p>
<div class="cta"><a class="btn" href="{PLAY}" rel="noopener"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 2.7v18.6c0 .4.4.7.8.5L21 12.5c.4-.2.4-.8 0-1L4.8 2.2c-.4-.2-.8.1-.8.5z"/></svg>{h["play"]}</a><a class="btn ghost" href="#ozellikler">{h["more"]}</a></div>
<p class="note">{h["note"]}</p></div>
<div class="hero-phone"><div class="phone"><img src="/img/ekran/t-acilis.webp" alt="Namaz Yolu" width="450" height="1000"></div></div></div></div>
<section id="ozellikler" class="alt"><div class="wrap"><h2>{h["f_h"]}</h2><p class="sub">{h["f_s"]}</p><div class="grid">{cards}</div></div></section>
<section><div class="wrap"><div class="ram"><div class="phone-wrap" style="justify-self:center"><div class="phone sm"><img src="/img/ekran/t-imsakiye.webp" alt="{e(h["ph"][8])}" width="450" height="1000" loading="lazy"></div></div>
<div><h2 style="text-align:left">{h["r_h"]}</h2><p style="color:var(--dim)">{h["r_s"]}</p><ul>{rli}</ul></div></div></div></section>
<section id="ekranlar" class="alt"><div class="wrap"><h2>{h["s_h"]}</h2><p class="sub">{h["s_s"]}</p>
<div class="tabs" role="tablist"><button role="tab" aria-selected="true" aria-controls="p-tel" id="t-tel">{h["tabs"][0]}</button><button role="tab" aria-selected="false" aria-controls="p-tab" id="t-tab">{h["tabs"][1]}</button><button role="tab" aria-selected="false" aria-controls="p-tv" id="t-tv">{h["tabs"][2]}</button></div>
<div class="panel" id="p-tel" role="tabpanel" aria-labelledby="t-tel"><div class="track">{ph}</div>{arrows}</div>
<div class="panel" id="p-tab" role="tabpanel" aria-labelledby="t-tab" hidden><div class="track">{tb}</div>{arrows}</div>
<div class="panel" id="p-tv" role="tabpanel" aria-labelledby="t-tv" hidden><div class="track">{tv}</div>{arrows}</div></div></section>
<section><div class="wrap"><h2>{h["m_h"]}</h2><p class="sub">{h["m_s"]}</p><div class="msgs"><img src="/img/cuma-01.jpg" alt="" loading="lazy" width="360" height="480"><img src="/img/kandil-01.jpg" alt="" loading="lazy" width="360" height="480"><img src="/img/bayram-01.jpg" alt="" loading="lazy" width="360" height="480"></div></div></section>
<section id="sss" class="alt"><div class="wrap"><h2>{h["faq_h"]}</h2><p class="sub">{h["faq_s"]}</p>{faq}</div></section>'''
    ld = '<script type="application/ld+json">' + json.dumps({"@context":"https://schema.org","@type":"MobileApplication","name":"Namaz Yolu","operatingSystem":"ANDROID","applicationCategory":"LifestyleApplication","description":h["ld_desc"],"offers":{"@type":"Offer","price":"0","priceCurrency":"TRY"},"url":DOMAIN+PAGES["home"][lang],"image":DOMAIN+"/img/logo.png","inLanguage":["tr","en","ar","de","fr","ru","id","ur","ja"],"publisher":{"@type":"Organization","name":"Göçler Store"}}, ensure_ascii=False) + "</script>"
    return shell(lang, "home", h["title"], h["desc"], body, jsonld=ld)

def w(path, s):
    p = os.path.join(OUT, path.lstrip("/"))
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w", encoding="utf8").write(s)

def main():
    if os.path.exists(OUT): shutil.rmtree(OUT)
    os.makedirs(OUT)
    for n in ["favicon.png", "ads.txt", "app-ads.txt", "robots.txt"]:
        shutil.copy(os.path.join(SRC, n), OUT)
    shutil.copytree(os.path.join(SRC, "img"), os.path.join(OUT, "img"))
    os.makedirs(os.path.join(OUT, "assets"))
    from fontTools.ttLib import TTFont
    f = TTFont("/mnt/skills/examples/canvas-design/canvas-fonts/Outfit-Bold.ttf"); f.flavor = "woff"; f.save(os.path.join(OUT, "assets/outfit-bold.woff"))
    open(os.path.join(OUT, "assets/site.css"), "w").write(CSS)
    open(os.path.join(OUT, "assets/site.js"), "w").write(JS)
    w("/index.html", home("tr")); w("/en/index.html", home("en"))
    for lang, pages in (("tr", site_legal.tr_pages()), ("en", site_legal.en_pages())):
        for key, (title, desc, body) in pages.items():
            w(PAGES[key][lang], shell(lang, key, title, desc, body))
    urls = []
    seen = set()
    for key, m in PAGES.items():
        for lang in ("tr", "en"):
            if m[lang] in seen: continue
            seen.add(m[lang]); urls.append(m[lang])
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"<url><loc>{DOMAIN}{u}</loc></url>\n" for u in urls) + "</urlset>\n"
    w("/sitemap.xml", sm)
    print("ok", len(urls), "sayfa")
main()
