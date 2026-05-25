const { body } = require('express-validator');

const registerValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 chars')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
    .withMessage('Password must include upper, lower, number, and special character'),
  body('role').isIn(['Customer', 'Vendor']).withMessage('Role must be Customer or Vendor'),
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phoneNo')
    .optional()
    .isString()
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Phone number must be 10 to 15 digits'),
];

const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { registerValidator, loginValidator };
