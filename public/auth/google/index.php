<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/helpers.php';

$config = auth_config();
$clientId = $config['client_id'] ?? '';
$redirectUri = $config['redirect_uri'] ?? '';

if ($clientId === '' || $redirectUri === '') {
    http_response_code(500);
    echo 'OAuthが設定されていません。data/oauth.phpを設定してください。';
    exit;
}

auth_start();
$state = bin2hex(random_bytes(16));
$_SESSION['oauth_state'] = $state;

$params = [
    'client_id' => $clientId,
    'redirect_uri' => $redirectUri,
    'response_type' => 'code',
    'scope' => 'openid email profile',
    'access_type' => 'online',
    'prompt' => 'select_account',
    'state' => $state
];

$authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
header('Location: ' . $authUrl);
exit;
