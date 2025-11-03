const express = require('express');
const router = express.Router();
const ChequeController = require('../controllers/chequeController');

router.post('/', ChequeController.createCheque);

router.get('/calendar', ChequeController.getCalendarData);

router.get('/', ChequeController.getAllCheques);

router.get('/:id', ChequeController.getChequeById);

router.put('/:id', ChequeController.updateCheque);

router.patch('/:id/status', ChequeController.updateChequeStatus);

router.delete('/:id', ChequeController.deleteCheque);

module.exports = router;