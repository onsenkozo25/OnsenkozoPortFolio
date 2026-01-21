<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/auth/helpers.php';
auth_require_login(false);

$indexFile = __DIR__ . '/index.html';
if (!file_exists($indexFile)) {
    http_response_code(404);
    echo 'Admin build not found.';
    exit;
}

readfile($indexFile);
