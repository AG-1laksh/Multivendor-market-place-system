const {
  addOrIncrementCartItem,
  updateCartItem,
  removeCartItem,
  getCartByCustomerId,
} = require('../models/cartModel');
const { ok, fail } = require('../utils/apiResponse');

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const cartItemId = await addOrIncrementCartItem({
      customerId: req.user.userId,
      productId,
      quantity,
    });
    return ok(res, { cartItemId }, 'Item added to cart', 201);
  } catch (error) {
    return next(error);
  }
};

const updateCart = async (req, res, next) => {
  try {
    const updated = await updateCartItem(req.params.cartItemId, req.body.quantity, req.user.userId);
    if (!updated) return fail(res, 'Cart item not found', 404);

    return ok(res, null, 'Cart item updated');
  } catch (error) {
    return next(error);
  }
};

const deleteCartItem = async (req, res, next) => {
  try {
    const removed = await removeCartItem(req.params.cartItemId, req.user.userId);
    if (!removed) return fail(res, 'Cart item not found', 404);

    return ok(res, null, 'Cart item removed');
  } catch (error) {
    return next(error);
  }
};

const getCart = async (req, res, next) => {
  try {
    const requestedCustomerId = Number(req.params.customerId);
    if (req.user.role === 'Customer' && req.user.userId !== requestedCustomerId) {
      return fail(res, 'Forbidden: cannot access other customer carts', 403);
    }

    const cart = await getCartByCustomerId(requestedCustomerId);
    return ok(res, cart, 'Cart fetched');
  } catch (error) {
    return next(error);
  }
};

module.exports = { addToCart, updateCart, deleteCartItem, getCart };
