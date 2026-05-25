require('dotenv').config();
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production' && (!jwtSecret || jwtSecret === 'replace_with_strong_secret')) {
  console.error('JWT_SECRET is missing or using the default placeholder. Please set a strong secret in .env');
  process.exit(1);
}

const startServer = async () => {
  try {
    const connection = await db.getConnection();
    console.log('MySQL Connected...');
    connection.release();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    process.exit(1);
  }
};

startServer();
