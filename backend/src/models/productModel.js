const pool = require('../config/db');

const STOCK_JOIN = `
  LEFT JOIN (
    SELECT Product_ID, COALESCE(SUM(Stock), 0) AS Stock
    FROM PRODUCT_BY_STAGE
    GROUP BY Product_ID
  ) ps ON ps.Product_ID = p.Product_ID
`;

const getAllProducts = async ({ categoryId }) => {
  let sql = `
        SELECT p.*, c.Category_Name, v.Name AS Vendor_Name,
          COALESCE(ps.Stock, p.Stock, 0) AS Stock,
           COALESCE(rr.Avg_Rating, 0) AS Avg_Rating,
           COALESCE(rr.Review_Count, 0) AS Review_Count
    FROM PRODUCTS p
    JOIN CATEGORIES c ON c.Category_ID = p.Category_ID
    JOIN VENDORS v ON v.Vendor_ID = p.Vendor_ID
        ${STOCK_JOIN}
    LEFT JOIN (
      SELECT Product_ID, AVG(Rating) AS Avg_Rating, COUNT(*) AS Review_Count
      FROM REVIEW
      GROUP BY Product_ID
    ) rr ON rr.Product_ID = p.Product_ID
  `;
  const values = [];

  if (categoryId) {
    sql += ' WHERE p.Category_ID = ?';
    values.push(categoryId);
  }

  sql += ' ORDER BY p.Product_ID DESC';

  const [rows] = await pool.query(sql, values);
  return rows;
};

const getProductsByVendor = async (vendorId) => {
  const [rows] = await pool.query(
        `SELECT p.*, c.Category_Name, v.Name AS Vendor_Name,
          COALESCE(ps.Stock, p.Stock, 0) AS Stock,
            COALESCE(rr.Avg_Rating, 0) AS Avg_Rating,
            COALESCE(rr.Review_Count, 0) AS Review_Count
     FROM PRODUCTS p
     JOIN CATEGORIES c ON c.Category_ID = p.Category_ID
     JOIN VENDORS v ON v.Vendor_ID = p.Vendor_ID
         ${STOCK_JOIN}
     LEFT JOIN (
       SELECT Product_ID, AVG(Rating) AS Avg_Rating, COUNT(*) AS Review_Count
       FROM REVIEW
       GROUP BY Product_ID
     ) rr ON rr.Product_ID = p.Product_ID
     WHERE p.Vendor_ID = ?
     ORDER BY p.Product_ID DESC`,
    [vendorId]
  );

  return rows;
};

const getVendorStorefrontById = async (vendorId) => {
  const [rows] = await pool.query(
    `SELECT v.Vendor_ID, v.Name AS Vendor_Name, v.Phone_No, v.Address, u.Created_At,
            COUNT(DISTINCT p.Product_ID) AS Product_Count,
            COALESCE(AVG(r.Rating), 0) AS Avg_Rating,
            COUNT(DISTINCT r.Review_ID) AS Review_Count
     FROM VENDORS v
     JOIN USERS u ON u.User_ID = v.Vendor_ID
     LEFT JOIN PRODUCTS p ON p.Vendor_ID = v.Vendor_ID
     LEFT JOIN REVIEW r ON r.Product_ID = p.Product_ID
     WHERE v.Vendor_ID = ?
     GROUP BY v.Vendor_ID, v.Name, v.Phone_No, v.Address, u.Created_At`,
    [vendorId]
  );

  return rows[0] || null;
};

const getPublicVendorProductsById = async (vendorId) => {
  const [rows] = await pool.query(
        `SELECT p.*, c.Category_Name, v.Name AS Vendor_Name,
          COALESCE(ps.Stock, p.Stock, 0) AS Stock,
            COALESCE(rr.Avg_Rating, 0) AS Avg_Rating,
            COALESCE(rr.Review_Count, 0) AS Review_Count
     FROM PRODUCTS p
     JOIN CATEGORIES c ON c.Category_ID = p.Category_ID
     JOIN VENDORS v ON v.Vendor_ID = p.Vendor_ID
         ${STOCK_JOIN}
     LEFT JOIN (
       SELECT Product_ID, AVG(Rating) AS Avg_Rating, COUNT(*) AS Review_Count
       FROM REVIEW
       GROUP BY Product_ID
     ) rr ON rr.Product_ID = p.Product_ID
     WHERE p.Vendor_ID = ?
     ORDER BY p.Product_ID DESC`,
    [vendorId]
  );

  return rows;
};

const getProductById = async (id) => {
  const [rows] = await pool.query(
        `SELECT p.*, c.Category_Name, v.Name AS Vendor_Name,
          COALESCE(ps.Stock, p.Stock, 0) AS Stock,
            COALESCE(rr.Avg_Rating, 0) AS Avg_Rating,
            COALESCE(rr.Review_Count, 0) AS Review_Count
     FROM PRODUCTS p
     JOIN CATEGORIES c ON c.Category_ID = p.Category_ID
     JOIN VENDORS v ON v.Vendor_ID = p.Vendor_ID
         ${STOCK_JOIN}
     LEFT JOIN (
       SELECT Product_ID, AVG(Rating) AS Avg_Rating, COUNT(*) AS Review_Count
       FROM REVIEW
       GROUP BY Product_ID
     ) rr ON rr.Product_ID = p.Product_ID
     WHERE p.Product_ID = ?
    `,
    [id]
  );
  return rows[0] || null;
};

const getAllCategories = async () => {
  const [rows] = await pool.query('SELECT * FROM CATEGORIES ORDER BY Category_Name ASC');
  return rows;
};

const getProductByIdAndVendor = async (id, vendorId) => {
  const [rows] = await pool.query(
    'SELECT Product_ID, Vendor_ID FROM PRODUCTS WHERE Product_ID = ? AND Vendor_ID = ?',
    [id, vendorId]
  );
  return rows[0] || null;
};

const getProductVendorsByIds = async (productIds) => {
  if (!productIds.length) return [];
  const placeholders = productIds.map(() => '?').join(', ');
  const [rows] = await pool.query(
    `SELECT p.Product_ID, p.Vendor_ID, p.Price, COALESCE(ps.Stock, p.Stock, 0) AS Stock
     FROM PRODUCTS p
     LEFT JOIN (
       SELECT Product_ID, COALESCE(SUM(Stock), 0) AS Stock
       FROM PRODUCT_BY_STAGE
       GROUP BY Product_ID
     ) ps ON ps.Product_ID = p.Product_ID
     WHERE p.Product_ID IN (${placeholders})`,
    productIds
  );
  return rows;
};

const createProduct = async ({ name, description, imageUrl, price, stock, categoryId, vendorId }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO PRODUCTS (Name, Description, Image_URL, Price, Category_ID, Vendor_ID) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || null, imageUrl || null, price, categoryId, vendorId]
    );

    const productId = result.insertId;
    const initialStock = Number.isFinite(Number(stock)) ? Math.max(0, Number(stock)) : 0;

    await connection.query(
      'INSERT INTO PRODUCT_BY_STAGE (Product_ID, Size, Stock) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE Stock = VALUES(Stock)',
      [productId, 0, initialStock]
    );

    await connection.commit();
    return productId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const upsertDefaultProductStock = async (id, stock) => {
  const normalizedStock = Math.max(0, Number(stock));
  await pool.query(
    'INSERT INTO PRODUCT_BY_STAGE (Product_ID, Size, Stock) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE Stock = VALUES(Stock)',
    [id, 0, normalizedStock]
  );
};

const updateProduct = async (id, payload) => {
  const fields = [];
  const values = [];

  Object.entries(payload).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    values.push(value);
  });

  if (!fields.length) return false;

  values.push(id);
  const [result] = await pool.query(
    `UPDATE PRODUCTS SET ${fields.join(', ')} WHERE Product_ID = ?`,
    values
  );

  return result.affectedRows > 0;
};

const deleteProduct = async (id) => {
  const [result] = await pool.query('DELETE FROM PRODUCTS WHERE Product_ID = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = {
  getAllProducts,
  getProductsByVendor,
  getProductById,
  getProductByIdAndVendor,
  getProductVendorsByIds,
  getVendorStorefrontById,
  getPublicVendorProductsById,
  getAllCategories,
  createProduct,
  upsertDefaultProductStock,
  updateProduct,
  deleteProduct,
};
