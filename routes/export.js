const express = require('express');
const router = express.Router();
const ExportController = require('../controllers/exportController');

router.get('/all-cheques', ExportController.exportAllCheques);

router.get('/cash-records', ExportController.exportCashRecords);

router.get('/pending-cheques', ExportController.exportPendingCheques);

router.get('/summary-report', ExportController.exportSummaryReport);

module.exports = router;