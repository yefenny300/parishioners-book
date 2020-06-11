const express = require('express');
const router = express.Router();

// @route GET api/parishioners
// @desc Test route
// @access Public

router.get('/', (req, res) => res.send('Parishioners route'));

module.exports = router;
