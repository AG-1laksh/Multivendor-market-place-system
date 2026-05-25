const express = require('express');
const { addToCart, updateCart, deleteCartItem, getCart } = require('../controllers/cartController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { addToCartValidator, updateCartValidator } = require('../validators/cartValidator');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();

router.post('/', authenticate, authorize('Customer'), addToCartValidator, validateRequest, addToCart);
router.put('/:cartItemId', authenticate, authorize('Customer'), updateCartValidator, validateRequest, updateCart);
router.delete('/:cartItemId', authenticate, authorize('Customer'), deleteCartItem);
router.get('/:customerId', authenticate, authorize('Customer', 'Admin'), getCart);

module.exports = router;
