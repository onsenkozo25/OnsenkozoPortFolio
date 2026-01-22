<?php
$jsonFile = __DIR__ . '/data/works.json';

echo "Reading file: $jsonFile\n";
if (!file_exists($jsonFile)) {
    echo "File not found!\n";
    exit(1);
}

$content = file_get_contents($jsonFile);
echo "File size: " . strlen($content) . " bytes\n";

$data = json_decode($content, true);

if ($data === null) {
    echo "JSON Decode Error: " . json_last_error_msg() . "\n";
    echo "JSON Error Code: " . json_last_error() . "\n";
} else {
    echo "JSON Decode Success. Items: " . count($data) . "\n";
}
