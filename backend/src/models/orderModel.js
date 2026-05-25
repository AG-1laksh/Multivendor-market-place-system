const pool = require('../config/db');

const schemaCache = new Map();

const hasColumn = async (db, tableName, columnName) => {
  const key = `col:${tableName}:${columnName}`;
  if (schemaCache.has(key)) return schemaCache.get(key);

  const [rows] = await db.query(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND LOWER(TABLE_NAME) = LOWER(?)
       AND LOWER(COLUMN_NAME) = LOWER(?)
     LIMIT 1`,
    [tableName, columnName]
  );

  const exists = rows.length > 0;
  schemaCache.set(key, exists);
  return exists;
};

const hasTable = async (db, tableName) => {
  const key = `tbl:${tableName}`;
  if (schemaCache.has(key)) return schemaCache.get(key);

  const [rows] = await db.query(
    `SELECT 1
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND LOWER(TABLE_NAME) = LOWER(?)
     LIMIT 1`,
    [tableName]
  );

  const exists = rows.length > 0;
  schemaCache.set(key, exists);
  return exists;
};

const decrementStock = async (connection, productId, quantity) => {
  let remaining = Number(quantity);

  const [stockRows] = await connection.query(
    `SELECT Size, Stock
     FROM PRODUCT_BY_STAGE
     WHERE Product_ID = ?
     ORDER BY Stock DESC, Size ASC
     FOR UPDATE`,
    [productId]
  );

  if (!stockRows.length) {
    const [productRows] = await connection.query(
      `SELECT Stock
       FROM PRODUCTS
       WHERE Product_ID = ?
       FOR UPDATE`,
      [productId]
    );

    const legacyStock = Number(productRows[0]?.Stock || 0);
    if (legacyStock < remaining) {
      throw new Error(`Insufficient stock for product ${productId}`);
    }

    await connection.query(
      `UPDATE PRODUCTS
       SET Stock = Stock - ?
       WHERE Product_ID = ?`,
      [remaining, productId]
    );

    return;
  }

  const totalStock = stockRows.reduce((sum, row) => sum + Number(row.Stock || 0), 0);
  if (totalStock < remaining) {
    throw new Error(`Insufficient stock for product ${productId}`);
  }

  for (const row of stockRows) {
    if (remaining <= 0) break;

    const available = Number(row.Stock || 0);
    if (available <= 0) continue;

    const deduct = Math.min(available, remaining);
    await connection.query(
      `UPDATE PRODUCT_BY_STAGE
       SET Stock = Stock - ?
       WHERE Product_ID = ? AND Size = ?`,
      [deduct, productId, row.Size]
    );
    remaining -= deduct;
  }

  await connection.query(
    `UPDATE PRODUCTS p
     LEFT JOIN (
       SELECT Product_ID, COALESCE(SUM(Stock), 0) AS Stock
       FROM PRODUCT_BY_STAGE
       WHERE Product_ID = ?
       GROUP BY Product_ID
     ) ps ON ps.Product_ID = p.Product_ID
     SET p.Stock = COALESCE(ps.Stock, 0)
     WHERE p.Product_ID = ?`,
    [productId, productId]
  );
};

const createOrderWithItems = async ({ customerId, items, paymentMode, shippingAddress }) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const addressHasRecipientFields = await hasColumn(connection, 'ADDRESS', 'Recipient_Name');
    const hasShipmentsTable = await hasTable(connection, 'SHIPMENTS');
    const hasShipmentTable = await hasTable(connection, 'SHIPMENT');
    const shipmentHasOrderState = hasShipmentTable
      ? await hasColumn(connection, 'SHIPMENT', 'Order_State')
      : false;
    const shipmentHasOrderDate = hasShipmentTable
      ? await hasColumn(connection, 'SHIPMENT', 'Order_Date')
      : false;

    const vendors = new Set();
    const pricedItems = [];

    for (const item of items) {
      const [productRows] = await connection.query(
        'SELECT Product_ID, Vendor_ID, Price FROM PRODUCTS WHERE Product_ID = ? FOR UPDATE',
        [item.productId]
      );

      if (!productRows.length) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const product = productRows[0];
      vendors.add(product.Vendor_ID);
      pricedItems.push({
        productId: item.productId,
        quantity: Number(item.quantity),
        price: Number(product.Price),
      });

      await decrementStock(connection, item.productId, item.quantity);
    }

    if (vendors.size !== 1) {
      throw new Error('All order items must belong to the same vendor');
    }

    const vendorId = [...vendors][0];
    const orderTotalAmount = pricedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const [orderResult] = await connection.query(
      `INSERT INTO ORDERS (Vendor_ID, Customer_ID, Order_Date, Status, Total_Amount)
       VALUES (?, ?, NOW(), 'PLACED', ?)`,
      [vendorId, customerId, orderTotalAmount]
    );

    const orderId = orderResult.insertId;

    for (const item of pricedItems) {
      await connection.query(
        `INSERT INTO ORDER_ITEMS (Order_ID, Product_ID, Quantity, Price_At_Purchase, Status)
         VALUES (?, ?, ?, ?, 'PLACED')`,
        [orderId, item.productId, item.quantity, item.price]
      );
    }

    await connection.query(
      `INSERT INTO PAYMENTS (Payment_Mode, Payment_Date, Payment_Status, Order_ID)
       VALUES (?, NOW(), 'PENDING', ?)`,
      [paymentMode, orderId]
    );

    if (shippingAddress) {
      if (addressHasRecipientFields) {
        await connection.query(
          `INSERT INTO ADDRESS (Recipient_Name, Recipient_Phone, Street, City, Pincode, Country, Customer_ID)
           SELECT ?, ?, ?, ?, ?, ?, ?
           WHERE NOT EXISTS (
             SELECT 1
             FROM ADDRESS
             WHERE Customer_ID = ?
               AND Recipient_Name = ?
               AND Recipient_Phone = ?
               AND Street = ?
               AND City = ?
               AND Pincode = ?
               AND Country = ?
           )`,
          [
            shippingAddress.fullName,
            shippingAddress.phone,
            shippingAddress.street,
            shippingAddress.city,
            shippingAddress.pincode,
            shippingAddress.country,
            customerId,
            customerId,
            shippingAddress.fullName,
            shippingAddress.phone,
            shippingAddress.street,
            shippingAddress.city,
            shippingAddress.pincode,
            shippingAddress.country,
          ]
        );
      } else {
        await connection.query(
          `INSERT INTO ADDRESS (Street, Pincode, City, Country, Customer_ID)
           SELECT ?, ?, ?, ?, ?
           WHERE NOT EXISTS (
             SELECT 1
             FROM ADDRESS
             WHERE Customer_ID = ?
               AND Street = ?
               AND Pincode = ?
               AND City = ?
               AND Country = ?
           )`,
          [
            shippingAddress.street,
            shippingAddress.pincode,
            shippingAddress.city,
            shippingAddress.country,
            customerId,
            customerId,
            shippingAddress.street,
            shippingAddress.pincode,
            shippingAddress.city,
            shippingAddress.country,
          ]
        );
      }

      const [addressRows] = addressHasRecipientFields
        ? await connection.query(
            `SELECT Address_ID
             FROM ADDRESS
             WHERE Customer_ID = ?
               AND Recipient_Name = ?
               AND Recipient_Phone = ?
               AND Street = ?
               AND City = ?
               AND Pincode = ?
               AND Country = ?
             LIMIT 1`,
            [
              customerId,
              shippingAddress.fullName,
              shippingAddress.phone,
              shippingAddress.street,
              shippingAddress.city,
              shippingAddress.pincode,
              shippingAddress.country,
            ]
          )
        : await connection.query(
            `SELECT Address_ID
             FROM ADDRESS
             WHERE Customer_ID = ?
               AND Street = ?
               AND Pincode = ?
               AND City = ?
               AND Country = ?
             LIMIT 1`,
            [
              customerId,
              shippingAddress.street,
              shippingAddress.pincode,
              shippingAddress.city,
              shippingAddress.country,
            ]
          );

      const addressId = addressRows[0]?.Address_ID;
      if (addressId && hasShipmentsTable) {
        await connection.query(
          `INSERT INTO SHIPMENTS (Order_ID, Address_ID, Status)
           VALUES (?, ?, 'PENDING')
           ON DUPLICATE KEY UPDATE Address_ID = VALUES(Address_ID), Status = VALUES(Status)`,
          [orderId, addressId]
        );
      } else if (hasShipmentTable) {
        try {
          if (shipmentHasOrderState) {
            await connection.query(
              `INSERT INTO SHIPMENT (Customer_ID, Order_State, Status)
               VALUES (?, NOW(), 'PENDING')`,
              [customerId]
            );
          } else if (shipmentHasOrderDate) {
            await connection.query(
              `INSERT INTO SHIPMENT (Customer_ID, Order_Date, Status)
               VALUES (?, NOW(), 'PENDING')`,
              [customerId]
            );
          }
        } catch (shipmentError) {
          const nonBlockingCodes = new Set(['ER_BAD_FIELD_ERROR', 'ER_BAD_NULL_ERROR', 'ER_NO_DEFAULT_FOR_FIELD']);
          if (!nonBlockingCodes.has(shipmentError?.code)) {
            throw shipmentError;
          }
        }
      }
    }

    await connection.commit();
    return { orderId, totalAmount: Number(orderTotalAmount) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getOrdersByCustomerId = async (customerId) => {
  const [rows] = await pool.query(
    `SELECT o.Order_ID, o.Order_Date, o.Status,
            o.Total_Amount,
            oi.Order_Item_ID, oi.Product_ID, oi.Quantity, oi.Price_At_Purchase, oi.Status AS Item_Status,
            p.Name AS Product_Name,
            r.Review_ID AS Existing_Review_ID,
            r.Rating AS Existing_Rating
     FROM ORDERS o
     LEFT JOIN ORDER_ITEMS oi ON oi.Order_ID = o.Order_ID
     LEFT JOIN PRODUCTS p ON p.Product_ID = oi.Product_ID
     LEFT JOIN REVIEW r ON r.Product_ID = oi.Product_ID AND r.Customer_ID = o.Customer_ID
     WHERE o.Customer_ID = ?
     ORDER BY o.Order_ID DESC`,
    [customerId]
  );

  return rows;
};

const getOrdersByVendorId = async (vendorId) => {
  const [rows] = await pool.query(
    `SELECT o.Order_ID, o.Order_Date, o.Status,
            o.Total_Amount,
            o.Customer_ID,
            oi.Order_Item_ID, oi.Product_ID, oi.Quantity, oi.Price_At_Purchase, oi.Status AS Item_Status,
            p.Name AS Product_Name
     FROM ORDERS o
     JOIN ORDER_ITEMS oi ON oi.Order_ID = o.Order_ID
     JOIN PRODUCTS p ON p.Product_ID = oi.Product_ID
     WHERE o.Vendor_ID = ?
     ORDER BY o.Order_ID DESC`,
    [vendorId]
  );

  return rows;
};

const getSavedAddressesByCustomerId = async (customerId) => {
  const addressHasRecipientFields = await hasColumn(pool, 'ADDRESS', 'Recipient_Name');

  const [rows] = addressHasRecipientFields
    ? await pool.query(
        `SELECT Address_ID, Recipient_Name, Recipient_Phone, Street, City, Pincode, Country
         FROM ADDRESS
         WHERE Customer_ID = ?
         ORDER BY Address_ID DESC`,
        [customerId]
      )
    : await pool.query(
        `SELECT Address_ID,
                NULL AS Recipient_Name,
                NULL AS Recipient_Phone,
                Street,
                City,
                CAST(Pincode AS CHAR) AS Pincode,
                Country
         FROM ADDRESS
         WHERE Customer_ID = ?
         ORDER BY Address_ID DESC`,
        [customerId]
      );

  return rows;
};

module.exports = { createOrderWithItems, getOrdersByCustomerId, getOrdersByVendorId, getSavedAddressesByCustomerId };
