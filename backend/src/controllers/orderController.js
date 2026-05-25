const {
  createOrderWithItems,
  getOrdersByCustomerId,
  getOrdersByVendorId,
  getSavedAddressesByCustomerId,
} = require('../models/orderModel');
const { ok, fail } = require('../utils/apiResponse');

const createOrder = async (req, res, next) => {
  try {
    const { customerId, items, paymentMode, shippingAddress } = req.body;
    const effectiveCustomerId = req.user.role === 'Admin' ? customerId : req.user.userId;

    if (!effectiveCustomerId) {
      return fail(res, 'Customer ID is required', 400);
    }

    const result = await createOrderWithItems({
      customerId: effectiveCustomerId,
      items,
      paymentMode,
      shippingAddress,
    });
    return ok(res, result, 'Order placed successfully', 201);
  } catch (error) {
    return next(error);
  }
};

const getCustomerOrders = async (req, res, next) => {
  try {
    const requestedCustomerId = Number(req.params.customerId);

    if (req.user.role === 'Customer' && req.user.userId !== requestedCustomerId) {
      return fail(res, 'Forbidden: cannot access other customer orders', 403);
    }

    const orders = await getOrdersByCustomerId(requestedCustomerId);
    return ok(res, orders, 'Orders fetched');
  } catch (error) {
    return next(error);
  }
};

const getVendorOrders = async (req, res, next) => {
  try {
    const orders = await getOrdersByVendorId(req.user.userId);
    return ok(res, orders, 'Vendor orders fetched');
  } catch (error) {
    return next(error);
  }
};

const getSavedAddresses = async (req, res, next) => {
  try {
    const addresses = await getSavedAddressesByCustomerId(req.user.userId);
    return ok(res, addresses, 'Saved addresses fetched');
  } catch (error) {
    return next(error);
  }
};

module.exports = { createOrder, getCustomerOrders, getVendorOrders, getSavedAddresses };
