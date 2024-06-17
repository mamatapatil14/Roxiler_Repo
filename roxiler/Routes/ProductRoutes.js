const express = require('express');
const router = express.Router();
const productController = require('../Controller/ProductController');

router.get('/initialize', productController.initializeDatabase);
router.get('/transactions', productController.getTransactions);
router.get('/statistics',productController.getStatisticsByMonth)
router.get('/barchart',productController.getBarChartData)
router.get('/piechart',productController.getPieChartData)
router.get('/combinedata',productController.getCombinedData)
module.exports = router;
// module.exports=((app)=>{
//     const Pro=require("../Controller/ProductController")
//     app.get('/initialize', Pro.initializeDatabase)
// })
