// Language middleware to set the language based on header
const languageMiddleware = (req, res, next) => {
  // Get language from header or default to English
  const lang = req.headers['lang'] || 'en';

  // Validate language - only accept 'en' or 'ar'
  req.lang = lang === 'ar' ? 'ar' : 'en';

  next();
};

module.exports = languageMiddleware;
