# -*- coding: utf-8 -*-
"""Namaz Yolu web sitesi: ortak ayarlar, CSS, JS ve sayfa iskeleti."""
import html

DOMAIN = "https://namazyolu.com"
PLAY = "https://play.google.com/store/apps/details?id=com.skipsonik.islamiyasam"
MAIL = "akingocler@gmail.com"
# Veri sorumlusu adı: kullanıcıdan alınınca burası güncellenir.
CONTROLLER = "Akın GÖÇLER"
UPDATED = {"tr": "25 Kasım 2026", "en": "25 November 2026"}

CSS = r"""
@font-face{font-family:Outfit;font-weight:700 800;font-display:swap;src:url(/assets/outfit-bold.woff) format("woff")}
:root{--bg:#F6EFE0;--deep:#EADFC8;--card:#FFFAF0;--teal:#0D6463;--teal2:#094847;--clay:#D4603F;--clay2:#B4492B;--text:#1E2A2A;--dim:#4F5D5B;--line:#E3D5B8}
@media (prefers-color-scheme:dark){:root{--bg:#0E1F1D;--deep:#12302C;--card:#163A35;--teal:#4CD3A2;--teal2:#8CE8C5;--clay:#E08C5A;--clay2:#F0A87E;--text:#F2EEE3;--dim:#B4C8BF;--line:#285A4E}}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--teal)}a:hover{color:var(--teal2)}
h1,h2,h3,.brand b{font-family:Outfit,system-ui,sans-serif}
.band{height:12px;background:repeating-linear-gradient(90deg,#0D6463 0 18px,var(--clay) 18px 24px,var(--bg) 24px 30px,var(--clay) 30px 36px)}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px}
.skip{position:absolute;left:-999px}.skip:focus{left:8px;top:8px;background:#fff;color:#000;padding:8px;z-index:99}
header.top{display:flex;align-items:center;justify-content:space-between;padding:16px 0;gap:12px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--teal)}
.brand img{width:44px;height:44px;border-radius:10px}
.brand b{font-weight:800;font-size:22px}
.nav{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.nav a{text-decoration:none;font-weight:600;font-size:15px}
.lang{border:2px solid var(--teal);border-radius:20px;padding:2px 12px}
.hero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:40px;align-items:center;padding:28px 0 56px}
h1{font-weight:800;font-size:clamp(36px,6vw,60px);line-height:1.06;margin:0 0 16px;color:var(--teal)}
h1 span{color:var(--clay2)}
.lead{font-size:19px;color:var(--dim);max-width:34em;margin:0 0 26px}
.cta{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.btn{display:inline-flex;align-items:center;gap:10px;min-height:52px;padding:0 22px;border-radius:16px;background:var(--teal);color:#fff;font-weight:700;text-decoration:none;font-size:16px;border:0;cursor:pointer;font-family:inherit}
@media (prefers-color-scheme:dark){.btn{color:#06231B}}
.btn:hover{background:var(--teal2);color:#fff}
@media (prefers-color-scheme:dark){.btn:hover{color:#06231B}}
.btn.ghost{background:transparent;color:var(--teal);border:2px solid var(--teal)}
.btn.ghost:hover{background:var(--card);color:var(--teal2)}
.note{font-size:14px;color:var(--clay2);font-weight:600;margin-top:12px}
section{padding:56px 0}
h2{font-weight:800;font-size:clamp(26px,4vw,38px);line-height:1.15;color:var(--teal);margin:0 0 10px;text-align:center}
.sub{color:var(--dim);text-align:center;margin:0 auto 34px;max-width:40em}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:22px}
.card h3{font-weight:700;font-size:19px;line-height:1.25;margin:12px 0 6px}
.card p{margin:0;color:var(--dim);font-size:15px}
.ico{width:46px;height:46px;border-radius:10px;background:var(--clay);display:grid;place-items:center;transform:rotate(45deg)}
.ico svg{transform:rotate(-45deg)}
.alt{background:var(--deep)}
.ram{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:36px;align-items:center}
.ram ul{padding-left:20px;color:var(--dim)}.ram li{margin:6px 0}
.hero-phone{justify-self:center;position:relative}
.hero-phone::before{content:"";position:absolute;inset:8% -14% 4%;border-radius:220px 220px 40px 40px;background:var(--clay);opacity:.18;z-index:-1}
.phone{width:290px;padding:10px;border-radius:44px;background:#16201F;box-shadow:0 24px 50px rgba(13,100,99,.25),inset 0 0 0 2px #2B3836;position:relative}
.phone::after{content:"";position:absolute;top:18px;left:50%;width:70px;height:7px;margin-left:-35px;border-radius:4px;background:#0B1110}
.phone img{display:block;width:100%;height:auto;border-radius:34px}
.phone.sm{width:220px;padding:8px;border-radius:34px}
.phone.sm::after{top:14px;width:50px;margin-left:-25px;height:5px}
.phone.sm img{border-radius:26px}
.tabs{display:flex;justify-content:center;gap:8px;margin:0 auto 22px;flex-wrap:wrap}
.tabs button{min-height:44px;padding:0 20px;border-radius:22px;border:2px solid var(--teal);background:transparent;color:var(--teal);font:700 15px inherit;font-family:inherit;cursor:pointer}
.tabs button[aria-selected="true"]{background:var(--teal);color:#fff}
@media (prefers-color-scheme:dark){.tabs button[aria-selected="true"]{color:#06231B}}
.track{display:flex;gap:22px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;padding:8px 4px 16px;scrollbar-width:none}
.track::-webkit-scrollbar{display:none}
.slide{flex:0 0 auto;margin:0;scroll-snap-align:center}
.slide figcaption{text-align:center;font-weight:600;color:var(--dim);margin-top:10px;font-size:14px}
.tablet,.tv{background:#16201F;padding:12px;border-radius:26px;box-shadow:0 18px 40px rgba(13,100,99,.2)}
.tablet{width:min(640px,82vw)}
.tv{width:min(720px,86vw);border-radius:12px;padding:10px 10px 22px;margin-bottom:30px}
.tablet img,.tv img{display:block;width:100%;height:auto;border-radius:14px}.tv img{border-radius:4px}
.arrows{display:flex;justify-content:center;gap:12px;margin-top:8px}
.arrows button{width:48px;height:48px;border-radius:50%;border:2px solid var(--teal);background:var(--card);color:var(--teal);font-size:28px;line-height:1;cursor:pointer}
.arrows button:hover{background:var(--teal);color:#fff}
.msgs{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.msgs img{width:min(200px,42vw);height:auto;border-radius:16px;box-shadow:0 6px 18px rgba(30,42,42,.15);display:block}
details{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 20px;margin:0 auto 10px;max-width:760px}
summary{font-weight:700;cursor:pointer}
details p{color:var(--dim);margin:10px 0 0}
footer{background:#0D6463;color:#E6F0EE;padding:34px 0;margin-top:30px}
footer a{color:#F3D2B9}footer a:hover{color:#fff}
.foot{display:grid;grid-template-columns:1.2fr 2fr;gap:24px}
.foot ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px 18px}
.foot small{display:block;margin-top:14px;opacity:.85}
.linkbtn{background:none;border:0;padding:0;color:#F3D2B9;text-decoration:underline;cursor:pointer;font:inherit}
/* hukuki sayfalar */
.doc{max-width:820px;margin:0 auto;padding:30px 20px 50px}
.doc h1{font-size:clamp(30px,5vw,44px)}
.doc h2{text-align:left;font-size:22px;margin:30px 0 8px}
.doc p,.doc li{color:var(--text)}
.doc table{border-collapse:collapse;width:100%;font-size:14.5px;margin:12px 0}
.doc th,.doc td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}
.doc th{background:var(--deep)}
.doc .meta{color:var(--dim);font-size:14px}
.doc .box{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 18px;margin:16px 0}
.doc .todo{background:#FFE9A8;color:#4a3b00;padding:1px 6px;border-radius:4px;font-weight:700}
/* çerez bandı */
#cc{position:fixed;left:12px;right:12px;bottom:12px;z-index:60;max-width:760px;margin:0 auto;background:var(--card);color:var(--text);border:2px solid var(--teal);border-radius:20px;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,.25)}
#cc[hidden]{display:none}
#cc p{margin:0 0 12px;font-size:14.5px}
#cc .row{display:flex;gap:10px;flex-wrap:wrap}
#cc .btn{min-height:44px;padding:0 18px;font-size:15px}
#cc fieldset{border:1px solid var(--line);border-radius:12px;margin:0 0 12px;padding:10px 14px}
#cc label{display:flex;gap:10px;align-items:flex-start;margin:6px 0;font-size:14.5px}
#cc input{width:20px;height:20px;margin-top:2px;accent-color:var(--teal)}
@media (max-width:820px){.hero,.ram{grid-template-columns:1fr;text-align:center}.ram ul{text-align:left}.lead{margin-inline:auto}.cta{justify-content:center}.nav .hide{display:none}.foot{grid-template-columns:1fr}}
"""

JS = r"""
(function(){
var K='ny-consent-v1',ADS='ca-pub-5704710295015571';
function get(){try{return JSON.parse(localStorage.getItem(K))}catch(e){return null}}
function put(v){try{localStorage.setItem(K,JSON.stringify(v))}catch(e){}}
function loadAds(){if(document.getElementById('ny-ads'))return;var s=document.createElement('script');s.id='ny-ads';s.async=true;s.crossOrigin='anonymous';s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+ADS;document.head.appendChild(s)}
var bar=document.getElementById('cc'),prefs=document.getElementById('cc-prefs'),ads=document.getElementById('cc-ads');
function decide(a){put({ads:a,t:Date.now()});bar.hidden=true;if(a)loadAds();else if(document.getElementById('ny-ads')){location.reload()}}
function open(){var c=get();ads.checked=!!(c&&c.ads);prefs.hidden=true;document.getElementById('cc-main').hidden=false;bar.hidden=false}
var c=get();
if(c){if(c.ads)loadAds()}else{bar.hidden=false}
document.getElementById('cc-ok').onclick=function(){decide(true)};
document.getElementById('cc-no').onclick=function(){decide(false)};
document.getElementById('cc-set').onclick=function(){document.getElementById('cc-main').hidden=true;prefs.hidden=false};
document.getElementById('cc-save').onclick=function(){decide(ads.checked)};
document.querySelectorAll('[data-cc-open]').forEach(function(b){b.addEventListener('click',open)});
document.querySelectorAll('.tabs button').forEach(function(b){b.addEventListener('click',function(){
document.querySelectorAll('.tabs button').forEach(function(x){x.setAttribute('aria-selected',x===b?'true':'false');document.getElementById(x.getAttribute('aria-controls')).hidden=x!==b})})});
document.querySelectorAll('.panel').forEach(function(p){var t=p.querySelector('.track');if(!t)return;
function step(d){var s=t.querySelector('.slide');var w=s?s.getBoundingClientRect().width+22:300;t.scrollBy({left:d*w,behavior:'smooth'})}
p.querySelector('.prev').onclick=function(){step(-1)};p.querySelector('.next').onclick=function(){step(1)}});
})();
"""

L = {
 "tr": dict(home="Ana sayfa", feat="Özellikler", shots="Ekranlar", faq="Sık sorulanlar", legal="Yasal", prefs="Çerez tercihleri",
   cc_text="Bu sitede reklam gösterilebilmesi için Google AdSense çerezleri kullanılır. Reklam çerezlerini yalnızca onay verirseniz yükleriz; reddederseniz site yine tam çalışır. Ayrıntılar: ",
   cc_link="Çerez Politikası", ok="Kabul et", no="Reddet", set="Tercihler", save="Kaydet",
   necessary="Gerekli (her zaman açık)", necessary_d="Sitenin çalışması ve bu tercihin hatırlanması için tarayıcıda saklanan küçük kayıt.",
   adsl="Reklam çerezleri (Google AdSense)", adsd="Reklam gösterme ve ölçme için Google tarafından yerleştirilir.",
   skip="İçeriğe geç", by="Google Play'de Göçler Store tarafından yayımlanır.", rights="Tüm hakları saklıdır."),
 "en": dict(home="Home", feat="Features", shots="Screens", faq="FAQ", legal="Legal", prefs="Cookie preferences",
   cc_text="This site uses Google AdSense cookies to show ads. We load advertising cookies only if you accept; if you decline, the site works fully. Details: ",
   cc_link="Cookie Policy", ok="Accept", no="Decline", set="Preferences", save="Save",
   necessary="Necessary (always on)", necessary_d="A small record kept in your browser so the site works and remembers this choice.",
   adsl="Advertising cookies (Google AdSense)", adsd="Set by Google to show and measure ads.",
   skip="Skip to content", by="Published on Google Play by Göçler Store.", rights="All rights reserved."),
}

# Sayfa eşleşmeleri: anahtar -> {dil: yol}
PAGES = {
 "home":    {"tr": "/", "en": "/en/"},
 "privacy": {"tr": "/gizlilik.html", "en": "/en/privacy.html"},
 "kvkk":    {"tr": "/kvkk.html", "en": "/en/privacy.html"},
 "terms":   {"tr": "/kullanim-sartlari.html", "en": "/en/terms.html"},
 "cookies": {"tr": "/cerez-politikasi.html", "en": "/en/cookies.html"},
 "refunds": {"tr": "/iade.html", "en": "/en/refunds.html"},
 "delete":  {"tr": "/veri-silme.html", "en": "/en/data-deletion.html"},
}
NAMES = {
 "tr": {"privacy": "Gizlilik Politikası", "kvkk": "KVKK Aydınlatma Metni", "terms": "Kullanım Şartları", "cookies": "Çerez Politikası", "refunds": "Satın Alma ve İade", "delete": "Veri Silme"},
 "en": {"privacy": "Privacy Policy", "terms": "Terms of Use", "cookies": "Cookie Policy", "refunds": "Purchases & Refunds", "delete": "Data Deletion"},
}

def e(s): return html.escape(s, quote=True)

def shell(lang, key, title, desc, body, extra_head="", og="/img/og.jpg", jsonld=""):
    t = L[lang]; other = "en" if lang == "tr" else "tr"
    path = PAGES[key][lang]; opath = PAGES[key][other]
    legal_keys = ["kvkk", "privacy", "terms", "cookies", "refunds", "delete"] if lang == "tr" else ["privacy", "terms", "cookies", "refunds", "delete"]
    legal = "".join(f'<li><a href="{PAGES[k][lang]}">{NAMES[lang][k]}</a></li>' for k in legal_keys)
    home = PAGES["home"][lang]
    anc = (home if key != "home" else "")
    nav = f'''<a class="hide" href="{anc}#ozellikler">{t["feat"]}</a><a class="hide" href="{anc}#ekranlar">{t["shots"]}</a><a class="hide" href="{anc}#sss">{t["faq"]}</a><a class="lang" href="{opath}" hreflang="{other}" lang="{other}">{"English" if lang=="tr" else "Türkçe"}</a>'''
    hre = f'<link rel="alternate" hreflang="{lang}" href="{DOMAIN}{path}"><link rel="alternate" hreflang="{other}" href="{DOMAIN}{opath}">' + (f'<link rel="alternate" hreflang="x-default" href="{DOMAIN}{PAGES[key]["tr"]}">')
    return f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{DOMAIN}{path}">
{hre}
<meta name="theme-color" content="#0D6463">
<meta property="og:type" content="website"><meta property="og:site_name" content="Namaz Yolu">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{DOMAIN}{og}"><meta property="og:url" content="{DOMAIN}{path}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/favicon.png"><link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/site.css?v=1">
{jsonld}{extra_head}
</head>
<body>
<a class="skip" href="#main">{t["skip"]}</a>
<div class="band"></div>
<div class="wrap">
<header class="top">
<a class="brand" href="{home}"><img src="/img/logo.png" alt="" width="44" height="44"><b>Namaz Yolu</b></a>
<nav class="nav" aria-label="Menu">{nav}</nav>
</header>
</div>
<main id="main">
{body}
</main>
<footer>
<div class="wrap foot">
<div><b style="font:800 20px Outfit,system-ui,sans-serif;color:#fff">Namaz Yolu</b><br>{t["by"]}<small>© 2026 Namaz Yolu · {t["rights"]}</small></div>
<div><ul>{legal}<li><button class="linkbtn" type="button" data-cc-open>{t["prefs"]}</button></li><li><a href="mailto:{MAIL}">{MAIL}</a></li></ul></div>
</div>
</footer>
<div class="band"></div>
<div id="cc" role="dialog" aria-modal="false" aria-label="{t["prefs"]}" hidden>
<div id="cc-main"><p>{t["cc_text"]}<a href="{PAGES["cookies"][lang]}">{t["cc_link"]}</a>.</p>
<div class="row"><button class="btn" id="cc-ok" type="button">{t["ok"]}</button><button class="btn ghost" id="cc-no" type="button">{t["no"]}</button><button class="btn ghost" id="cc-set" type="button">{t["set"]}</button></div></div>
<div id="cc-prefs" hidden><fieldset><label><input type="checkbox" checked disabled><span><b>{t["necessary"]}</b><br>{t["necessary_d"]}</span></label>
<label><input type="checkbox" id="cc-ads"><span><b>{t["adsl"]}</b><br>{t["adsd"]}</span></label></fieldset>
<div class="row"><button class="btn" id="cc-save" type="button">{t["save"]}</button></div></div>
</div>
<script src="/assets/site.js?v=1" defer></script>
</body>
</html>'''
