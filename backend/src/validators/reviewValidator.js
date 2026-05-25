const { body } = require('express-validator');

const createReviewValidator = [
  body('productId').isInt({ min: 1 }).withMessage('Product ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('text').optional().isString().trim(),
];

module.exports = { createReviewValidator };
