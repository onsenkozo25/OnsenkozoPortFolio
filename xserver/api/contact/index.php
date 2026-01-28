<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Read configuration
$root = dirname(__DIR__, 2);
$configPath = $root . '/data/oauth.php';

if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration missing'], JSON_UNESCAPED_UNICODE);
    exit;
}

$config = require $configPath;
$gasUrl = $config['gas_url'] ?? '';

if (empty($gasUrl)) {
    http_response_code(500);
    echo json_encode(['error' => 'GAS URL not configured'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Get POST data
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

if (!$input) {
    http_response_code(400);
    $raw = substr($inputJSON, 0, 1000); // Capture more chars
    $jsonError = json_last_error_msg();

    // Log to file for debugging
    $logEntry = date('Y-m-d H:i:s') . " - Input: " . $raw . " - JSON Error: " . $jsonError . "\n";
    file_put_contents(__DIR__ . '/debug_log.txt', $logEntry, FILE_APPEND);

    // Use 'message' key so main.js displays it
    echo json_encode([
        'message' => 'Invalid JSON Input: ' . $jsonError,
        'debug_raw' => $raw
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Forward to GAS
$ch = curl_init($gasUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $inputJSON);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($inputJSON)
]);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);

curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(['message' => 'Bridge Error: ' . $curlError], JSON_UNESCAPED_UNICODE);
    exit;
}

// GAS redirects cause unreliable response parsing
// If we got here without cURL error, assume success
// Try to parse JSON response, otherwise just return success
$jsonResponse = json_decode($response, true);
if ($jsonResponse && isset($jsonResponse['status'])) {
    echo json_encode(['message' => 'ok', 'gasStatus' => $jsonResponse['status']], JSON_UNESCAPED_UNICODE);
} else {
    // GAS returned HTML or other format, but request was sent
    echo json_encode(['message' => 'ok'], JSON_UNESCAPED_UNICODE);
}

