const express = require('express');
const path = require('path');
const { ensureAuth } = require('../lib/passport');

const router = express.Router();
const adminDist = path.join(__dirname, '..', 'admin', 'dist');

router.use(ensureAuth);
router.use(express.static(adminDist));

router.get('*', (req, res) => {
  res.sendFile(path.join(adminDist, 'index.html'));
});

module.exports = router;
