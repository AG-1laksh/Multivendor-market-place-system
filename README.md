# Multi-Vendor E-Commerce (Full Stack)

A full-stack multi-vendor e-commerce web app built with:
- **Frontend**: React + Tailwind CSS + React Router + Axios
- **Backend**: Node.js + Express.js (MVC)
- **Database**: MySQL

## Project Structure

- `backend/`
  - `src/controllers`
  - `src/routes`
  - `src/models`
  - `src/middleware`
  - `src/config`
  - `src/validators`
  - `database/schema.sql`
  - `database/seed.sql`
- `frontend/`
  - `src/components`
  - `src/pages`
  - `src/services`
  - `src/context`

## 1) Database Setup (MySQL)

1. Create schema and tables:
   - Run `backend/database/schema.sql`
2. Insert sample data:
   - Run `backend/database/seed.sql`

> The schema includes all requested tables + cart tables (`CART`, `CART_ITEMS`) needed for cart APIs.

## 2) Backend Setup

1. Go to `backend/`
2. Install dependencies (already installed in this workspace):
   - `npm install`
3. Configure environment:
   - Copy `.env.example` to `.env`
   - Update `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`
4. Start backend:
   - `npm run dev`

Backend URL: `http://localhost:5000`

### Main API Endpoints

- **Auth**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- **Products**
  - `GET /api/products`
  - `GET /api/products/categories`
  - `GET /api/products/:id`
  - `POST /api/products` (Vendor)
  - `PUT /api/products/:id` (Vendor/Admin)
  - `DELETE /api/products/:id` (Vendor/Admin)
- **Orders**
  - `POST /api/orders`
  - `GET /api/orders/:customerId`
  - `GET /api/orders/vendor/me`
- **Reviews**
  - `POST /api/reviews`
  - `GET /api/reviews/:productId`
- **Cart**
  - `POST /api/cart`
  - `PUT /api/cart/:cartItemId`
  - `DELETE /api/cart/:cartItemId`
  - `GET /api/cart/:customerId`
- **Admin**
  - `GET /api/admin/users`
  - `GET /api/admin/categories`
  - `POST /api/admin/categories`
  - `DELETE /api/admin/categories/:id`
  - `GET /api/admin/orders`

## 3) Frontend Setup

1. Go to `frontend/`
2. Install dependencies (already installed in this workspace):
   - `npm install`
3. Configure environment:
   - Copy `.env.example` to `.env`
   - Set `VITE_API_BASE_URL=http://localhost:5000/api`
4. Start frontend:
   - `npm run dev`

Frontend URL: `http://localhost:5173`

## 4) Sample Login Accounts

From seed data:
- Admin: `admin@example.com`
- Vendor: `vendor1@example.com`
- Customer: `customer1@example.com`
- Password for all: `password123`

## 5) Features Implemented

- JWT authentication + role-based authorization
- Password hashing with bcrypt
- Product browsing + category filter
- Cart management (add/update/remove)
- Order placement + order history
- Review creation with rating validation (1–5)
- Vendor product management
- Admin user/category/order management
- MVC backend architecture with modular routes/controllers/models
- Validation via `express-validator`
- Structured API responses and centralized error handling

## 6) Notes

- Stock reduction is enforced at DB level through trigger `trg_order_items_stock_after_insert`.
- For production, use HTTPS, stronger password policy, refresh tokens, and secure cookie storage.

## 7) Where Data Is Saved (Important for Review)

All runtime data is saved in MySQL database **`multivendor_ecommerce`**.

- User auth/profile data: `USERS`, `CUSTOMERS`, `VENDORS`
- Product catalog (including photos/descriptions): `PRODUCTS`
- Cart operations: `CART`, `CART_ITEMS`
- Orders/payments: `ORDERS`, `ORDER_ITEMS`, `PAYMENTS`, `SHIPMENT`
- Reviews: `REVIEW`

Product fields now include:
- `Description` (TEXT)
- `Image_URL` (VARCHAR)

## 8) How to Access Database Data Quickly

You can use either MySQL Workbench or MySQL CLI.

### MySQL CLI example

1. Connect:
   - `mysql -u root -p`
2. Select DB:
   - `USE multivendor_ecommerce;`
3. Run queries:

- View products with image + description:
  - `SELECT Product_ID, Name, Price, Stock, Description, Image_URL FROM PRODUCTS ORDER BY Product_ID DESC;`

- View cart rows (after add/delete from UI):
  - `SELECT * FROM CART;`
  - `SELECT * FROM CART_ITEMS ORDER BY Cart_Item_ID DESC;`

- View latest orders:
  - `SELECT * FROM ORDERS ORDER BY Order_ID DESC;`

## 9) Add Products with Photos + Description (Vendor)

1. Login as vendor (`vendor1@example.com` / `password123`)
2. Open **Vendor Dashboard**
3. Fill:
   - Name
   - Image URL
   - Description
   - Price
   - Stock
   - Category
4. Submit **Add Product**

Then verify from DB:
- `SELECT Name, Price, Description, Image_URL FROM PRODUCTS ORDER BY Product_ID DESC LIMIT 10;`

## 10) Security Hardening Implemented

- Ownership checks:
  - Customers cannot fetch other customers' orders/carts.
  - Vendors cannot update/delete products owned by other vendors.
  - Cart item update/delete is customer-scoped.
- Order integrity:
  - Vendor is derived server-side from product IDs.
  - Mixed-vendor orders are blocked.
- Auth/API hardening:
  - Auth rate limiting enabled.
  - Helmet security headers enabled.
  - Register flow no longer allows public Admin self-registration.
  - Email normalization (`lowercase`) added.
  - Password policy strengthened (min 8 + complexity).
  - Phone number validation tightened.
- Cart consistency:
  - `CART_ITEMS` stores `Product_Name`.
  - Empty carts are cleaned up automatically from `CART`.
  - Guest cart auto-merges into DB cart on customer login.

## 11) Remaining Enterprise Improvements (Non-breaking backlog)

- Add refresh-token rotation + secure HttpOnly cookie strategy.
- Add brute-force account lockout / anomaly detection.
- Add CSRF defense if moving to cookie-based auth.
- Add audit logging and soft-delete policies for critical entities.
- Add automated integration tests and CI security checks.
- Add pagination and query limits to all list endpoints.
