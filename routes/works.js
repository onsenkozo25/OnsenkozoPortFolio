const express = require('express');
const prisma = require('../lib/prisma');
const { ensureAuth } = require('../lib/passport');

const router = express.Router();

router.get('/', async (req, res, next) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Prisma client not available. Install dependencies and run migrations.' });
  }
  try {
    const kind = req.query.kind === 'made' ? 'made' : req.query.kind === 'did' ? 'did' : null;
    const works = await prisma.work.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 30,
      where: kind ? { kind } : undefined
    });
    res.json(
      works.map((w) => ({
        id: w.id,
        title: w.title,
        slug: w.slug,
        coverImage: w.coverImage,
        excerpt: w.excerpt,
        updatedAt: w.updatedAt,
        kind: w.kind,
        tags: w.tags || []
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get('/:slug', async (req, res, next) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Prisma client not available. Install dependencies and run migrations.' });
  }
  try {
    const slug = String(req.params.slug || '').trim();
    if (!slug) return res.status(400).json({ error: 'slug is required' });
    const work = await prisma.work.findUnique({ where: { slug } });
    if (!work) return res.status(404).json({ error: 'not found' });
    res.json(work);
  } catch (err) {
    next(err);
  }
});

router.post('/', ensureAuth, async (req, res, next) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Prisma client not available. Install dependencies and run migrations.' });
  }
  try {
    const title = String(req.body.title || '').trim();
    const slugRaw = String(req.body.slug || req.body.title || '').trim();
    const slug = slugRaw.replace(/\s+/g, '-');
    const coverImage = req.body.coverImage ? String(req.body.coverImage).trim() : null;
    const excerpt = req.body.excerpt ? String(req.body.excerpt).trim() : null;
    const kind = req.body.kind === 'made' ? 'made' : 'did';
    const tags = Array.isArray(req.body.tags) ? req.body.tags : req.body.tags ? [req.body.tags] : [];
    let contentJson = req.body.contentJson || [];
    if (typeof contentJson === 'string') {
      try {
        contentJson = JSON.parse(contentJson);
      } catch (err) {
        contentJson = [];
      }
    }
    if (!Array.isArray(contentJson)) {
      contentJson = [];
    }
    if (!title || !slug) {
      return res.status(400).json({ error: 'title and slug are required' });
    }
    const payload = { title, slug, coverImage, excerpt, contentJson, kind, tags };
    const work = await prisma.work.upsert({
      where: { slug },
      update: payload,
      create: payload
    });
    res.json(work);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
