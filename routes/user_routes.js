const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser'); //import body-parser to use and named it as bodyParser
const bcrypt = require('bcryptjs'); //for password encryption
router.use(bodyParser.urlencoded({extended:true})); //use the body-parser to parseencoded url data

module.exports = router;