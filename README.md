# 🍽️ SmartDine AI — Full-Stack Restaurant Management & Food Ordering Platform

A production-level MERN Stack application with AI-powered recommendations, real-time order tracking, Razorpay payments, and a premium modern UI.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Redux Toolkit |
| Backend | Node.js, Express.js, Socket.io |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcryptjs + Cookie-parser + Firebase |
| Payments | Razorpay |
| Storage | Cloudinary |
| AI | Gemini |
| Email | Nodemailer |
| Charts | Recharts |

---

## 📁 Project Structure

```
SmartDine/
├── backend/
│   ├── config/          # DB, Cloudinary, Razorpay configs
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, error handler, rate limiter
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── sockets/         # Socket.io handlers
│   ├── utils/           # Helpers (email, token, invoice)
│   └── server.js        # Entry point
│
└── frontend/
    └── src/
        ├── api/         # Axios instance
        ├── components/  # Reusable UI components
        ├── layouts/     # Page layouts
        ├── pages/       # Customer & Admin pages
        ├── redux/       # Store + slices
        ├── routes/      # Protected routes
        ├── services/    # Socket service
        └── utils/       # Date, currency helpers
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account
- Cloudinary account
- Razorpay account
- Gemini API key

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Variables

**Backend** — copy `backend/.env.example` to `backend/.env` and fill in:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your@email.com
SMTP_PASSWORD=your_app_password
GEMINI_API_KEY=sk-...
FIREBASE_PROJECT_ID=....
FIREBASE_PRIVATE_KEY_ID=....
FIREBASE_PRIVATE_KEY=.....
FIREBASE_CLIENT_EMAIL=....
FIREBASE_CLIENT_ID=.....
CLIENT_URL=http://localhost:3000
```

**Frontend** — copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/profile` | Get profile |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/forgot-password` | Forgot password |
| PUT | `/api/auth/reset-password/:token` | Reset password |

### Restaurants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/restaurants` | List all (with filters) |
| GET | `/api/restaurants/featured` | Featured restaurants |
| GET | `/api/restaurants/:id` | Single restaurant |
| POST | `/api/restaurants` | Create (admin) |
| PUT | `/api/restaurants/:id` | Update (admin) |
| DELETE | `/api/restaurants/:id` | Delete (admin) |

### Foods
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/foods` | List foods |
| GET | `/api/foods/popular` | Popular foods |
| GET | `/api/foods/:id` | Single food |
| POST | `/api/foods` | Create (admin) |
| PUT | `/api/foods/:id` | Update (admin) |
| DELETE | `/api/foods/:id` | Delete (admin) |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get cart |
| POST | `/api/cart/add` | Add item |
| PUT | `/api/cart/update` | Update quantity |
| DELETE | `/api/cart/remove/:foodId` | Remove item |
| DELETE | `/api/cart/clear` | Clear cart |
| POST | `/api/cart/coupon` | Apply coupon |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place order |
| GET | `/api/orders/my-orders` | My orders |
| GET | `/api/orders/:id` | Order detail |
| PUT | `/api/orders/:id/status` | Update status (admin) |
| PUT | `/api/orders/:id/cancel` | Cancel order |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment |
| GET | `/api/payments/history` | Payment history |
| GET | `/api/payments/invoice/:orderId` | Download invoice |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | AI chatbot |
| POST | `/api/ai/recommendations` | Food recommendations |
| POST | `/api/ai/search` | Smart NL search |
| POST | `/api/ai/generate-description` | Menu description |
| GET | `/api/ai/review-summary/:id` | Review summary |
| POST | `/api/ai/faq` | FAQ support |

---

## 🎭 User Roles

| Role | Permissions |
|------|-------------|
| `customer` | Browse, order, review, wishlist |
| `restaurant_admin` | Manage restaurant, foods, orders |
| `super_admin` | Full access, approve restaurants, analytics |

---

## 🔌 Real-Time Events (Socket.io)

| Event | Direction | Description |
|-------|-----------|-------------|
| `order_update` | Server → Client | Order status changed |
| `new_order` | Server → Restaurant | New order received |
| `payment_received` | Server → Restaurant | Payment confirmed |
| `track_order` | Client → Server | Start tracking order |

---

## 🚀 Deployment

### Backend (Render)
1. Push to GitHub
2. Create new Web Service on Render
3. Connect repo, set build command: `npm install`, start: `node server.js`
4. Add all environment variables

### Frontend (Netlify)
1. Push to GitHub
2. Import project on Vercel
3. Set `VITE_API_URL` to your Render backend URL
4. Deploy

### Database (MongoDB Atlas)
1. Create cluster on MongoDB Atlas
2. Whitelist Render's IP (or 0.0.0.0/0 for all)
3. Copy connection string to `MONGO_URI`

---

## ✨ Features

- 🔐 JWT Authentication with role-based access
- 🛒 Full cart system with coupon support
- 💳 Razorpay payment integration (cards, UPI, netbanking)
- 🤖 AI chatbot, recommendations, smart search
- 📦 Real-time order tracking via Socket.io
- 📊 Admin dashboard with Recharts analytics
- 🌙 Dark/Light mode
- 📱 Mobile-first responsive design
- 🔔 Real-time notifications
- 📧 Email notifications (order, payment, welcome)
- ⭐ Reviews & ratings with AI summaries
- 🏷️ Coupon/discount system
- ❤️ Wishlist & favorite restaurants
- 🧾 Invoice generation

---

## 📄 License

MIT License — feel free to use for personal and commercial projects.
