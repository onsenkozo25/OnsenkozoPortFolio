const express = require('express');
const path = require('path');
const multer = require('multer');
const prisma = require('../lib/prisma');
const { ensureAuth } = require('../lib/passport');

const router = express.Router();

router.use(ensureAuth);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
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

router.get('/', async (req, res, next) => {
  if (!prisma) {
    return res.status(503).send('Prisma client not available. Install dependencies and run migrations.');
  }
  try {
    const works = await prisma.work.findMany({
      orderBy: { date: 'desc' },
      take: 20
    });
    res.render('admin', { works, user: req.user });
  } catch (err) {
    next(err);
  }
});

router.post('/works', upload.single('image'), async (req, res, next) => {
  if (!prisma) {
    return res.status(503).send('Prisma client not available. Install dependencies and run migrations.');
  }
  try {
    const { title, date, excerpt, body, imageUrl, kind } = req.body;
    const uploaded = req.file ? `/uploads/${req.file.filename}` : null;
    await prisma.work.create({
      data: {
        title: title || 'タイトル未設定',
        date: date ? new Date(date) : new Date(),
        excerpt: excerpt || '',
        body: body || '',
        imageUrl: uploaded || imageUrl || null,
        kind: kind === 'made' ? 'made' : 'did'
      }
    });
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

router.post('/works/:id/delete', async (req, res, next) => {
  if (!prisma) {
    return res.status(503).send('Prisma client not available. Install dependencies and run migrations.');
  }
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.redirect('/admin');
    await prisma.work.delete({ where: { id } });
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
