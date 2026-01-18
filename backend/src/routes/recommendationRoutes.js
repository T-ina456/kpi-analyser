const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

router.get('/analyze/:datasetId', recommendationController.analyzeDataset);
router.get('/suggest/:datasetId', recommendationController.getRecommendations);
router.post('/apply', recommendationController.applyRecommendations);

module.exports = router;