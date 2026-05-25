const {
  getAllProducts,
  getProductsByVendor,
  getProductById,
  getProductByIdAndVendor,
  getVendorStorefrontById,
  getPublicVendorProductsById,
  getAllCategories,
  createProduct,
  upsertDefaultProductStock,
  updateProduct,
  deleteProduct,
} = require('../models/productModel');
const { ok, fail } = require('../utils/apiResponse');

const listProducts = async (req, res, next) => {
  try {
    const products = await getAllProducts({ categoryId: req.query.categoryId });
    return ok(res, products, 'Products fetched');
  } catch (error) {
    return next(error);
  }
};

const listMyVendorProducts = async (req, res, next) => {
  try {
    const products = await getProductsByVendor(req.user.userId);
    return ok(res, products, 'Vendor products fetched');
  } catch (error) {
    return next(error);
  }
};

const getSingleProduct = async (req, res, next) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return fail(res, 'Product not found', 404);
    return ok(res, product, 'Product fetched');
  } catch (error) {
    return next(error);
  }
};

const listCategories = async (req, res, next) => {
  try {
    const categories = await getAllCategories();
    return ok(res, categories, 'Categories fetched');
  } catch (error) {
    return next(error);
  }
};

const getVendorStorefront = async (req, res, next) => {
  try {
    const vendorId = Number(req.params.vendorId);
    const profile = await getVendorStorefrontById(vendorId);
    if (!profile) return fail(res, 'Vendor not found', 404);

    const products = await getPublicVendorProductsById(vendorId);
    return ok(
      res,
      {
        profile,
        products,
      },
      'Vendor storefront fetched'
    );
  } catch (error) {
    return next(error);
  }
};

const addProduct = async (req, res, next) => {
  try {
    const { name, description, imageUrl, price, stock, categoryId } = req.body;
    const vendorId = req.user.userId;
    const productId = await createProduct({
      name,
      description,
      imageUrl,
      price,
      stock,
      categoryId,
      vendorId,
    });
    return ok(res, { productId }, 'Product created', 201);
  } catch (error) {
    return next(error);
  }
};

const editProduct = async (req, res, next) => {
  try {
    if (req.user.role === 'Vendor') {
      const ownedProduct = await getProductByIdAndVendor(req.params.id, req.user.userId);
      if (!ownedProduct) {
        return fail(res, 'Forbidden: cannot edit products from other vendors', 403);
      }
    }

    const payload = {};
    if (req.body.name !== undefined) payload.Name = req.body.name;
    if (req.body.description !== undefined) payload.Description = req.body.description;
    if (req.body.imageUrl !== undefined) payload.Image_URL = req.body.imageUrl;
    if (req.body.price !== undefined) payload.Price = req.body.price;
    if (req.body.categoryId !== undefined) payload.Category_ID = req.body.categoryId;

    const updated = await updateProduct(req.params.id, payload);
    if (req.body.stock !== undefined) {
      await upsertDefaultProductStock(req.params.id, req.body.stock);
    }

    if (!updated && req.body.stock === undefined) return fail(res, 'Product not found or unchanged', 404);

    return ok(res, null, 'Product updated');
  } catch (error) {
    return next(error);
  }
};

const removeProduct = async (req, res, next) => {
  try {
    if (req.user.role === 'Vendor') {
      const ownedProduct = await getProductByIdAndVendor(req.params.id, req.user.userId);
      if (!ownedProduct) {
        return fail(res, 'Forbidden: cannot delete products from other vendors', 403);
      }
    }

    const deleted = await deleteProduct(req.params.id);
    if (!deleted) return fail(res, 'Product not found', 404);

    return ok(res, null, 'Product deleted');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listProducts,
  listMyVendorProducts,
  getVendorStorefront,
  getSingleProduct,
  listCategories,
  addProduct,
  editProduct,
  removeProduct,
};
