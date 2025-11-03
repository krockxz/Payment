# Cheque Management System

A full-stack application for managing cheques and cash records with real-time payments and email notifications.

## 🌐 Live Application

**Frontend (Next.js):** https://cheque-management-frontend-r9z4ctkc2-krockxzs-projects.vercel.app
**Backend API (Express):** https://payment-yjxf.onrender.com

## 🏗️ Architecture

- **Frontend:** Next.js 16 with TypeScript, Tailwind CSS, Radix UI
- **Backend:** Express.js with SQLite database
- **Payments:** Razorpay integration
- **Email:** Resend API for notifications
- **Deployment:** Vercel (frontend) + Render (backend, free tier)

## 🚀 Quick Start

### Backend Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Required environment variables
PORT=5000
NODE_ENV=production
DATABASE_PATH=./cheques.db
FRONTEND_URL=https://your-frontend-url.vercel.app
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RESEND_API_KEY=your_resend_api_key
REMINDER_EMAIL=your-email@example.com

# Start server
npm start
```

### Frontend Setup

```bash
cd cheque-management-frontend
npm install
npm run dev
```

## 📋 Key Features

- **Cheque Management:** Create, track, and manage cheques with status updates
- **Cash Records:** Record and track cash transactions
- **Payment Integration:** Accept online payments via Razorpay
- **Email Notifications:** Automated reminders for pending cheques
- **Dashboard Analytics:** Real-time statistics and insights
- **Data Export:** Export reports to CSV
- **Responsive Design:** Mobile-friendly interface

## 📊 API Endpoints

### Core Endpoints
- `GET /api/cheques` - List all cheques (supports status filtering)
- `POST /api/cheques` - Create new cheque
- `PUT /api/cheques/:id` - Update cheque details
- `PATCH /api/cheques/:id/status` - Update cheque status
- `GET /api/cash` - List cash records with pagination
- `POST /api/cash` - Create cash entry
- `GET /api/dashboard/summary` - Get dashboard statistics
- `POST /api/payments/create-order` - Create Razorpay payment order
- `POST /api/payments/verify` - Verify payment signature

### Example Requests

**Create Cheque:**
```json
POST /api/cheques
{
  "cheque_number": "CHQ001",
  "amount": 50000,
  "payer_name": "ABC Construction",
  "cheque_date": "2025-01-01",
  "expected_clear_date": "2025-01-10",
  "invoice_reference": "INV-2025-001"
}
```

**Payment Order:**
```json
POST /api/payments/create-order
{
  "amount": 25000,
  "invoice_reference": "INV-2025-001",
  "customerData": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210"
  }
}
```

## 🔧 Environment Variables

### Required for Production
```bash
PORT=5000
NODE_ENV=production
DATABASE_PATH=./cheques.db
FRONTEND_URL=https://your-frontend-url.vercel.app

# Razorpay (get from dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Email (Resend API)
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXX
REMINDER_EMAIL=your-email@example.com
ENABLE_REMINDERS=true
```

## 📁 Project Structure

```
Payment/
├── index.js                    # Backend server entry point
├── database.js                 # SQLite database setup
├── package.json                # Backend dependencies
├── .env.example                # Environment template
├── routes/                     # API routes
├── controllers/                # Business logic
├── models/                     # Data models
├── services/                   # Payment services
├── jobs/                       # Scheduled tasks
└── cheque-management-frontend/ # Next.js frontend
    ├── next.config.ts          # Next.js configuration
    ├── lib/api.ts             # API client
    ├── app/                   # App router pages
    ├── components/            # React components
    └── contexts/              # React contexts
```

## 🛠️ Technologies

**Backend:** Express.js, SQLite3, Razorpay, Resend, node-cron
**Frontend:** Next.js 16, TypeScript, Tailwind CSS, Radix UI, Axios

## 📝 Response Format

All APIs return consistent structure:
```json
{
  "data": { ... },
  "error": null
}
```

## 🚀 Deployment

This application is deployed as:
- **Frontend:** Vercel (free tier)
- **Backend:** Render (free tier)
- **Database:** SQLite file storage

