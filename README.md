# Cheque Management System - Backend API

Express.js backend for managing cheques and cash records with SQLite database.

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
PORT=5000
NODE_ENV=development
DATABASE_PATH=./cheque_management.db
FRONTEND_URL=http://localhost:3000
```

### Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000` (or the PORT specified in `.env`)

## 📋 API Endpoints

### Health & Info

- `GET /` - API information and documentation
- `GET /health` - Health check endpoint

### Cheques API (`/api/cheques`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/cheques` | Create a new cheque |
| `GET` | `/api/cheques` | Get all cheques (with optional `?status=pending` filter) |
| `GET` | `/api/cheques/:id` | Get single cheque by ID |
| `PUT` | `/api/cheques/:id` | Update cheque |
| `PATCH` | `/api/cheques/:id/status` | Update cheque status only |
| `DELETE` | `/api/cheques/:id` | Delete cheque |

**Example - Create Cheque:**
```json
POST /api/cheques
{
  "cheque_number": "CHQ001",
  "amount": 50000,
  "payer_name": "ABC Construction",
  "cheque_date": "2025-01-01",
  "expected_clear_date": "2025-01-10",
  "invoice_reference": "INV-2025-001",
  "notes": "Monthly payment"
}
```

**Status Values:** `pending`, `deposited`, `cleared`, `bounced`

### Cash Records API (`/api/cash`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/cash` | Create cash entry |
| `GET` | `/api/cash` | Get all cash records (paginated, with optional filters) |
| `GET` | `/api/cash/total` | Get total cash amount (with optional date range) |
| `GET` | `/api/cash/:id` | Get single cash record by ID |
| `PUT` | `/api/cash/:id` | Update cash record |
| `DELETE` | `/api/cash/:id` | Delete cash record |

**Query Parameters for GET /api/cash:**
- `page` - Page number (default: 1)
- `limit` - Records per page (default: 10, max: 100)
- `startDate` - Filter from date (YYYY-MM-DD)
- `endDate` - Filter to date (YYYY-MM-DD)
- `reference_person` - Filter by person name

**Example - Create Cash Record:**
```json
POST /api/cash
{
  "amount": 25000,
  "date": "2025-01-15",
  "reference_person": "John Doe",
  "purpose": "Advance payment",
  "invoice_reference": "INV-2025-001",
  "notes": "Cash received"
}
```

### Dashboard API (`/api/dashboard`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/summary` | Get dashboard summary statistics |
| `GET` | `/api/dashboard/pending-cheques` | Get pending cheques (sorted by urgency, limit 20) |
| `GET` | `/api/dashboard/bounced-cheques` | Get all bounced cheques |
| `GET` | `/api/dashboard/cash-today` | Get today's cash collection |
| `GET` | `/api/dashboard/payment-status?invoice_id=123` | Get payment status by invoice |
| `GET` | `/api/dashboard/monthly-stats?year=2025` | Get monthly statistics |

**Dashboard Summary Response:**
```json
{
  "data": {
    "pending_cheques_count": 5,
    "pending_cheques_amount": 250000,
    "cleared_cheques_count": 10,
    "cleared_cheques_amount": 500000,
    "bounced_cheques_count": 1,
    "bounced_cheques_amount": 50000,
    "total_cash_collected_month": 75000,
    "overdue_cheques": 2
  }
}
```

### Export API (`/api/export`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/export/all-cheques?format=csv` | Export all cheques to CSV |
| `GET` | `/api/export/cash-records?format=csv&month=2025-01` | Export cash records to CSV |
| `GET` | `/api/export/pending-cheques?format=csv` | Export pending cheques to CSV |
| `GET` | `/api/export/summary-report?format=csv&month=2025-01` | Export summary report to CSV |

All export endpoints require `format=csv` query parameter.

## 🗄️ Database Schema

### CHEQUES Table
- `id` - INTEGER PRIMARY KEY
- `cheque_number` - TEXT UNIQUE NOT NULL
- `amount` - REAL NOT NULL
- `payer_name` - TEXT NOT NULL
- `cheque_date` - TEXT NOT NULL
- `expected_clear_date` - TEXT
- `actual_clear_date` - TEXT
- `status` - TEXT DEFAULT 'pending' (pending/deposited/cleared/bounced)
- `invoice_reference` - TEXT
- `notes` - TEXT
- `created_at` - TEXT DEFAULT CURRENT_TIMESTAMP
- `updated_at` - TEXT DEFAULT CURRENT_TIMESTAMP

### CASH_RECORDS Table
- `id` - INTEGER PRIMARY KEY
- `amount` - REAL NOT NULL
- `date` - TEXT NOT NULL
- `reference_person` - TEXT
- `purpose` - TEXT
- `invoice_reference` - TEXT
- `notes` - TEXT
- `created_at` - TEXT DEFAULT CURRENT_TIMESTAMP

## 📁 Project Structure

```
cheque-management-backend/
├── index.js                 # Main server file
├── database.js              # Database initialization and connection
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
├── .env.example            # Environment variables template
├── routes/                  # API route definitions
│   ├── cheques.js
│   ├── cash.js
│   ├── dashboard.js
│   └── export.js
├── controllers/            # Business logic handlers
│   ├── chequeController.js
│   ├── cashController.js
│   ├── dashboardController.js
│   └── exportController.js
├── models/                  # Data access layer
│   ├── cheque.js
│   └── cashRecord.js
└── middleware/              # Express middleware
    └── errorHandler.js
```

## 🔒 Security Features

- SQL injection prevention with prepared statements
- CORS configuration for frontend access
- Input validation on all endpoints
- Error handling with proper HTTP status codes
- Graceful shutdown handling

## 🛠️ Technologies Used

- **Express.js** - Web framework
- **SQLite3** - Database
- **fast-csv** - CSV export functionality
- **morgan** - HTTP request logging
- **cors** - Cross-origin resource sharing
- **body-parser** - Request body parsing
- **dotenv** - Environment variable management

## 📝 Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "data": { ... },
  "error": null
}
```

**Error Response:**
```json
{
  "data": null,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## 🧪 Testing Endpoints

### Using cURL

**Create a cheque:**
```bash
curl -X POST http://localhost:5000/api/cheques \
  -H "Content-Type: application/json" \
  -d '{
    "cheque_number": "CHQ001",
    "amount": 50000,
    "payer_name": "ABC Construction",
    "cheque_date": "2025-01-01",
    "expected_clear_date": "2025-01-10"
  }'
```

**Get all cheques:**
```bash
curl http://localhost:5000/api/cheques
```

**Update cheque status:**
```bash
curl -X PATCH http://localhost:5000/api/cheques/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "cleared"}'
```

**Create cash record:**
```bash
curl -X POST http://localhost:5000/api/cash \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 25000,
    "date": "2025-01-15",
    "reference_person": "John Doe",
    "purpose": "Advance payment"
  }'
```

**Get dashboard summary:**
```bash
curl http://localhost:5000/api/dashboard/summary
```

**Export cheques to CSV:**
```bash
curl http://localhost:5000/api/export/all-cheques?format=csv -o cheques.csv
```

## 📄 License

ISC

## 👨‍💻 Development

### Running in Development Mode

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server on file changes.

### Database Location

The SQLite database file is created at: `./cheque_management.db`

This file is automatically created on first run and is ignored by git (see `.gitignore`).

## 🚀 Deployment

The application can be deployed to any Node.js hosting service. Ensure:

1. Set `NODE_ENV=production` in your environment
2. Configure proper CORS origins for your frontend
3. Set up database backups (SQLite file)
4. Configure proper logging and monitoring

## 📊 Additional Notes

- All timestamps are stored in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)
- Cheque numbers must be unique
- Status updates automatically set `actual_clear_date` when status changes to `cleared`
- Database has automatic timestamp triggers for `updated_at` field
- Pagination defaults to 10 records per page, max 100
