const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }
  
  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: 'Duplicate Entry',
      details: 'A record with this value already exists'
    });
  }
  
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;