const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { ensureAuth } = require('../lib/passport');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('画像ファイルのみアップロードできます'));
    }
    cb(null, true);
  }
});

router.post('/', ensureAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'file is required' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
