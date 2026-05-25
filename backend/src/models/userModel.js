const pool = require('../config/db');

const createUser = async ({ email, password, role }) => {
  const [result] = await pool.query(
    'INSERT INTO USERS (Email, Password, Role) VALUES (?, ?, ?)',
    [email, password, role]
  );
  return result.insertId;
};

const findUserByEmail = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const [rows] = await pool.query('SELECT * FROM USERS WHERE LOWER(Email) = ?', [normalizedEmail]);
  return rows[0] || null;
};

const listUsers = async () => {
  const [rows] = await pool.query('SELECT User_ID, Email, Role FROM USERS ORDER BY User_ID DESC');
  return rows;
};

module.exports = { createUser, findUserByEmail, listUsers };
