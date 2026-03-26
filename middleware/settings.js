const Settings = require('../models/Settings');

let cachedSettings = {};
let lastFetch = 0;
const CACHE_TTL = 5000; // 5 seconds

module.exports = async (req, res, next) => {
  // Cache settings briefly to avoid DB hits on every request
  const now = Date.now();
  if (now - lastFetch > CACHE_TTL) {
    cachedSettings = await Settings.getAll();
    lastFetch = now;
  }

  // Make settings available in all views
  res.locals.settings = cachedSettings;

  // Also attach to req for use in routes/middleware
  req.appSettings = cachedSettings;

  next();
};
