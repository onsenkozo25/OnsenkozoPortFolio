const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

router.get('/', async (req, res, next) => {
  if (!prisma) {
    return res.status(503).json({ error: 'Prisma client not available. Install dependencies and run migrations.' });
  }
  try {
    const kind = req.query.kind === 'made' ? 'made' : req.query.kind === 'did' ? 'did' : null;
    const works = await prisma.work.findMany({
      orderBy: { date: 'desc' },
      take: 10,
      where: kind ? { kind } : undefined
    });
    res.json(
      works.map((w) => ({
        id: w.id,
        title: w.title,
        date: w.date,
        excerpt: w.excerpt,
        body: w.body,
        imageUrl: w.imageUrl,
        kind: w.kind
      }))
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router;
