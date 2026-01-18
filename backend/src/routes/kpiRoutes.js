const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiController');

router.post('/', kpiController.createKPI);
router.get('/', kpiController.getKPIs);
router.get('/calculate-all', kpiController.calculateAllKPIs);
router.get('/:id', kpiController.getKPIById);
router.get('/:id/calculate', kpiController.calculateKPIValue);
router.put('/:id', kpiController.updateKPI);
router.delete('/:id', kpiController.deleteKPI);

module.exports = router;