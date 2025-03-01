const errorLogger = (err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    body: req.body
  });
  next(err);
};

module.exports = errorLogger;