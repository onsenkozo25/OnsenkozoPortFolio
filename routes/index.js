var express = require('express');
var router = express.Router();

// Home page renders a personal portfolio landing view.
router.get('/', function(req, res) {
  res.render('index', { title: 'なかたにいっしんについて' });
});

module.exports = router;
