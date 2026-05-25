const errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  console.error('[ERROR]', err.message);

  const message = isProd && (!err.status || err.status === 500)
    ? 'Internal server error'
    : err.message || 'Internal server error';

  return res.status(err.status || 500).json({
    success: false,
    message,
  });
};

module.exports = { errorHandler };
