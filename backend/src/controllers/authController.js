const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { createUser, findUserByEmail } = require('../models/userModel');
const { ok, fail } = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const { password, role, name, phoneNo } = req.body;
    const email = String(req.body.email || '').trim().toLowerCase();

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return fail(res, 'Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await createUser({ email, password: hashedPassword, role });

    if (role === 'Customer') {
      await pool.query('INSERT INTO CUSTOMERS (Customer_ID, Name, Phone_No) VALUES (?, ?, ?)', [
        userId,
        name || email.split('@')[0],
        phoneNo || null,
      ]);
    }

    if (role === 'Vendor') {
      await pool.query('INSERT INTO VENDORS (Vendor_ID, Name, Phone_No, Address) VALUES (?, ?, ?, ?)', [
        userId,
        name || email.split('@')[0],
        phoneNo || null,
        null,
      ]);
    }

    return ok(res, { userId }, 'User registered successfully', 201);
  } catch (error) {
    return next(error);
  }
};

const buildProfile = async (user) => {
  let profileName = null;
  let profilePhoneNo = null;

  if (user.Role === 'Customer') {
    const [customerRows] = await pool.query(
      'SELECT Name, Phone_No FROM CUSTOMERS WHERE Customer_ID = ? LIMIT 1',
      [user.User_ID]
    );
    profileName = customerRows[0]?.Name || null;
    profilePhoneNo = customerRows[0]?.Phone_No || null;
  } else if (user.Role === 'Vendor') {
    const [vendorRows] = await pool.query(
      'SELECT Name, Phone_No FROM VENDORS WHERE Vendor_ID = ? LIMIT 1',
      [user.User_ID]
    );
    profileName = vendorRows[0]?.Name || null;
    profilePhoneNo = vendorRows[0]?.Phone_No || null;
  }

  if (!profileName) {
    profileName = String(user.Email || '').split('@')[0] || 'User';
  }

  return {
    userId: user.User_ID,
    email: user.Email,
    role: user.Role,
    name: profileName,
    phoneNo: profilePhoneNo,
  };
};

const login = async (req, res, next) => {
  try {
    const { password } = req.body;
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await findUserByEmail(email);

    if (!user) {
      return fail(res, 'Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return fail(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign(
      { userId: user.User_ID, role: user.Role, email: user.Email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const profile = await buildProfile(user);

    return ok(
      res,
      {
        token,
        user: profile,
      },
      'Login successful'
    );
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT User_ID, Email, Role FROM USERS WHERE User_ID = ? LIMIT 1', [
      req.user.userId,
    ]);

    const user = rows[0];
    if (!user) return fail(res, 'User not found', 404);

    const profile = await buildProfile({
      User_ID: user.User_ID,
      Email: user.Email,
      Role: user.Role,
    });

    return ok(res, { user: profile }, 'Profile fetched');
  } catch (error) {
    return next(error);
  }
};

module.exports = { register, login, me };
