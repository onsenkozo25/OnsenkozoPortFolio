const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { ensureAuth } = require('../lib/passport');

const router = express.Router();
const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'works.json');

const readWorks = async () => {
  try {
    const raw = await fs.readFile(dataFile, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
};

const writeWorks = async (works) => {
  await fs.mkdir(dataDir, { recursive: true });
  const tempFile = `${dataFile}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(works, null, 2), 'utf-8');
  await fs.rename(tempFile, dataFile);
};

router.get('/', async (req, res, next) => {
  try {
    const kind = req.query.kind === 'made' ? 'made' : req.query.kind === 'did' ? 'did' : null;
    const works = await readWorks();
    const filtered = kind ? works.filter((work) => work.kind === kind) : works;
    const sorted = filtered.sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
    res.json(
      sorted.slice(0, 30).map((work) => ({
        id: work.id,
        title: work.title,
        slug: work.slug,
        coverImage: work.coverImage || null,
        excerpt: work.excerpt || null,
        updatedAt: work.updatedAt || work.createdAt || null,
        kind: work.kind || 'did',
        tags: work.tags || []
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').trim();
    if (!slug) return res.status(400).json({ error: 'slug is required' });
    const works = await readWorks();
    const work = works.find((item) => item.slug === slug);
    if (!work) return res.status(404).json({ error: 'not found' });
    res.json(work);
  } catch (err) {
    next(err);
  }
});

router.post('/', ensureAuth, async (req, res, next) => {
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

    const works = await readWorks();
    const now = new Date().toISOString();
    const existingIndex = works.findIndex((item) => item.slug === slug);
    if (existingIndex >= 0) {
      works[existingIndex] = {
        ...works[existingIndex],
        title,
        slug,
        coverImage,
        excerpt,
        contentJson,
        kind,
        tags,
        updatedAt: now
      };
      await writeWorks(works);
      return res.json(works[existingIndex]);
    }

    const nextId =
      works.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
    const newWork = {
      id: nextId,
      title,
      slug,
      coverImage,
      excerpt,
      contentJson,
      kind,
      tags,
      createdAt: now,
      updatedAt: now
    };
    works.push(newWork);
    await writeWorks(works);
    return res.json(newWork);
  } catch (err) {
    next(err);
  }
});

router.delete('/:slug', ensureAuth, async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').trim();
    if (!slug) return res.status(400).json({ error: 'slug is required' });

    const works = await readWorks();
    const index = works.findIndex((item) => item.slug === slug);
    if (index < 0) return res.status(404).json({ error: 'not found' });

    const deletedWork = works[index];
    works.splice(index, 1);
    await writeWorks(works);
    res.json({ message: 'deleted', slug, deletedWork });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
