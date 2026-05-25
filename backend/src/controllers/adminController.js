const { listUsers } = require('../models/userModel');
const {
  getAllCategories,
  createCategory,
  deleteCategory,
  getAllOrders,
} = require('../models/adminModel');
const { ok, fail } = require('../utils/apiResponse');

const getUsers = async (req, res, next) => {
  try {
    const users = await listUsers();
    return ok(res, users, 'Users fetched');
  } catch (error) {
    return next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await getAllCategories();
    return ok(res, categories, 'Categories fetched');
  } catch (error) {
    return next(error);
  }
};

const addCategory = async (req, res, next) => {
  try {
    const categoryId = await createCategory(req.body.categoryName);
    return ok(res, { categoryId }, 'Category created', 201);
  } catch (error) {
    return next(error);
  }
};

const removeCategory = async (req, res, next) => {
  try {
    const removed = await deleteCategory(req.params.id);
    if (!removed) return fail(res, 'Category not found', 404);

    return ok(res, null, 'Category deleted');
  } catch (error) {
    return next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await getAllOrders();
    return ok(res, orders, 'All orders fetched');
  } catch (error) {
    return next(error);
  }
};

module.exports = { getUsers, getCategories, addCategory, removeCategory, getOrders };
