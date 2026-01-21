<?php
declare(strict_types=1);

function auth_start(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

function auth_config(): array
{
    $root = dirname(__DIR__, 2);
    $paths = [
        $root . '/data/oauth.php',
        $root . '/data/oauth.example.php'
    ];
    foreach ($paths as $path) {
        if (file_exists($path)) {
            $config = require $path;
            if (is_array($config)) {
                return $config;
            }
        }
    }
    return [];
}

function auth_is_logged_in(): bool
{
    auth_start();
    return !empty($_SESSION['auth_user']['email']);
}

function auth_require_login(bool $asJson = false): void
{
    if (auth_is_logged_in()) {
        return;
    }
    if ($asJson) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'unauthorized'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    header('Location: /auth/google');
    exit;
}
