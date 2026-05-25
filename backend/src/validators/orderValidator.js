const { body } = require('express-validator');

const createOrderValidator = [
  body('customerId').optional().isInt({ min: 1 }).withMessage('Customer ID must be valid when provided'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be >= 1'),
  body('paymentMode').isIn(['UPI', 'CARD', 'COD', 'NET_BANKING']).withMessage('Invalid payment mode'),
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
  body('shippingAddress.phone')
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be 10-15 characters'),
  body('shippingAddress.street').trim().notEmpty().withMessage('Street address is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.pincode').trim().notEmpty().withMessage('Pincode is required'),
  body('shippingAddress.country').trim().notEmpty().withMessage('Country is required'),
];

module.exports = { createOrderValidator };
