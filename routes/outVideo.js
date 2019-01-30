var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.sendFile(appRoot + '/videos/out.mp4')
});

module.exports = router;
