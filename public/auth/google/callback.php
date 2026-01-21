<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/helpers.php';

$config = auth_config();
$clientId = $config['client_id'] ?? '';
$clientSecret = $config['client_secret'] ?? '';
$redirectUri = $config['redirect_uri'] ?? '';
$allowedEmail = strtolower(trim((string) ($config['allowed_email'] ?? '')));

if ($clientId === '' || $clientSecret === '' || $redirectUri === '') {
    http_response_code(500);
    echo 'OAuthが設定されていません。data/oauth.phpを設定してください。';
    exit;
}

auth_start();
$state = $_GET['state'] ?? '';
if ($state === '' || empty($_SESSION['oauth_state']) || $state !== $_SESSION['oauth_state']) {
    http_response_code(400);
    echo 'Invalid state.';
    exit;
}
unset($_SESSION['oauth_state']);

$code = $_GET['code'] ?? '';
if ($code === '') {
    http_response_code(400);
    echo 'Missing code.';
    exit;
}

$tokenResponse = file_get_contents(
    'https://oauth2.googleapis.com/token',
    false,
    stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => http_build_query([
                'code' => $code,
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'redirect_uri' => $redirectUri,
                'grant_type' => 'authorization_code'
            ])
        ]
    ])
);

if ($tokenResponse === false) {
    http_response_code(500);
    echo 'Token request failed.';
    exit;
}

$tokenData = json_decode($tokenResponse, true);
$accessToken = $tokenData['access_token'] ?? '';
if ($accessToken === '') {
    http_response_code(500);
    echo 'Access token not found.';
    exit;
}

$userInfoResponse = file_get_contents(
    'https://openidconnect.googleapis.com/v1/userinfo',
    false,
    stream_context_create([
        'http' => [
            'header' => 'Authorization: Bearer ' . $accessToken
        ]
    ])
);

if ($userInfoResponse === false) {
    http_response_code(500);
    echo 'Userinfo request failed.';
    exit;
}

$userInfo = json_decode($userInfoResponse, true);
$email = strtolower(trim((string) ($userInfo['email'] ?? '')));
$emailVerified = $userInfo['email_verified'] ?? false;

if ($email === '' || !$emailVerified) {
    http_response_code(403);
    echo 'Email is not verified.';
    exit;
}

if ($allowedEmail !== '' && $email !== $allowedEmail) {
    http_response_code(403);
    echo 'Not allowed.';
    exit;
}

$_SESSION['auth_user'] = [
    'email' => $email,
    'name' => $userInfo['name'] ?? ''
];

header('Location: /admin/');
exit;
