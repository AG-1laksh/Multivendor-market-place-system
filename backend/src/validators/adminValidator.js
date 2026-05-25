const { body, param } = require('express-validator');

const createCategoryValidator = [
  body('categoryName')
    .isString()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Category name must be between 2 and 80 characters'),
];

const categoryIdParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid category ID is required'),
];

module.exports = { createCategoryValidator, categoryIdParamValidator };
