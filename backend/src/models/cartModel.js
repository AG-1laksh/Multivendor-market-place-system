const pool = require('../config/db');

const getOrCreateCart = async (customerId) => {
  const [rows] = await pool.query('SELECT Cart_ID FROM CART WHERE Customer_ID = ?', [customerId]);
  if (rows.length) return rows[0].Cart_ID;

  const [result] = await pool.query('INSERT INTO CART (Customer_ID) VALUES (?)', [customerId]);
  return result.insertId;
};

const findCartItemForCustomer = async (cartItemId, customerId) => {
  const [rows] = await pool.query(
    `SELECT ci.Cart_Item_ID, ci.Cart_ID
     FROM CART_ITEMS ci
     JOIN CART c ON c.Cart_ID = ci.Cart_ID
     WHERE ci.Cart_Item_ID = ? AND c.Customer_ID = ?`,
    [cartItemId, customerId]
  );
  return rows[0] || null;
};

const addOrIncrementCartItem = async ({ customerId, productId, quantity }) => {
  const cartId = await getOrCreateCart(customerId);

  const [existing] = await pool.query(
    'SELECT Cart_Item_ID, Quantity FROM CART_ITEMS WHERE Cart_ID = ? AND Product_ID = ?',
    [cartId, productId]
  );

  if (existing.length) {
    await pool.query('UPDATE CART_ITEMS SET Quantity = Quantity + ? WHERE Cart_Item_ID = ?', [quantity, existing[0].Cart_Item_ID]);
    return existing[0].Cart_Item_ID;
  }

  const [productRows] = await pool.query('SELECT Name FROM PRODUCTS WHERE Product_ID = ? LIMIT 1', [productId]);
  if (!productRows.length) {
    throw new Error(`Product ${productId} not found`);
  }

  const [result] = await pool.query(
    'INSERT INTO CART_ITEMS (Cart_ID, Product_ID, Quantity, Product_Name) VALUES (?, ?, ?, ?)',
    [cartId, productId, quantity, productRows[0].Name]
  );

  return result.insertId;
};

const updateCartItem = async (cartItemId, quantity, customerId) => {
  const item = await findCartItemForCustomer(cartItemId, customerId);
  if (!item) return false;

  const [result] = await pool.query('UPDATE CART_ITEMS SET Quantity = ? WHERE Cart_Item_ID = ?', [quantity, cartItemId]);
  return result.affectedRows > 0;
};

const removeCartItem = async (cartItemId, customerId) => {
  const item = await findCartItemForCustomer(cartItemId, customerId);
  if (!item) return false;

  const cartId = item.Cart_ID;

  const [result] = await pool.query('DELETE FROM CART_ITEMS WHERE Cart_Item_ID = ?', [cartItemId]);
  if (!result.affectedRows) return false;

  await pool.query(
    `DELETE FROM CART
     WHERE Cart_ID = ?
       AND NOT EXISTS (SELECT 1 FROM CART_ITEMS WHERE Cart_ID = ?)`,
    [cartId, cartId]
  );

  return true;
};

const getCartByCustomerId = async (customerId) => {
  const [rows] = await pool.query(
    `SELECT c.Cart_ID, ci.Cart_Item_ID, ci.Quantity, p.Product_ID,
            p.Name AS Name, p.Price,
          COALESCE(ps.Stock, p.Stock, 0) AS Stock,
            p.Vendor_ID, p.Image_URL
     FROM CART c
     LEFT JOIN CART_ITEMS ci ON ci.Cart_ID = c.Cart_ID
     LEFT JOIN PRODUCTS p ON p.Product_ID = ci.Product_ID
     LEFT JOIN (
       SELECT Product_ID, COALESCE(SUM(Stock), 0) AS Stock
       FROM PRODUCT_BY_STAGE
       GROUP BY Product_ID
     ) ps ON ps.Product_ID = p.Product_ID
     WHERE c.Customer_ID = ?`,
    [customerId]
  );

  return rows;
};

module.exports = {
  addOrIncrementCartItem,
  updateCartItem,
  removeCartItem,
  getCartByCustomerId,
  findCartItemForCustomer,
};
