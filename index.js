const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const { initializeDatabase } = require('./database');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5000'], // Allow Next.js frontend and same origin
    credentials: true
}));

// Body parsing middleware with increased limit for large data
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// HTTP request logging middleware
app.use(morgan('combined')); // Log all HTTP requests

// Serve static files from Next.js build directory
app.use(express.static(path.join(__dirname, './cheque-management-frontend/out'), {
    maxAge: '1d',
    etag: true
}));

// Serve Next.js static assets
app.use('/_next', express.static(path.join(__dirname, './cheque-management-frontend/out/_next'), {
    maxAge: '1d',
    etag: true
}));

// Import all route modules
const chequeRoutes = require('./routes/cheques');
const cashRoutes = require('./routes/cash');
const dashboardRoutes = require('./routes/dashboard');
const exportRoutes = require('./routes/export');
const paymentRoutes = require('./routes/payments');
const userSettingsRoutes = require('./routes/userSettings');

// Import reminder job
const reminderJob = require('./jobs/reminderJob');

// Route registration
app.use('/api/cheques', chequeRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/user/settings', userSettingsRoutes);

// Initialize email reminder job
if (process.env.ENABLE_REMINDERS === 'true') {
    reminderJob.start();
    console.log('✅ Email reminder job started');
} else {
    console.log('⏸️ Email reminders are disabled');
}

// Root endpoint - API information
app.get('/', (req, res) => {
    res.json({
        message: 'Cheque Management System API',
        version: '1.0.0',
        status: 'Server is running',
        endpoints: {
            cheques: '/api/cheques',
            cash: '/api/cash',
            dashboard: '/api/dashboard',
            export: '/api/export'
        },
        documentation: {
            cheques: {
                'GET /': 'Get all cheques (with optional status filter)',
                'POST /': 'Create new cheque',
                'GET /:id': 'Get cheque by ID',
                'PUT /:id': 'Update cheque',
                'PATCH /:id/status': 'Update cheque status',
                'DELETE /:id': 'Delete cheque'
            },
            cash: {
                'GET /': 'Get cash records (with pagination)',
                'POST /': 'Create cash record',
                'GET /:id': 'Get cash record by ID',
                'PUT /:id': 'Update cash record',
                'DELETE /:id': 'Delete cash record',
                'GET /total': 'Get total cash amount'
            },
            dashboard: {
                'GET /summary': 'Get dashboard summary statistics',
                'GET /pending-cheques': 'Get pending cheques sorted by urgency',
                'GET /bounced-cheques': 'Get bounced cheques',
                'GET /cash-today': "Get today's cash collection",
                'GET /payment-status': 'Get payment status by invoice ID',
                'GET /monthly-stats': 'Get monthly statistics'
            },
            export: {
                'GET /all-cheques': 'Export all cheques to CSV',
                'GET /cash-records': 'Export cash records to CSV',
                'GET /pending-cheques': 'Export pending cheques to CSV',
                'GET /summary-report': 'Export summary report to CSV'
            }
        }
    });
});

// Test email functionality endpoint
app.get('/api/test/send-email', async (req, res) => {
    try {
        const emailService = require('./services/emailService');
        const testCheque = {
            id: 'test-999',
            cheque_number: 'CHQ999',
            amount: 50000,
            payer_name: 'Test Company',
            expected_clear_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3 days from now
        };

        console.log('📧 Testing email functionality with test cheque:', testCheque);

        const result = await emailService.sendChequeReminder(
            testCheque,
            process.env.REMINDER_EMAIL
        );

        console.log('📧 Email test result:', result);

        if (result.success) {
            res.json({
                success: true,
                message: 'Test email sent successfully',
                messageId: result.messageId,
                testCheque: testCheque
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send test email',
                error: result.error,
                testCheque: testCheque
            });
        }
    } catch (error) {
        console.error('❌ Email test error:', error);
        res.status(500).json({
            success: false,
            message: 'Email test failed',
            error: error.message
        });
    }
});

// Test reminder job status endpoint
app.get('/api/test/reminder-status', (req, res) => {
    try {
        const reminderJob = require('./jobs/reminderJob');
        const status = reminderJob.getStatus();

        res.json({
            success: true,
            reminderJobStatus: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Reminder status check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get reminder job status',
            error: error.message
        });
    }
});

// Manually trigger reminder processing (for testing)
app.post('/api/test/trigger-reminders', async (req, res) => {
    try {
        const reminderJob = require('./jobs/reminderJob');

        console.log('🔄 Manual trigger of reminder processing via API...');
        await reminderJob.triggerManual();

        res.json({
            success: true,
            message: 'Reminder processing triggered manually',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Manual reminder trigger error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger reminder processing',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 404 - Handle not found routes
app.use((req, res) => {
    res.status(404).json({
        data: null,
        error: {
            message: 'Endpoint not found',
            code: 'NOT_FOUND',
            path: req.path,
            method: req.method
        }
    });
});

// Global error handling middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Graceful shutdown handling
let server;

const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

    // Stop accepting new connections
    if (server) {
        server.close((err) => {
            if (err) {
                console.error('Error during server shutdown:', err);
                process.exit(1);
            }

            console.log('HTTP server closed.');

            // Close database connection
            const { closeDatabase } = require('./database');
            closeDatabase();

            console.log('Graceful shutdown completed.');
            process.exit(0);
        });
    }
};

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

// Server startup function
const startServer = async () => {
    try {
        console.log('🚀 Starting Cheque Management System API...');

        // Initialize database
        console.log('📊 Initializing database...');
        await initializeDatabase();

        // Create HTTP server with error handler registered first
        const http = require('http');
        server = http.createServer(app);

        // Handle server errors BEFORE listening
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
                console.error(`💡 Tip: Stop the other process or change PORT in .env file`);
            } else {
                console.error('❌ Server error:', err);
            }
            process.exit(1);
        });

        // Start listening
        server.listen(PORT, () => {
            console.log(`\n✅ Server running successfully on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`\n📚 API Endpoints:`);
            console.log(`   • Cheques:        http://localhost:${PORT}/api/cheques`);
            console.log(`   • Cash Records:    http://localhost:${PORT}/api/cash`);
            console.log(`   • Dashboard:       http://localhost:${PORT}/api/dashboard`);
            console.log(`   • Export:          http://localhost:${PORT}/api/export`);
            console.log(`   • Health Check:    http://localhost:${PORT}/health`);
            console.log(`\n📖 API Documentation: http://localhost:${PORT}/`);
            console.log(`\n💡 Server is ready to accept requests!`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

module.exports = app; // Export for testing purposes