const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const ejs = require('ejs');

// --- Configuration ---
const PROJECT_ROOT = path.resolve(__dirname, '../');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const XSERVER_DIR = path.join(PROJECT_ROOT, 'xserver');
const ENV_PATH = path.join(PROJECT_ROOT, '.env');
const OAUTH_PHP_PATH = path.join(XSERVER_DIR, 'data/oauth.php');
const VIEWS_DIR = path.join(PROJECT_ROOT, 'views');
const INDEX_EJS_PATH = path.join(VIEWS_DIR, 'index.ejs');
const INDEX_HTML_PATH = path.join(XSERVER_DIR, 'index.html');

// Directories to sync from public/ -> xserver/
const SYNC_DIRS = [
    'stylesheets',
    'javascripts',
    'images',
    'admin'
];

// --- 1. Load Environment Variables ---
console.log(`Loading .env from ${ENV_PATH}...`);
const envConfig = dotenv.config({ path: ENV_PATH }).parsed;

if (!envConfig) {
    console.warn('Warning: Could not find or parse .env file. Using empty values.');
}

// --- 2. Update xserver/data/oauth.php ---
console.log(`Updating ${OAUTH_PHP_PATH}...`);

const phpContent = `<?php
return [
    'client_id' => '${envConfig?.GOOGLE_CLIENT_ID || ''}',
    'client_secret' => '${envConfig?.GOOGLE_CLIENT_SECRET || ''}',
    'redirect_uri' => '${envConfig?.GOOGLE_CALLBACK_URL_PRODUCTION || envConfig?.GOOGLE_CALLBACK_URL || ''}',
    'allowed_email' => '${envConfig?.ALLOWED_EMAIL || ''}',
    'gas_url' => '${envConfig?.CONTACT_GAS_URL || ''}'
];
`;

try {
    fs.mkdirSync(path.dirname(OAUTH_PHP_PATH), { recursive: true });
    fs.writeFileSync(OAUTH_PHP_PATH, phpContent);
    console.log('✅ Updated oauth.php');
} catch (error) {
    console.error('❌ Error updating oauth.php:', error);
    process.exit(1);
}

// --- 3. Render index.ejs -> xserver/index.html ---
console.log(`Rendering ${INDEX_EJS_PATH} -> ${INDEX_HTML_PATH}...`);
try {
    const template = fs.readFileSync(INDEX_EJS_PATH, 'utf-8');
    // Matching the title from routes/index.js
    const html = ejs.render(template, { title: 'なかたにいっしんについて' });
    fs.writeFileSync(INDEX_HTML_PATH, html);
    console.log('✅ Generated index.html from ejs');
} catch (error) {
    console.error('❌ Error rendering index.ejs:', error);
    process.exit(1);
}

// --- 4. Sync Assets ---
console.log('Syncing assets...');

SYNC_DIRS.forEach(dirName => {
    const srcPath = path.join(PUBLIC_DIR, dirName);
    const destPath = path.join(XSERVER_DIR, dirName);

    if (!fs.existsSync(srcPath)) {
        console.log(`⚠️ Source directory not found: ${srcPath}, skipping.`);
        return;
    }

    try {
        // Recursive copy (Node 16.7.0+)
        console.log(`Copying ${srcPath} -> ${destPath}...`);
        fs.cpSync(srcPath, destPath, { recursive: true, force: true });
        console.log(`✅ Synced ${dirName}`);
    } catch (error) {
        console.error(`❌ Error syncing ${dirName}:`, error);
    }
});

// --- 5. Copy Admin Build (admin/dist -> xserver/admin) ---
const ADMIN_DIST = path.join(PROJECT_ROOT, 'admin/dist');
const XSERVER_ADMIN = path.join(XSERVER_DIR, 'admin');

if (fs.existsSync(ADMIN_DIST)) {
    console.log(`Copying admin build from ${ADMIN_DIST} -> ${XSERVER_ADMIN}...`);
    try {
        fs.cpSync(ADMIN_DIST, XSERVER_ADMIN, { recursive: true, force: true });
        console.log('✅ Synced admin build (admin/dist)');
    } catch (error) {
        console.error('❌ Error syncing admin build:', error);
    }
} else {
    console.warn('⚠️ admin/dist not found. Run npm run admin:build first.');
}

console.log('\n🎉 XServer build complete! The "xserver" folder is ready for upload.');
console.log(`📂 Location: ${XSERVER_DIR}`);
