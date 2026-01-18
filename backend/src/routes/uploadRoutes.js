const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const uploadController = require('../controllers/uploadController');

router.post('/', upload.single('file'), uploadController.uploadFile);
router.get('/datasets', uploadController.getDatasets);
router.get('/datasets/:id', uploadController.getDatasetById);
router.delete('/datasets/:id', uploadController.deleteDataset);

module.exports = router;