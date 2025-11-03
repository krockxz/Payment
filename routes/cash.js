const express = require('express');
const router = express.Router();
const CashController = require('../controllers/cashController');

router.post('/', CashController.createCashRecord);

router.get('/', CashController.getAllCashRecords);

router.get('/total', CashController.getCashTotal);

router.get('/:id', CashController.getCashRecordById);

router.put('/:id', CashController.updateCashRecord);

router.delete('/:id', CashController.deleteCashRecord);

module.exports = router;