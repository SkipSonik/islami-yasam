<?php
// İslami Yaşam — yakındaki camiler (OpenStreetMap / Overpass) için önbellekli ara sunucu.
//
// Ücretsiz Overpass sunucuları telefondan doğrudan sorulduğunda 20-60 sn sürebiliyor ya da
// isteği reddedebiliyor. Bu dosya bölgeyi 0,1°'lik karelere (≈11 km) böler, her kareyi bir
// kez Overpass'tan alıp veritabanında 30 gün saklar; sonraki istekler anında döner.
//
//   GET camiler.php?lat=41.01&lng=28.97&r=3000

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
@set_time_limit(150);

require __DIR__ . '/config.php';

const TILE = 0.1;
const TTL_DAYS = 30;
const LANGS = ['tr', 'en', 'ar', 'de', 'fr', 'ru', 'id', 'ur', 'ja'];
const SERVERS = [
    'https://overpass-api.de/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
];

function out(array $d, int $s = 200): void
{
    http_response_code($s);
    echo json_encode($d, JSON_UNESCAPED_UNICODE);
    exit;
}

$lat = isset($_GET['lat']) ? (float)$_GET['lat'] : NAN;
$lng = isset($_GET['lng']) ? (float)$_GET['lng'] : NAN;
$r = max(500, min(15000, (int)($_GET['r'] ?? 3000)));
if (!is_finite($lat) || !is_finite($lng) || abs($lat) > 85 || abs($lng) > 180) out(['ok' => false, 'error' => 'coords'], 400);

try {
    $db = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $db->exec("CREATE TABLE IF NOT EXISTS mosque_tiles (
        tile VARCHAR(20) PRIMARY KEY,
        data MEDIUMTEXT NOT NULL,
        fetched_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
} catch (Throwable $e) {
    $db = null; // veritabanı yoksa önbelleksiz devam et
}

function distM(float $a1, float $o1, float $a2, float $o2): float
{
    $R = 6371000;
    $dA = deg2rad($a2 - $a1);
    $dO = deg2rad($o2 - $o1);
    $h = sin($dA / 2) ** 2 + cos(deg2rad($a1)) * cos(deg2rad($a2)) * sin($dO / 2) ** 2;
    return 2 * $R * asin(min(1, sqrt($h)));
}

/** Bir kutunun camilerini Overpass'tan al (sunucuları sırayla dene) */
function fetchBox(float $s, float $w, float $n, float $e): ?array
{
    $q = sprintf(
        '[out:json][timeout:90];nwr["amenity"="place_of_worship"]["religion"="muslim"](%.4f,%.4f,%.4f,%.4f);out center tags;',
        $s, $w, $n, $e
    );
    foreach (SERVERS as $url) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => 'data=' . rawurlencode($q),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 100,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_USERAGENT => 'IslamiYasam/1.0 (+https://mix.gen.tr; mosque finder)',
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
        ]);
        $body = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code !== 200 || !$body) continue;
        $j = json_decode($body, true);
        if (!is_array($j) || !isset($j['elements'])) continue;
        $list = [];
        foreach ($j['elements'] as $el) {
            $p = $el['center'] ?? (isset($el['lat']) ? ['lat' => $el['lat'], 'lon' => $el['lon']] : null);
            if (!$p) continue;
            $t = $el['tags'] ?? [];
            $names = [];
            if (!empty($t['name'])) $names['_'] = $t['name'];
            foreach (LANGS as $l) if (!empty($t["name:$l"])) $names[$l] = $t["name:$l"];
            $street = trim(($t['addr:street'] ?? '') . ' ' . ($t['addr:housenumber'] ?? ''));
            $area = $t['addr:neighbourhood'] ?? $t['addr:suburb'] ?? $t['addr:district'] ?? '';
            $list[] = [
                'id' => $el['type'][0] . $el['id'],
                'lat' => round((float)$p['lat'], 6),
                'lng' => round((float)$p['lon'], 6),
                'n' => $names,
                'a' => trim($area . ($area && $street ? ', ' : '') . $street),
            ];
        }
        return $list;
    }
    return null;
}

// Yarıçapı kapsayan kareler
$dLat = $r / 111320;
$dLng = $r / (111320 * max(0.2, cos(deg2rad($lat))));
$tiles = [];
for ($ty = (int)floor(($lat - $dLat) / TILE); $ty <= (int)floor(($lat + $dLat) / TILE); $ty++) {
    for ($tx = (int)floor(($lng - $dLng) / TILE); $tx <= (int)floor(($lng + $dLng) / TILE); $tx++) {
        $tiles[] = [$ty, $tx];
    }
}
if (count($tiles) > 9) out(['ok' => false, 'error' => 'radius'], 400);

$all = [];
$need = [];
foreach ($tiles as [$ty, $tx]) {
    $key = $ty . ':' . $tx;
    $data = null;
    if ($db) {
        $st = $db->prepare('SELECT data FROM mosque_tiles WHERE tile = ? AND fetched_at > NOW() - INTERVAL ' . TTL_DAYS . ' DAY');
        $st->execute([$key]);
        $row = $st->fetch();
        if ($row) $data = json_decode($row['data'], true);
    }
    if (is_array($data)) {
        foreach ($data as $m) $all[$m['id']] = $m;
    } else {
        $need[$key] = [$ty, $tx];
    }
}

// Eksik kareleri tek bir Overpass sorgusuyla al, sonra karelere dağıt
$failed = false;
if ($need) {
    $ys = array_column($need, 0);
    $xs = array_column($need, 1);
    $list = fetchBox(min($ys) * TILE, min($xs) * TILE, (max($ys) + 1) * TILE, (max($xs) + 1) * TILE);
    if ($list === null) {
        $failed = true;
    } else {
        $byTile = array_fill_keys(array_keys($need), []);
        foreach ($list as $m) {
            $key = (int)floor($m['lat'] / TILE) . ':' . (int)floor($m['lng'] / TILE);
            if (isset($byTile[$key])) $byTile[$key][] = $m;
            $all[$m['id']] = $m;
        }
        if ($db) {
            $ins = $db->prepare('REPLACE INTO mosque_tiles (tile, data, fetched_at) VALUES (?, ?, NOW())');
            foreach ($byTile as $key => $data) $ins->execute([$key, json_encode($data, JSON_UNESCAPED_UNICODE)]);
        }
    }
}

if ($failed && !$all) out(['ok' => false, 'error' => 'upstream'], 502);

$res = [];
foreach ($all as $m) {
    $d = distM($lat, $lng, $m['lat'], $m['lng']);
    if ($d <= $r) {
        $m['d'] = (int)round($d);
        $res[] = $m;
    }
}
usort($res, fn($a, $b) => $a['d'] <=> $b['d']);
out(['ok' => true, 'partial' => $failed, 'elements' => array_slice($res, 0, 150)]);
