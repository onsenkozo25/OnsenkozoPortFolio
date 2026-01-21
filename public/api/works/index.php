<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$root = dirname(__DIR__, 3);
$dataFile = $root . '/data/works.json';
require_once dirname(__DIR__, 2) . '/auth/helpers.php';

function jsonResponse($payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function readWorks(string $dataFile): array
{
    if (!file_exists($dataFile)) {
        return [];
    }
    $raw = file_get_contents($dataFile);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function writeWorks(string $dataFile, array $works): void
{
    $dir = dirname($dataFile);
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    $tempFile = $dataFile . '.tmp';
    $json = json_encode($works, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    file_put_contents($tempFile, $json, LOCK_EX);
    rename($tempFile, $dataFile);
}

function resolveSlug(): string
{
    if (!empty($_GET['slug'])) {
        return trim((string) $_GET['slug']);
    }
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    $path = trim((string) $path, '/');
    $parts = explode('/', $path);
    if (count($parts) >= 3) {
        return urldecode($parts[2]);
    }
    return '';
}

if ($method === 'GET') {
    $slug = resolveSlug();
    $works = readWorks($dataFile);
    if ($slug !== '') {
        foreach ($works as $work) {
            if (($work['slug'] ?? '') === $slug) {
                jsonResponse($work);
            }
        }
        jsonResponse(['error' => 'not found'], 404);
    }

    $kind = $_GET['kind'] ?? null;
    if ($kind !== 'did' && $kind !== 'made') {
        $kind = null;
    }
    if ($kind) {
        $works = array_values(array_filter($works, function ($work) use ($kind) {
            return ($work['kind'] ?? 'did') === $kind;
        }));
    }
    usort($works, function ($a, $b) {
        $aTime = strtotime($a['updatedAt'] ?? $a['createdAt'] ?? '1970-01-01T00:00:00Z');
        $bTime = strtotime($b['updatedAt'] ?? $b['createdAt'] ?? '1970-01-01T00:00:00Z');
        return $bTime <=> $aTime;
    });
    $list = array_map(function ($work) {
        return [
            'id' => $work['id'] ?? null,
            'title' => $work['title'] ?? '',
            'slug' => $work['slug'] ?? '',
            'coverImage' => $work['coverImage'] ?? null,
            'excerpt' => $work['excerpt'] ?? null,
            'updatedAt' => $work['updatedAt'] ?? $work['createdAt'] ?? null,
            'kind' => $work['kind'] ?? 'did',
            'tags' => $work['tags'] ?? []
        ];
    }, $works);
    jsonResponse($list);
}

if ($method === 'POST') {
    auth_require_login(true);
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        jsonResponse(['error' => 'invalid json'], 400);
    }
    $title = trim((string) ($payload['title'] ?? ''));
    $slugRaw = trim((string) ($payload['slug'] ?? $payload['title'] ?? ''));
    $slug = preg_replace('/\s+/', '-', $slugRaw);
    $coverImage = isset($payload['coverImage']) ? trim((string) $payload['coverImage']) : null;
    $excerpt = isset($payload['excerpt']) ? trim((string) $payload['excerpt']) : null;
    $kind = ($payload['kind'] ?? '') === 'made' ? 'made' : 'did';

    $tags = [];
    if (isset($payload['tags'])) {
        $tags = is_array($payload['tags']) ? $payload['tags'] : [$payload['tags']];
        $tags = array_values(array_filter(array_map(function ($tag) {
            return trim((string) $tag);
        }, $tags), 'strlen'));
    }

    $contentJson = $payload['contentJson'] ?? [];
    if (is_string($contentJson)) {
        $decoded = json_decode($contentJson, true);
        $contentJson = is_array($decoded) ? $decoded : [];
    }
    if (!is_array($contentJson)) {
        $contentJson = [];
    }

    if ($title === '' || $slug === '') {
        jsonResponse(['error' => 'title and slug are required'], 400);
    }

    $works = readWorks($dataFile);
    $now = gmdate('c');
    foreach ($works as $index => $work) {
        if (($work['slug'] ?? '') === $slug) {
            $works[$index] = array_merge($work, [
                'title' => $title,
                'slug' => $slug,
                'coverImage' => $coverImage,
                'excerpt' => $excerpt,
                'contentJson' => $contentJson,
                'kind' => $kind,
                'tags' => $tags,
                'updatedAt' => $now
            ]);
            writeWorks($dataFile, $works);
            jsonResponse($works[$index]);
        }
    }

    $maxId = 0;
    foreach ($works as $work) {
        $id = (int) ($work['id'] ?? 0);
        if ($id > $maxId) {
            $maxId = $id;
        }
    }
    $newWork = [
        'id' => $maxId + 1,
        'title' => $title,
        'slug' => $slug,
        'coverImage' => $coverImage,
        'excerpt' => $excerpt,
        'contentJson' => $contentJson,
        'kind' => $kind,
        'tags' => $tags,
        'createdAt' => $now,
        'updatedAt' => $now
    ];
    $works[] = $newWork;
    writeWorks($dataFile, $works);
    jsonResponse($newWork);
}

jsonResponse(['error' => 'method not allowed'], 405);
