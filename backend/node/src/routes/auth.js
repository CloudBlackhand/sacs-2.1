const express = require('express');
const { loginHandler } = require('../middlewares/auth');

const router = express.Router();

router.post('/login', loginHandler);

module.exports = router;


