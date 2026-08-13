const express = require('express');
const router = express.Router();
const { getStockDashboard, getStockPrice, placeTrade } = require('../controller/stocks');

router.get('/', getStockDashboard);
router.post('/price', getStockPrice);
router.post('/trade', placeTrade);

module.exports = router;
