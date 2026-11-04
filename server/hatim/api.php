<?php
// İslami Yaşam — ortak hatim (Kur'an kardeşliği) API'si.
// Tek dosya, PHP 7.4+ ve MySQL/MariaDB. Tablolar ilk istekte kendiliğinden kurulur.
//
// Uç noktalar (JSON):
//   GET  api.php?a=ping                (bağlantı testi)
//   GET  api.php?a=get&code=ABC123&device=...
//   POST api.php?a=create   {title, niyet, device, name}
//   POST api.php?a=take     {code, juz, device, name}
//   POST api.php?a=done     {code, juz, device}
//   POST api.php?a=release  {code, juz, device}

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') exit;

require __DIR__ . '/config.php';

function out(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $code, int $status = 400): void
{
    out(['ok' => false, 'error' => $code], $status);
}

try {
    $db = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (Throwable $e) {
    fail('db', 500);
}

// ---- Kurulum (bir kez) ----
$flag = __DIR__ . '/.installed';
if (!file_exists($flag)) {
    $db->exec("CREATE TABLE IF NOT EXISTS hatims (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        code CHAR(6) NOT NULL UNIQUE,
        title VARCHAR(80) NOT NULL,
        niyet VARCHAR(200) NOT NULL DEFAULT '',
        creator VARCHAR(40) NOT NULL,
        creator_name VARCHAR(40) NOT NULL DEFAULT '',
        round INT UNSIGNED NOT NULL DEFAULT 1,
        completed_rounds INT UNSIGNED NOT NULL DEFAULT 0,
        ip_hash CHAR(16) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (ip_hash, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $db->exec("CREATE TABLE IF NOT EXISTS hatim_parts (
        hatim_id INT UNSIGNED NOT NULL,
        juz TINYINT UNSIGNED NOT NULL,
        status TINYINT UNSIGNED NOT NULL DEFAULT 0,
        device VARCHAR(40) NOT NULL DEFAULT '',
        name VARCHAR(40) NOT NULL DEFAULT '',
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (hatim_id, juz),
        FOREIGN KEY (hatim_id) REFERENCES hatims(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    @file_put_contents($flag, date('c'));
}

// ---- Girdi ----
$action = $_GET['a'] ?? '';
$body = [];
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $raw = file_get_contents('php://input', false, null, 0, 4096);
    $body = json_decode($raw ?: '[]', true);
    if (!is_array($body)) fail('json');
}

function str(array $b, string $k, int $max, bool $required = true): string
{
    $v = trim((string)($b[$k] ?? ''));
    $v = preg_replace('/[\x00-\x1F\x7F]/u', '', $v) ?? '';
    if (mb_strlen($v) > $max) $v = mb_substr($v, 0, $max);
    if ($required && $v === '') fail('missing_' . $k);
    return $v;
}

function device(array $b): string
{
    $d = (string)($b['device'] ?? '');
    if (!preg_match('/^[A-Za-z0-9-]{8,40}$/', $d)) fail('device');
    return $d;
}

function juz(array $b): int
{
    $j = (int)($b['juz'] ?? 0);
    if ($j < 1 || $j > 30) fail('juz');
    return $j;
}

function findHatim(PDO $db, string $code): array
{
    $code = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $code) ?? '');
    $st = $db->prepare('SELECT * FROM hatims WHERE code = ?');
    $st->execute([$code]);
    $h = $st->fetch();
    if (!$h) fail('not_found', 404);
    return $h;
}

function view(PDO $db, array $h, string $dev = ''): array
{
    $st = $db->prepare('SELECT juz, status, device, name FROM hatim_parts WHERE hatim_id = ? ORDER BY juz');
    $st->execute([$h['id']]);
    $parts = [];
    foreach ($st->fetchAll() as $p) {
        $parts[] = [
            'juz' => (int)$p['juz'],
            'status' => (int)$p['status'],
            'name' => $p['name'],
            // Cihaz kimlikleri gizli kalır; sadece soran cihaza ait olup olmadığı döner
            'mine' => $dev !== '' && hash_equals($p['device'], $dev),
        ];
    }
    return [
        'ok' => true,
        'hatim' => [
            'code' => $h['code'],
            'title' => $h['title'],
            'niyet' => $h['niyet'],
            'creatorName' => $h['creator_name'],
            'round' => (int)$h['round'],
            'completedRounds' => (int)$h['completed_rounds'],
            'createdAt' => $h['created_at'],
        ],
        'parts' => $parts,
    ];
}

switch ($action) {
    case 'ping':
        out(['ok' => true]);

    case 'get':
        $dev = preg_match('/^[A-Za-z0-9-]{8,40}$/', (string)($_GET['device'] ?? '')) ? (string)$_GET['device'] : '';
        out(view($db, findHatim($db, (string)($_GET['code'] ?? '')), $dev));

    case 'create':
        $title = str($body, 'title', 80);
        $niyet = str($body, 'niyet', 200, false);
        $dev = device($body);
        $name = str($body, 'name', 40, false);
        $ip = substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . DB_NAME), 0, 16);
        $st = $db->prepare('SELECT COUNT(*) FROM hatims WHERE ip_hash = ? AND created_at > NOW() - INTERVAL 1 DAY');
        $st->execute([$ip]);
        if ((int)$st->fetchColumn() >= 20) fail('rate_limit', 429);

        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // karışan harfler yok (0/O, 1/I)
        for ($try = 0; $try < 8; $try++) {
            $code = '';
            for ($i = 0; $i < 6; $i++) $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            try {
                $db->beginTransaction();
                $db->prepare('INSERT INTO hatims (code, title, niyet, creator, creator_name, ip_hash) VALUES (?,?,?,?,?,?)')
                    ->execute([$code, $title, $niyet, $dev, $name, $ip]);
                $id = (int)$db->lastInsertId();
                $ins = $db->prepare('INSERT INTO hatim_parts (hatim_id, juz) VALUES (?, ?)');
                for ($j = 1; $j <= 30; $j++) $ins->execute([$id, $j]);
                $db->commit();
                out(view($db, findHatim($db, $code), $dev));
            } catch (PDOException $e) {
                $db->rollBack();
                if ($e->getCode() !== '23000') fail('db', 500); // kod çakışması dışında hata
            }
        }
        fail('db', 500);

    case 'take':
        $h = findHatim($db, (string)($body['code'] ?? ''));
        $j = juz($body);
        $dev = device($body);
        $name = str($body, 'name', 40, false);
        $st = $db->prepare('UPDATE hatim_parts SET status = 1, device = ?, name = ? WHERE hatim_id = ? AND juz = ? AND status = 0');
        $st->execute([$dev, $name, $h['id'], $j]);
        if ($st->rowCount() === 0) fail('taken', 409);
        out(view($db, $h, $dev));

    case 'release':
        $h = findHatim($db, (string)($body['code'] ?? ''));
        $j = juz($body);
        $dev = device($body);
        $st = $db->prepare("UPDATE hatim_parts SET status = 0, device = '', name = '' WHERE hatim_id = ? AND juz = ? AND status = 1 AND device = ?");
        $st->execute([$h['id'], $j, $dev]);
        if ($st->rowCount() === 0) fail('not_yours', 403);
        out(view($db, $h, $dev));

    case 'done':
        $h = findHatim($db, (string)($body['code'] ?? ''));
        $j = juz($body);
        $dev = device($body);
        $db->beginTransaction();
        $st = $db->prepare('UPDATE hatim_parts SET status = 2 WHERE hatim_id = ? AND juz = ? AND status = 1 AND device = ?');
        $st->execute([$h['id'], $j, $dev]);
        if ($st->rowCount() === 0) {
            $db->rollBack();
            fail('not_yours', 403);
        }
        $left = $db->prepare('SELECT COUNT(*) FROM hatim_parts WHERE hatim_id = ? AND status <> 2');
        $left->execute([$h['id']]);
        $finished = (int)$left->fetchColumn() === 0;
        if ($finished) {
            // Hatim tamamlandı: sayacı artır, cüzleri yeni tur için boşalt
            $db->prepare('UPDATE hatims SET round = round + 1, completed_rounds = completed_rounds + 1 WHERE id = ?')->execute([$h['id']]);
            $db->prepare("UPDATE hatim_parts SET status = 0, device = '', name = '' WHERE hatim_id = ?")->execute([$h['id']]);
        }
        $db->commit();
        $res = view($db, findHatim($db, $h['code']), $dev);
        $res['finished'] = $finished;
        out($res);

    default:
        fail('action', 404);
}
