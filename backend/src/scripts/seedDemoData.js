require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const run = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 3306),
    multipleStatements: true,
  });

  try {
    const rawSchemaSql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
    const seedSql = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf8');

    const schemaSql = rawSchemaSql.replace(
      /DELIMITER\s*\$\$[\s\S]*?DELIMITER\s*;\s*/g,
      ''
    );

    await connection.query(schemaSql);

    await connection.query(seedSql);

    const passwordHash = await bcrypt.hash('password123', 10);
    await connection.query(
      `UPDATE USERS
       SET Password = ?
       WHERE Email IN (
         'admin@example.com',
         'vendor1@example.com',
         'customer1@example.com',
         'demovendor@example.com',
         'democustomer@example.com'
       )`,
      [passwordHash]
    );

    console.log('✅ Demo data seeded successfully.');
    console.log('Vendor login: demovendor@example.com / password123');
    console.log('Customer login: democustomer@example.com / password123');
  } finally {
    await connection.end();
  }
};

run().catch((error) => {
  console.error('❌ Failed to seed demo data:', error.message);
  process.exit(1);
});
