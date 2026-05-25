const pool = require('../config/db');

const createReview = async ({ customerId, productId, rating, text }) => {
  const [result] = await pool.query(
    'INSERT INTO REVIEW (Customer_ID, Product_ID, Rating, Text) VALUES (?, ?, ?, ?)',
    [customerId, productId, rating, text || null]
  );
  return result.insertId;
};

const getReviewsByProductId = async (productId) => {
  const [rows] = await pool.query(
    `SELECT r.*, c.Name AS Customer_Name
     FROM REVIEW r
     JOIN CUSTOMERS c ON c.Customer_ID = r.Customer_ID
     WHERE r.Product_ID = ?
     ORDER BY r.Review_ID DESC`,
    [productId]
  );
  return rows;
};

module.exports = { createReview, getReviewsByProductId };
