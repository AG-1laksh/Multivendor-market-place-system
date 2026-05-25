const { body } = require('express-validator');

const addToCartValidator = [
  body('productId').isInt({ min: 1 }).withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be >= 1'),
];

const updateCartValidator = [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be >= 1'),
];

module.exports = { addToCartValidator, updateCartValidator };
