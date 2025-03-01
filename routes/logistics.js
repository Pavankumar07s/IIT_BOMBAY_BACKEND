const express = require('express');
const router = express.Router();
const { findRoutes } = require('../controllers/logistics');

router.post('/find-routes', findRoutes);

module.exports = router;