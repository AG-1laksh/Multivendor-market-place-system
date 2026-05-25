USE multivendor_ecommerce;
INSERT INTO USERS (User_ID, Email, Password, Role) VALUES
(1, 'admin@example.com', '$2b$10$4pDf56kq00sqvJ6fDn8BKudNAtf5pFjgAuC8W9jAq56k97X3CJidS', 'Admin'),
(2, 'vendor1@example.com', '$2b$10$4pDf56kq00sqvJ6fDn8BKudNAtf5pFjgAuC8W9jAq56k97X3CJidS', 'Vendor'),
(3, 'customer1@example.com', '$2b$10$4pDf56kq00sqvJ6fDn8BKudNAtf5pFjgAuC8W9jAq56k97X3CJidS', 'Customer'),
(11, 'demovendor@example.com', '$2b$10$4pDf56kq00sqvJ6fDn8BKudNAtf5pFjgAuC8W9jAq56k97X3CJidS', 'Vendor'),
(12, 'democustomer@example.com', '$2b$10$4pDf56kq00sqvJ6fDn8BKudNAtf5pFjgAuC8W9jAq56k97X3CJidS', 'Customer')
ON DUPLICATE KEY UPDATE Email = VALUES(Email);
INSERT INTO VENDORS (Vendor_ID, Name, Phone_No, Address) VALUES
(2, 'Vendor One', '9876543210', 'Delhi, India'),
(11, 'Demo Vendor Store', '9990001112', 'Mumbai, India')
ON DUPLICATE KEY UPDATE Name = VALUES(Name), Phone_No = VALUES(Phone_No), Address = VALUES(Address);
INSERT INTO CUSTOMERS (Customer_ID, Name, Phone_No) VALUES
(3, 'Customer One', '9998887776'),
(12, 'Demo Customer', '9990001113')
ON DUPLICATE KEY UPDATE Name = VALUES(Name), Phone_No = VALUES(Phone_No);
INSERT INTO CATEGORIES (Category_ID, Category_Name) VALUES
(1, 'Electronics'),
(2, 'Fashion'),
(3, 'Home & Kitchen'),
(11, 'Mobiles'),
(12, 'Audio'),
(13, 'Accessories')
ON DUPLICATE KEY UPDATE Category_Name = VALUES(Category_Name);
INSERT INTO PRODUCTS (Product_ID, Name, Description, Image_URL, Price, Category_ID, Vendor_ID) VALUES
(1, 'Wireless Mouse', 'Ergonomic 2.4GHz wireless mouse with silent click and long battery backup.', 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=1000&q=80', 799.00, 1, 2),
(2, 'Cotton T-Shirt', 'Soft breathable cotton t-shirt for daily wear. Regular fit.', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80', 499.00, 2, 2),
(3, 'Mixer Grinder', '750W high-performance mixer grinder with 3 stainless-steel jars.', 'https://img.freepik.com/free-vector/hand-blender-food-processor-clear-plastic-glass_107791-6763.jpg', 2499.00, 3, 2),
(101, 'NeoPhone X1', '6.7-inch AMOLED display, 128GB storage, and fast charging support.', 'https://img.freepik.com/free-psd/new-smartphone-17-pro-social-media-story-design-template_47987-33775.jpg?semt=ais_hybrid&w=740&q=80', 21999.00, 11, 11),
(102, 'AirPulse Buds', 'Wireless earbuds with ANC and 30-hour battery backup.', 'https://img.freepik.com/free-vector/headphones-wireless-realistic-composition-with-isolated-image-phones-with-power-bank-dock-station-with-reflections-vector-illustration_1284-73201.jpg', 3499.00, 12, 11),
(103, 'PowerVault 20000', '20,000mAh power bank with 22.5W fast output and dual USB ports.', 'https://img.freepik.com/premium-photo/black-portable-power-bank-with-multiple-usb-ports_1400163-461.jpg?w=360', 1799.00, 13, 11),
(104, 'ChargePro Type-C Cable', 'Nylon braided 1.5m Type-C cable with 100W PD charging support.', 'https://img.freepik.com/free-vector/composition-with-realistic-usb-3-0-charging-cable-mobile-devices_1284-54742.jpg', 399.00, 13, 11),
(105, 'SoundWave Mini Speaker', 'Portable Bluetooth speaker with deep bass and IPX5 splash resistance.', 'https://img.freepik.com/free-vector/isometric-isolated-sound-speakers-concept-three-large-speakers-floor-turned-different-directions-better-sound-vector-illustration_1284-81836.jpg?semt=ais_hybrid&w=740&q=80', 2499.00, 12, 11)
ON DUPLICATE KEY UPDATE
	Name = VALUES(Name),
	Description = VALUES(Description),
	Image_URL = VALUES(Image_URL),
	Price = VALUES(Price),
	Category_ID = VALUES(Category_ID),
	Vendor_ID = VALUES(Vendor_ID);
INSERT INTO PRODUCT_BY_STAGE (Product_ID, Size, Stock) VALUES
(1, 'DEFAULT', 100),
(2, 'DEFAULT', 80),
(3, 'DEFAULT', 40),
(101, 'DEFAULT', 25),
(102, 'DEFAULT', 45),
(103, 'DEFAULT', 60),
(104, 'DEFAULT', 200),
(105, 'DEFAULT', 30)
ON DUPLICATE KEY UPDATE Stock = VALUES(Stock);
INSERT INTO ORDERS (Order_ID, Vendor_ID, Customer_ID, Order_Date, Status, Total_Amount) VALUES
(1, 2, 3, NOW(), 'PLACED', 1298.00)
ON DUPLICATE KEY UPDATE Status = VALUES(Status), Total_Amount = VALUES(Total_Amount);
INSERT INTO ORDER_ITEMS (Order_Item_ID, Order_ID, Product_ID, Quantity, Price_At_Purchase, Status) VALUES
(1, 1, 1, 1, 799.00, 'PLACED'),
(2, 1, 2, 1, 499.00, 'PLACED')
ON DUPLICATE KEY UPDATE Quantity = VALUES(Quantity);
INSERT INTO PAYMENTS (Payment_ID, Payment_Mode, Payment_Date, Payment_Status, Order_ID) VALUES
(1, 'UPI', NOW(), 'SUCCESS', 1)
ON DUPLICATE KEY UPDATE Payment_Status = VALUES(Payment_Status);
INSERT INTO ADDRESS (Address_ID, Recipient_Name, Recipient_Phone, Street, City, Pincode, Country, Customer_ID) VALUES
(1, 'Customer One', '9998887776', '221B Baker Street', 'Delhi', '110001', 'India', 3)
ON DUPLICATE KEY UPDATE Recipient_Name = VALUES(Recipient_Name), Recipient_Phone = VALUES(Recipient_Phone);
INSERT INTO SHIPMENTS (Shipment_ID, Order_ID, Address_ID, Tracking_Number, Status, Shipped_At) VALUES
(1, 1, 1, 'TRK-DEMO-0001', 'IN_TRANSIT', NOW())
ON DUPLICATE KEY UPDATE Status = VALUES(Status), Tracking_Number = VALUES(Tracking_Number);
INSERT INTO REVIEW (Review_ID, Customer_ID, Product_ID, Rating, Text) VALUES
(1, 3, 1, 5, 'Great product, fast delivery!')
ON DUPLICATE KEY UPDATE Rating = VALUES(Rating), Text = VALUES(Text);
INSERT INTO CART (Cart_ID, Customer_ID) VALUES
(1, 3),
(2, 12)
ON DUPLICATE KEY UPDATE Customer_ID = VALUES(Customer_ID);
INSERT INTO CART_ITEMS (Cart_Item_ID, Cart_ID, Product_ID, Product_Name, Quantity) VALUES
(1, 1, 3, 'Mixer Grinder', 1),
(2, 2, 104, 'ChargePro Type-C Cable', 1)
ON DUPLICATE KEY UPDATE Quantity = VALUES(Quantity), Product_Name = VALUES(Product_Name);
