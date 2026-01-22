<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/plain; charset=utf-8');

echo "--- Debug Info ---\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Script: " . __FILE__ . "\n";
echo "Dir: " . __DIR__ . "\n";

$root = dirname(__DIR__, 2);
echo "Root: $root\n";
$dataFile = $root . '/data/works.json';
echo "Data File: $dataFile\n";

if (file_exists($dataFile)) {
    echo "Data file OK.\n";
    $content = file_get_contents($dataFile);
    $data = json_decode($content, true);
    if ($data !== null) {
        echo "JSON Decode OK. Items: " . count($data) . "\n";
        if (count($data) > 0) {
            echo "First Item ID: " . $data[0]['id'] . "\n";
        }
    } else {
        echo "JSON Decode FAILED: " . json_last_error_msg() . "\n";
    }
} else {
    echo "Data file NOT FOUND.\n";
}

echo "\n--- Auth Include Test ---\n";
ob_start();
require_once dirname(__DIR__, 2) . '/auth/helpers.php';
$output = ob_get_clean();

if (strlen($output) > 0) {
    echo "WARNING: auth/helpers.php produced output (Bad):\n";
    echo "[" . $output . "]\n";
} else {
    echo "Auth include produced no output (Good).\n";
}

echo "\n--- End Debug ---\n";
