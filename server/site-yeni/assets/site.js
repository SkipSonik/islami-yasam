
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
