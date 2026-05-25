const { body } = require('express-validator');

const createProductValidator = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('description').optional().isString().trim(),
  body('imageUrl').optional({ checkFalsy: true, nullable: true }).isURL().withMessage('Image URL must be valid'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be > 0'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be >= 0'),
  body('categoryId').isInt({ min: 1 }).withMessage('Category ID is required'),
];

const updateProductValidator = [
  body('name').optional().isString().trim().notEmpty(),
  body('description').optional().isString().trim(),
  body('imageUrl').optional({ checkFalsy: true, nullable: true }).isURL().withMessage('Image URL must be valid'),
  body('price').optional().isFloat({ gt: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('categoryId').optional().isInt({ min: 1 }),
];

module.exports = { createProductValidator, updateProductValidator };
