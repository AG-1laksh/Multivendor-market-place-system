const express = require('express');
const {
  getUsers,
  getCategories,
  addCategory,
  removeCategory,
  getOrders,
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const { createCategoryValidator, categoryIdParamValidator } = require('../validators/adminValidator');

const router = express.Router();

router.use(authenticate, authorize('Admin'));

router.get('/users', getUsers);
router.get('/categories', getCategories);
router.post('/categories', createCategoryValidator, validateRequest, addCategory);
router.delete('/categories/:id', categoryIdParamValidator, validateRequest, removeCategory);
router.get('/orders', getOrders);

module.exports = router;
