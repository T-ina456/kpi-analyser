const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/summary/:datasetId', async (req, res) => {
  try {
    const { datasetId } = req.params;
    
    const result = await pool.query(
      'SELECT data FROM data_rows WHERE dataset_id = $1',
      [datasetId]
    );
    
    const data = result.rows.map(row => row.data);
    
    const summary = {
      totalRows: data.length,
      columns: data.length > 0 ? Object.keys(data[0]) : []
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;