const pool = require('../config/db');

const getAllCategories = async () => {
  const [rows] = await pool.query('SELECT * FROM CATEGORIES ORDER BY Category_ID DESC');
  return rows;
};

const createCategory = async (categoryName) => {
  const [result] = await pool.query('INSERT INTO CATEGORIES (Category_Name) VALUES (?)', [categoryName]);
  return result.insertId;
};

const deleteCategory = async (categoryId) => {
  const [result] = await pool.query('DELETE FROM CATEGORIES WHERE Category_ID = ?', [categoryId]);
  return result.affectedRows > 0;
};

const getAllOrders = async () => {
  const [rows] = await pool.query('SELECT * FROM ORDERS ORDER BY Order_ID DESC');
  return rows;
};

module.exports = { getAllCategories, createCategory, deleteCategory, getAllOrders };
