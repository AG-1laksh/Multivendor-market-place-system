const express = require('express');
const { addReview, listReviewsByProduct } = require('../controllers/reviewController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { createReviewValidator } = require('../validators/reviewValidator');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();

router.post('/', authenticate, authorize('Customer'), createReviewValidator, validateRequest, addReview);
router.get('/:productId', listReviewsByProduct);

module.exports = router;
