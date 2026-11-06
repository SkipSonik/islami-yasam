<?php
// İslami Yaşam — Zekatmatik için güncel gram altın fiyatı.
// Ons altın (USD) ve döviz kurları ücretsiz servislerden alınır, 30 dakika önbelleklenir.
//   GET altin.php?c=TRY  →  {"ok":true,"currency":"TRY","gram":4250.12,"updated":"..."}

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

const OUNCE_GRAMS = 31.1034768;
const CACHE = __DIR__ . '/.altin-onbellek.json';
const TTL = 1800;

function out(array $d, int $s = 200): void
{
    http_response_code($s);
    echo json_encode($d, JSON_UNESCAPED_UNICODE);
    exit;
}

function getJson(string $url): ?array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_USERAGENT => 'IslamiYasam/1.0 (+https://mix.gen.tr)',
    ]);
    $body = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code !== 200 || !$body) return null;
    $j = json_decode($body, true);
    return is_array($j) ? $j : null;
}

$cur = strtoupper(preg_replace('/[^A-Za-z]/', '', (string)($_GET['c'] ?? 'TRY')) ?? 'TRY');
if (strlen($cur) !== 3) $cur = 'TRY';

$cache = is_file(CACHE) ? json_decode((string)file_get_contents(CACHE), true) : null;
if (!is_array($cache) || ($cache['at'] ?? 0) < time() - TTL) {
    $gold = getJson('https://api.gold-api.com/price/XAU');
    $fx = getJson('https://open.er-api.com/v6/latest/USD');
    if ($gold && isset($gold['price']) && $fx && isset($fx['rates'])) {
        $cache = ['at' => time(), 'xau' => (float)$gold['price'], 'rates' => $fx['rates']];
        @file_put_contents(CACHE, json_encode($cache));
    } elseif (!is_array($cache)) {
        out(['ok' => false, 'error' => 'upstream'], 502);
    }
}

$rate = $cache['rates'][$cur] ?? null;
if (!$rate) out(['ok' => false, 'error' => 'currency'], 400);
$gram = $cache['xau'] / OUNCE_GRAMS * (float)$rate;
out([
    'ok' => true,
    'currency' => $cur,
    'gram' => round($gram, 2),
    'updated' => gmdate('c', (int)$cache['at']),
]);
