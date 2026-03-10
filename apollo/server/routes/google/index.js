const express = require('express');
const router = express.Router();
const driveRoutes = require('./driveRoutes');
const calendarRoutes = require('./calendarRoutes');
const tasksRoutes = require('./tasksRoutes');

// Mount all sub-routers
router.use(driveRoutes);
router.use(calendarRoutes);
router.use(tasksRoutes);

module.exports = router;
