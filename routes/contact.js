var express = require('express');
var nodemailer = require('nodemailer');

var router = express.Router();

function buildTransportConfig() {
  var user = process.env.SMTP_USER;

  // OAuth2 support
  var clientId = process.env.GOOGLE_CLIENT_ID;
  var clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  var refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken && user) {
    return {
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: user,
        clientId: clientId,
        clientSecret: clientSecret,
        refreshToken: refreshToken
      }
    };
  }

  var pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;

  if (process.env.SMTP_SERVICE) {
    return {
      service: process.env.SMTP_SERVICE,
      auth: { user: user, pass: pass }
    };
  }

  var host = process.env.SMTP_HOST;
  if (!host) return null;
  var port = Number(process.env.SMTP_PORT || 587);
  var secure = process.env.SMTP_SECURE === 'true' || port === 465;
  return {
    host: host,
    port: port,
    secure: secure,
    auth: { user: user, pass: pass }
  };
}

function sanitizeHeader(value) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

router.post('/', async function (req, res) {
  try {
    var name = sanitizeHeader(req.body && req.body.name);
    var email = sanitizeHeader(req.body && req.body.email);
    var message = String((req.body && req.body.message) || '').trim();

    if (!name || !email || !message) {
      return res.status(400).json({ message: '必須項目が不足しています。' });
    }

    var transportConfig = buildTransportConfig();
    if (!transportConfig) {
      return res.status(500).json({ message: 'メール送信設定が未完了です。' });
    }

    var transporter = nodemailer.createTransport(transportConfig);
    var to = process.env.CONTACT_TO || 'caprex27@gmail.com';
    var from = process.env.CONTACT_FROM || process.env.SMTP_USER;
    var subject = '[Portfolio] ' + name;
    var text =
      'Name: ' +
      name +
      '\nEmail: ' +
      email +
      '\n\nMessage:\n' +
      message;

    await transporter.sendMail({
      from: from,
      to: to,
      replyTo: email,
      subject: subject,
      text: text
    });

    return res.json({ message: 'ok' });
  } catch (err) {
    console.error('Contact mail error:', err);
    return res.status(500).json({ message: '送信に失敗しました。' });
  }
});

module.exports = router;
