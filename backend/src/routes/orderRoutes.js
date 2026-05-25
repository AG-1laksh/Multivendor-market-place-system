const express = require('express');
const { createOrder, getCustomerOrders, getVendorOrders, getSavedAddresses } = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { createOrderValidator } = require('../validators/orderValidator');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();

router.post('/', authenticate, authorize('Customer', 'Admin'), createOrderValidator, validateRequest, createOrder);
router.get('/addresses/me', authenticate, authorize('Customer'), getSavedAddresses);
router.get('/vendor/me', authenticate, authorize('Vendor', 'Admin'), getVendorOrders);
router.get('/:customerId', authenticate, authorize('Customer', 'Admin'), getCustomerOrders);

module.exports = router;
