const { createReview, getReviewsByProductId } = require('../models/reviewModel');
const { ok } = require('../utils/apiResponse');

const addReview = async (req, res, next) => {
  try {
    const reviewId = await createReview({
      customerId: req.user.userId,
      productId: req.body.productId,
      rating: req.body.rating,
      text: req.body.text,
    });
    return ok(res, { reviewId }, 'Review added', 201);
  } catch (error) {
    return next(error);
  }
};

const listReviewsByProduct = async (req, res, next) => {
  try {
    const reviews = await getReviewsByProductId(req.params.productId);
    return ok(res, reviews, 'Reviews fetched');
  } catch (error) {
    return next(error);
  }
};

module.exports = { addReview, listReviewsByProduct };
