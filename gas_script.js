/**
 * GETリクエスト確認用
 */
function doGet(e) {
    return ContentService.createTextOutput("Contact Form API is running.");
}

/**
 * POSTリクエストでお問い合わせメールを送信
 */
function doPost(e) {
    const TO_EMAIL = "caprex27@gmail.com";

    try {
        // リクエストデータを解析
        const data = JSON.parse(e.postData.contents);
        const name = data.name || "名前未入力";
        const email = data.email || "メール未入力";
        const message = data.message || "本文なし";

        // 件名
        const subject = "【お問い合わせ】" + name + "様からメッセージが届きました";

        // HTML形式のメール本文（綺麗なUI）
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #2d5a4a 0%, #3d7a6a 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
    .content {
      padding: 24px;
    }
    .field {
      margin-bottom: 20px;
    }
    .field-label {
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .field-value {
      font-size: 16px;
      color: #333;
      background: #f9f9f9;
      padding: 12px 16px;
      border-radius: 8px;
      border-left: 4px solid #2d5a4a;
    }
    .message-box {
      background: #f9f9f9;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #2d5a4a;
      white-space: pre-wrap;
      line-height: 1.6;
      color: #333;
    }
    .footer {
      background: #f0f0f0;
      padding: 16px 24px;
      text-align: center;
      font-size: 12px;
      color: #888;
    }
    .reply-btn {
      display: inline-block;
      background: #2d5a4a;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>新しいお問い合わせ</h1>
    </div>
    <div class="content">
      <div class="field">
        <div class="field-label">お名前</div>
        <div class="field-value">${escapeHtml(name)}</div>
      </div>
      <div class="field">
        <div class="field-label">メールアドレス</div>
        <div class="field-value">
          <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
        </div>
      </div>
      <div class="field">
        <div class="field-label">メッセージ</div>
        <div class="message-box">${escapeHtml(message)}</div>
      </div>
      <div style="text-align: center;">
        <a href="mailto:${escapeHtml(email)}?subject=Re: お問い合わせありがとうございます" class="reply-btn" style="color: white;">
          返信する
        </a>
      </div>
    </div>
    <div class="footer">
      onsenkozo.jp からのお問い合わせ
    </div>
  </div>
</body>
</html>
    `;

        // プレーンテキスト版（HTMLが表示できない環境用）
        const plainBody = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📬 新しいお問い合わせ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【お名前】
${name}

【メールアドレス】
${email}

【メッセージ】
${message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
onsenkozo.jp からのお問い合わせ
    `;

        // メール送信
        GmailApp.sendEmail(TO_EMAIL, subject, plainBody, {
            htmlBody: htmlBody,
            replyTo: email,
            name: "Portfolio Contact Form"
        });

        return ContentService.createTextOutput(JSON.stringify({
            status: "success",
            message: "メールを送信しました"
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            message: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
