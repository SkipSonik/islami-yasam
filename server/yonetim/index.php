<?php
// Namaz Yolu yönetim paneli. Tek dosya. PHP 7.4+.
// Yönetir: resimli mesajlar (../mesajlar/liste.json), ortak hatimler (MySQL), Ramazan içeriği ve duyurular (../icerik/*.json).
declare(strict_types=1);
@ini_set('session.use_strict_mode', '1');
session_set_cookie_params(['lifetime' => 0, 'path' => '/yonetim/', 'secure' => !empty($_SERVER['HTTPS']), 'httponly' => true, 'samesite' => 'Strict']);
session_start();
header('X-Robots-Tag: noindex, nofollow'); header('Cache-Control: no-store');
if (!file_exists(__DIR__ . '/config.php')) {
    // İlk kurulum: yalnızca yonetim/ klasöründe kurulum-izni.txt dosyası varsa şifre belirlenebilir; kurulumdan sonra dosya silinir.
    $izin = __DIR__ . '/kurulum-izni.txt';
    if (!file_exists($izin)) { http_response_code(503); exit('Kurulum kapalı.'); }
    $m = '';
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $a = (string)($_POST['s1'] ?? ''); $b = (string)($_POST['s2'] ?? '');
        if (strlen($a) < 12) $m = 'En az 12 karakter olmalı.';
        elseif ($a !== $b) $m = 'Şifreler aynı değil.';
        else {
            file_put_contents(__DIR__ . '/config.php', "<?php\nconst ADMIN_HASH = " . var_export(password_hash($a, PASSWORD_DEFAULT), true) . ";\n", LOCK_EX);
            @unlink($izin); header('Location: ./'); exit;
        }
    }
    echo '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Kurulum</title><body style="font:16px system-ui;background:#F6EFE0;display:grid;place-items:center;min-height:100vh;margin:0"><form method="post" style="background:#fff;padding:28px;border-radius:18px;width:min(360px,90vw)"><b>Yönetim şifresi belirle</b><p style="color:#555;font-size:14px">En az 12 karakter. Bu sayfa şifre kaydedilince kapanır.</p><input type="password" name="s1" placeholder="Şifre" style="width:100%;padding:12px;margin:6px 0;box-sizing:border-box"><input type="password" name="s2" placeholder="Şifre (tekrar)" style="width:100%;padding:12px;margin:6px 0;box-sizing:border-box"><button style="width:100%;padding:12px;background:#0D6463;color:#fff;border:0;border-radius:10px;font-weight:700">Kaydet</button>' . ($m ? '<p style="color:#b00">' . htmlspecialchars($m) . '</p>' : '') . '</form>';
    exit;
}
require __DIR__ . '/config.php';

const MSG_DIR = __DIR__ . '/../mesajlar/';
const ICERIK_DIR = __DIR__ . '/../icerik/';

function h($s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function csrf(): string { if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16)); return $_SESSION['csrf']; }
function flash(string $m, bool $ok = true): void { $_SESSION['flash'] = [$m, $ok]; }
function go(string $tab): void { header('Location: ?tab=' . urlencode($tab)); exit; }
function read_json(string $f, $def) { if (!is_file($f)) return $def; $j = json_decode((string)file_get_contents($f), true); return $j ?? $def; }
function write_json(string $f, $data): void {
    @mkdir(dirname($f), 0755, true);
    if (is_file($f)) @copy($f, $f . '.bak');
    $tmp = $f . '.tmp';
    file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    rename($tmp, $f);
}
function db(): PDO {
    static $db = null;
    if ($db) return $db;
    require_once __DIR__ . '/../sunucu/config.php';
    return $db = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
}

// ---- Giriş ----
$ip = preg_replace('/[^0-9a-f:.]/i', '', $_SERVER['REMOTE_ADDR'] ?? 'x');
$lock = __DIR__ . '/.login-' . md5($ip);
if (isset($_GET['cikis'])) { $_SESSION = []; session_destroy(); header('Location: ./'); exit; }
if (empty($_SESSION['ok'])) {
    $err = '';
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $n = is_file($lock) ? (int)file_get_contents($lock) : 0;
        $t = is_file($lock) ? filemtime($lock) : 0;
        if ($n >= 5 && time() - $t < 900) $err = 'Çok fazla deneme. 15 dakika sonra tekrar dene.';
        elseif (password_verify((string)($_POST['sifre'] ?? ''), ADMIN_HASH)) { session_regenerate_id(true); $_SESSION['ok'] = 1; @unlink($lock); header('Location: ./'); exit; }
        else { file_put_contents($lock, (string)(time() - $t < 900 ? $n + 1 : 1)); $err = 'Şifre yanlış.'; usleep(600000); }
    }
    ?><!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Yönetim</title>
<style>body{font:16px system-ui;background:#F6EFE0;display:grid;place-items:center;min-height:100vh;margin:0}form{background:#fff;padding:28px;border-radius:18px;box-shadow:0 8px 30px #0002;width:min(340px,90vw)}input,button{width:100%;padding:12px;font-size:16px;border-radius:10px;border:1px solid #bbb;margin-top:10px;box-sizing:border-box}button{background:#0D6463;color:#fff;border:0;font-weight:700;cursor:pointer}.e{color:#b00;margin-top:8px}</style>
<form method="post"><b style="font-size:20px">Namaz Yolu · Yönetim</b><input type="password" name="sifre" placeholder="Şifre" autofocus autocomplete="current-password"><button>Giriş</button><?php if ($err) echo '<div class="e">' . h($err) . '</div>'; ?></form></html><?php
    exit;
}

// ---- İşlemler (POST) ----
$tab = $_GET['tab'] ?? 'ozet';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!hash_equals(csrf(), (string)($_POST['csrf'] ?? ''))) { http_response_code(400); exit('Geçersiz istek.'); }
    $do = $_POST['do'] ?? '';
    try {
        if ($do === 'msg_save') {
            $l = read_json(MSG_DIR . 'liste.json', ['v' => 2, 'cats' => [], 'items' => []]);
            $ids = array_keys($_POST['cat'] ?? []);
            foreach ($l['items'] as &$it) { $i = $it['id']; if (isset($_POST['cat'][$i])) { $it['cat'] = (string)$_POST['cat'][$i]; $it['free'] = !empty($_POST['free'][$i]); } }
            unset($it);
            $l['updated'] = date('Y-m-d'); write_json(MSG_DIR . 'liste.json', $l); flash('Mesaj listesi kaydedildi. Uygulama en geç 6 saat içinde günceller.');
        } elseif ($do === 'msg_del') {
            $id = preg_replace('/[^a-z0-9-]/', '', (string)$_POST['id']);
            $l = read_json(MSG_DIR . 'liste.json', ['items' => []]);
            $l['items'] = array_values(array_filter($l['items'], fn($x) => $x['id'] !== $id));
            $l['updated'] = date('Y-m-d'); write_json(MSG_DIR . 'liste.json', $l);
            @unlink(MSG_DIR . "img/$id.jpg"); @unlink(MSG_DIR . "thumb/$id.jpg"); flash("$id silindi.");
        } elseif ($do === 'msg_add') {
            $cat = preg_replace('/[^a-z0-9]/', '', (string)$_POST['cat']);
            $l = read_json(MSG_DIR . 'liste.json', ['v' => 2, 'cats' => [], 'items' => []]);
            if (!in_array($cat, array_column($l['cats'], 'id'), true)) throw new Exception('Kategori geçersiz.');
            $n = 0;
            foreach (($_FILES['img']['tmp_name'] ?? []) as $k => $tmp) {
                if (!is_uploaded_file($tmp)) continue;
                $info = @getimagesize($tmp);
                if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) throw new Exception('Yalnızca JPG/PNG/WebP yükle.');
                if (filesize($tmp) > 8 * 1024 * 1024) throw new Exception('Dosya 8 MB üstü.');
                $src = $info[2] === IMAGETYPE_PNG ? imagecreatefrompng($tmp) : ($info[2] === IMAGETYPE_WEBP ? imagecreatefromwebp($tmp) : imagecreatefromjpeg($tmp));
                $max = 0; foreach ($l['items'] as $it) if (preg_match('/^' . $cat . '-(\d+)$/', $it['id'], $m)) $max = max($max, (int)$m[1]);
                $id = sprintf('%s-%02d', $cat, $max + 1);
                foreach ([['img', 1080], ['thumb', 360]] as [$dir, $w]) {
                    $sw = imagesx($src); $sh = imagesy($src); $nw = min($w, $sw); $nh = (int)round($sh * $nw / $sw);
                    $dst = imagecreatetruecolor($nw, $nh); imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $sw, $sh);
                    @mkdir(MSG_DIR . $dir, 0755, true); imagejpeg($dst, MSG_DIR . "$dir/$id.jpg", 86); imagedestroy($dst);
                }
                imagedestroy($src);
                $l['items'][] = ['id' => $id, 'cat' => $cat, 'free' => !empty($_POST['free'])]; $n++;
            }
            if (!$n) throw new Exception('Dosya seçilmedi.');
            $l['updated'] = date('Y-m-d'); write_json(MSG_DIR . 'liste.json', $l); flash("$n görsel eklendi.");
        } elseif ($do === 'hatim_del') {
            db()->prepare('DELETE FROM hatims WHERE id = ?')->execute([(int)$_POST['id']]); flash('Hatim silindi.');
        } elseif ($do === 'hatim_name') {
            db()->prepare("UPDATE hatim_parts SET name = '' WHERE hatim_id = ?")->execute([(int)$_POST['id']]);
            db()->prepare("UPDATE hatims SET creator_name = '' WHERE id = ?")->execute([(int)$_POST['id']]); flash('İsimler temizlendi.');
        } elseif ($do === 'ramazan_save') {
            $menu = []; for ($i = 1; $i <= 30; $i++) $menu[] = trim((string)($_POST['menu'][$i] ?? ''));
            $soz = array_values(array_filter(array_map('trim', explode("\n", (string)$_POST['soz']))));
            write_json(ICERIK_DIR . 'ramazan.json', ['v' => 1, 'updated' => date('Y-m-d'), 'menus' => $menu, 'sozler' => $soz]); flash('Ramazan içeriği kaydedildi.');
        } elseif ($do === 'duyuru_save') {
            $d = [];
            foreach (($_POST['d_title'] ?? []) as $i => $t) {
                $t = trim((string)$t); if ($t === '') continue;
                $d[] = ['title' => $t, 'text' => trim((string)$_POST['d_text'][$i]), 'from' => (string)$_POST['d_from'][$i], 'to' => (string)$_POST['d_to'][$i], 'active' => !empty($_POST['d_on'][$i])];
            }
            write_json(ICERIK_DIR . 'duyuru.json', ['v' => 1, 'updated' => date('Y-m-d'), 'items' => $d]); flash('Duyurular kaydedildi.');
        }
    } catch (Throwable $e) { flash('Hata: ' . $e->getMessage(), false); }
    go($tab);
}

// ---- Sayfa ----
$msg = read_json(MSG_DIR . 'liste.json', ['cats' => [], 'items' => []]);
$fl = $_SESSION['flash'] ?? null; unset($_SESSION['flash']);
$tabs = ['ozet' => 'Özet', 'mesaj' => 'Resimli mesajlar', 'hatim' => 'Ortak hatim', 'ramazan' => 'Ramazan içeriği', 'duyuru' => 'Duyurular'];
function form_open(string $do, string $tab, bool $file = false): void { echo '<form method="post" ' . ($file ? 'enctype="multipart/form-data"' : '') . '><input type="hidden" name="csrf" value="' . h(csrf()) . '"><input type="hidden" name="do" value="' . $do . '">'; }
?><!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Namaz Yolu · Yönetim</title>
<style>
body{font:15px/1.5 system-ui;background:#F6EFE0;color:#1E2A2A;margin:0}header{background:#0D6463;color:#fff;padding:12px 20px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
header a{color:#fff;text-decoration:none;padding:6px 12px;border-radius:14px}header a.on{background:#ffffff33}main{max-width:1100px;margin:0 auto;padding:20px}
.card{background:#fff;border:1px solid #E3D5B8;border-radius:16px;padding:16px;margin-bottom:16px}h2{margin:0 0 10px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}.it{border:1px solid #E3D5B8;border-radius:12px;padding:8px;font-size:13px}.it img{width:100%;border-radius:8px;display:block}
input,select,textarea,button{font:inherit;padding:8px;border-radius:8px;border:1px solid #bbb;box-sizing:border-box}textarea{width:100%}button{background:#0D6463;color:#fff;border:0;cursor:pointer;font-weight:600}button.r{background:#B4492B}button.s{padding:4px 8px;font-size:12px}
table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #eee;padding:6px;text-align:left;vertical-align:top}.ok{background:#DDF3E4;padding:10px;border-radius:10px;margin-bottom:12px}.bad{background:#F8D7D2;padding:10px;border-radius:10px;margin-bottom:12px}
.stat{display:inline-block;margin:0 24px 8px 0}.stat b{font-size:28px;display:block}.m{color:#4F5D5B;font-size:13px}
</style>
<header><b>Namaz Yolu · Yönetim</b><?php foreach ($tabs as $k => $v) echo '<a href="?tab=' . $k . '" class="' . ($tab === $k ? 'on' : '') . '">' . h($v) . '</a>'; ?><a href="?cikis=1" style="margin-left:auto">Çıkış</a></header>
<main>
<?php if ($fl) echo '<div class="' . ($fl[1] ? 'ok' : 'bad') . '">' . h($fl[0]) . '</div>';

if ($tab === 'ozet') {
    echo '<div class="card"><h2>Özet</h2>';
    echo '<span class="stat"><b>' . count($msg['items']) . '</b>resimli mesaj</span>';
    $free = count(array_filter($msg['items'], fn($x) => !empty($x['free']))); echo '<span class="stat"><b>' . $free . '</b>ücretsiz mesaj</span>';
    try {
        $r = db()->query("SELECT (SELECT COUNT(*) FROM hatims) h, (SELECT COUNT(*) FROM hatims WHERE created_at > NOW() - INTERVAL 7 DAY) h7, (SELECT COALESCE(SUM(completed_rounds),0) FROM hatims) done, (SELECT COUNT(DISTINCT device) FROM hatim_parts WHERE device<>'') dev")->fetch();
        echo '<span class="stat"><b>' . (int)$r['h'] . '</b>ortak hatim</span><span class="stat"><b>' . (int)$r['h7'] . '</b>son 7 günde yeni</span><span class="stat"><b>' . (int)$r['done'] . '</b>tamamlanan hatim</span><span class="stat"><b>' . (int)$r['dev'] . '</b>hatime katılan cihaz</span>';
    } catch (Throwable $e) { echo '<p class="m">Hatim veritabanına bağlanılamadı: ' . h($e->getMessage()) . '</p>'; }
    echo '<p class="m">İndirme ve kullanıcı sayıları için Google Play Console ve AdMob panellerine bak; uygulama kullanıcı verisi toplamadığı için burada gösterilmez.</p></div>';
} elseif ($tab === 'mesaj') {
    $cats = array_column($msg['cats'], 'name', 'id');
    echo '<div class="card"><h2>Yeni görsel ekle</h2>'; form_open('msg_add', $tab, true);
    echo '<select name="cat">'; foreach ($cats as $id => $n) echo '<option value="' . h($id) . '">' . h($n['tr'] ?? $id) . '</option>'; echo '</select> ';
    echo '<input type="file" name="img[]" accept="image/*" multiple> <label><input type="checkbox" name="free" value="1"> Ücretsiz olsun</label> <button>Yükle</button><p class="m">3:4 dikey görsel önerilir (ör. 1080×1440). Otomatik küçük önizleme üretilir.</p></form></div>';
    echo '<div class="card"><h2>Mesajlar (' . count($msg['items']) . ')</h2>'; form_open('msg_save', $tab); echo '<p><button>Değişiklikleri kaydet</button></p><div class="grid">';
    foreach ($msg['items'] as $it) {
        $i = h($it['id']);
        echo '<div class="it"><img loading="lazy" src="../mesajlar/thumb/' . $i . '.jpg" alt=""><b>' . $i . '</b><br><select name="cat[' . $i . ']">';
        foreach ($cats as $cid => $n) echo '<option value="' . h($cid) . '"' . ($cid === $it['cat'] ? ' selected' : '') . '>' . h($n['tr'] ?? $cid) . '</option>';
        echo '</select><br><label><input type="checkbox" name="free[' . $i . ']" value="1"' . (!empty($it['free']) ? ' checked' : '') . '> ücretsiz</label> ';
        echo '<button class="r s" type="submit" form="del-' . $i . '" onclick="return confirm(\'Silinsin mi?\')">Sil</button></div>';
    }
    echo '</div></form>';
    foreach ($msg['items'] as $it) { $i = h($it['id']); echo '<form id="del-' . $i . '" method="post"><input type="hidden" name="csrf" value="' . h(csrf()) . '"><input type="hidden" name="do" value="msg_del"><input type="hidden" name="id" value="' . $i . '"></form>'; }
    echo '</div>';
} elseif ($tab === 'hatim') {
    echo '<div class="card"><h2>Ortak hatimler</h2><p class="m">Uygunsuz ad/niyet görürsen sil; kişi “ismimi sil” derse isimleri temizle. Silme talepleri e-postayla gelir (hatim kodu ile).</p>';
    try {
        $rows = db()->query("SELECT h.*, (SELECT COUNT(*) FROM hatim_parts p WHERE p.hatim_id=h.id AND p.status>0) taken FROM hatims h ORDER BY h.id DESC LIMIT 300")->fetchAll();
        echo '<table><tr><th>Kod</th><th>Ad / niyet</th><th>Oluşturan</th><th>Tur</th><th>Alınan cüz</th><th>Tarih</th><th></th></tr>';
        foreach ($rows as $r) {
            echo '<tr><td><b>' . h($r['code']) . '</b></td><td>' . h($r['title']) . '<br><span class="m">' . h($r['niyet']) . '</span></td><td>' . h($r['creator_name']) . '</td><td>' . (int)$r['completed_rounds'] . '/' . (int)$r['round'] . '</td><td>' . (int)$r['taken'] . '/30</td><td class="m">' . h($r['created_at']) . '</td><td style="white-space:nowrap">';
            foreach ([['hatim_name', 'İsimleri sil', ''], ['hatim_del', 'Hatimi sil', 'r']] as [$do, $lbl, $cls]) { form_open($do, $tab); echo '<input type="hidden" name="id" value="' . (int)$r['id'] . '"><button class="s ' . $cls . '" onclick="return confirm(\'Emin misin?\')">' . $lbl . '</button></form> '; }
            echo '</td></tr>';
        }
        echo '</table>';
    } catch (Throwable $e) { echo '<div class="bad">Veritabanına bağlanılamadı: ' . h($e->getMessage()) . '</div>'; }
    echo '</div>';
} elseif ($tab === 'ramazan') {
    $r = read_json(ICERIK_DIR . 'ramazan.json', ['menus' => [], 'sozler' => []]);
    echo '<div class="card"><h2>Ramazan içeriği</h2><p class="m">Uygulama bu dosyayı internetten okur; güncelleme yayınlamadan menüleri ve sözleri değiştirebilirsin. Boş bıraktığın gün için uygulamadaki varsayılan menü gösterilir.</p>'; form_open('ramazan_save', $tab);
    echo '<table>'; for ($i = 1; $i <= 30; $i++) echo '<tr><td style="width:70px">' . $i . '. gün</td><td><input style="width:100%" name="menu[' . $i . ']" value="' . h($r['menus'][$i - 1] ?? '') . '" placeholder="Örn: Ezogelin çorbası · Etli nohut · Pilav · Cacık · Güllaç"></td></tr>'; echo '</table>';
    echo '<h2 style="margin-top:16px">Günün sözleri (her satıra bir tane)</h2><textarea name="soz" rows="10">' . h(implode("\n", $r['sozler'] ?? [])) . '</textarea><p class="m">Hadis veya ayet yazacaksan kaynağını da yaz; kaynaksız söz uydurma.</p><button>Kaydet</button></form></div>';
} elseif ($tab === 'duyuru') {
    $d = read_json(ICERIK_DIR . 'duyuru.json', ['items' => []])['items'];
    while (count($d) < 3) $d[] = ['title' => '', 'text' => '', 'from' => '', 'to' => '', 'active' => false];
    echo '<div class="card"><h2>Duyurular</h2><p class="m">Başlığı boş bıraktığın satır silinir. Tarih aralığı boşsa süresiz gösterilir.</p>'; form_open('duyuru_save', $tab);
    foreach ($d as $i => $x) {
        echo '<div class="it" style="margin-bottom:10px;font-size:15px"><input style="width:100%" name="d_title[' . $i . ']" placeholder="Başlık" value="' . h($x['title']) . '"><textarea name="d_text[' . $i . ']" rows="2" placeholder="Metin">' . h($x['text']) . '</textarea>';
        echo 'Başlangıç <input type="date" name="d_from[' . $i . ']" value="' . h($x['from']) . '"> Bitiş <input type="date" name="d_to[' . $i . ']" value="' . h($x['to']) . '"> <label><input type="checkbox" name="d_on[' . $i . ']" value="1"' . (!empty($x['active']) ? ' checked' : '') . '> yayında</label></div>';
    }
    echo '<button>Kaydet</button></form></div>';
}
?></main></html>
