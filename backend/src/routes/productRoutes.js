const express = require('express');
const {
  listProducts,
  listMyVendorProducts,
  getVendorStorefront,
  getSingleProduct,
  listCategories,
  addProduct,
  editProduct,
  removeProduct,
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const { createProductValidator, updateProductValidator } = require('../validators/productValidator');

const router = express.Router();

router.get('/', listProducts);
router.get('/categories', listCategories);
router.get('/vendors/:vendorId/storefront', getVendorStorefront);
router.get('/vendor/me', authenticate, authorize('Vendor'), listMyVendorProducts);
router.get('/:id', getSingleProduct);
router.post('/', authenticate, authorize('Vendor'), createProductValidator, validateRequest, addProduct);
router.put('/:id', authenticate, authorize('Vendor', 'Admin'), updateProductValidator, validateRequest, editProduct);
router.delete('/:id', authenticate, authorize('Vendor', 'Admin'), removeProduct);

module.exports = router;
