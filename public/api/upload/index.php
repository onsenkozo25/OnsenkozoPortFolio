<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

function jsonResponse($payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    jsonResponse(['error' => 'method not allowed'], 405);
}

if (!isset($_FILES['file'])) {
    jsonResponse(['error' => 'file is required'], 400);
}

$file = $_FILES['file'];
if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    jsonResponse(['error' => 'upload failed'], 400);
}

$root = dirname(__DIR__, 3);
$uploadDir = $root . '/public/uploads';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0775, true);
}

$original = basename((string) ($file['name'] ?? 'upload'));
$extension = pathinfo($original, PATHINFO_EXTENSION);
$base = pathinfo($original, PATHINFO_FILENAME);
$base = preg_replace('/[^A-Za-z0-9._-]/', '', $base);
if ($base === '') {
    $base = 'upload';
}
$timestamp = (string) round(microtime(true) * 1000);
$safeExt = $extension ? preg_replace('/[^A-Za-z0-9]/', '', $extension) : '';
$filename = $timestamp . '_' . $base . ($safeExt ? '.' . $safeExt : '');
$destination = $uploadDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    jsonResponse(['error' => 'upload failed'], 500);
}

jsonResponse(['url' => '/uploads/' . $filename]);
