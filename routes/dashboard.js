const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');

router.get('/summary', DashboardController.getSummary);

router.get('/pending-cheques', DashboardController.getPendingCheques);

router.get('/bounced-cheques', DashboardController.getBouncedCheques);

router.get('/cash-today', DashboardController.getCashToday);

router.get('/payment-status', DashboardController.getPaymentStatus);

router.get('/monthly-stats', DashboardController.getMonthlyStats);

// Analytics endpoints
router.get('/trends', DashboardController.getTrends);

router.get('/status-breakdown', DashboardController.getStatusBreakdown);

router.get('/top-payers', DashboardController.getTopPayers);

router.get('/key-metrics', DashboardController.getKeyMetrics);

module.exports = router;