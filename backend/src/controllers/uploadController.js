const { parseCSV } = require('../utils/csvParser');
const { parseExcel } = require('../utils/excelParser');
const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    console.log('Processing file:', req.file.originalname);
    
    let data;
    if (ext === '.csv') {
      data = await parseCSV(filePath);
    } else if (ext === '.xlsx' || ext === '.xls') {
      data = parseExcel(filePath);
    } else {
      return res.status(400).json({ error: 'Invalid file format' });
    }

    if (!data || data.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'File is empty or could not be parsed' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const datasetResult = await client.query(
        'INSERT INTO datasets (name, file_name, uploaded_at) VALUES ($1, $2, NOW()) RETURNING id',
        [req.body.datasetName || 'Untitled Dataset', req.file.originalname]
      );
      
      const datasetId = datasetResult.rows[0].id;
      
      for (const row of data) {
        await client.query(
          'INSERT INTO data_rows (dataset_id, data) VALUES ($1, $2)',
          [datasetId, JSON.stringify(row)]
        );
      }
      
      await client.query('COMMIT');
      
      fs.unlinkSync(filePath);
      
      console.log(`✅ Uploaded ${data.length} rows for dataset ${datasetId}`);
      
      res.json({
        message: 'File uploaded successfully',
        datasetId,
        rowCount: data.length,
        columns: Object.keys(data[0] || {})
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Upload error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: error.message });
  }
};

const getDatasets = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        d.id, 
        d.name, 
        d.file_name, 
        d.uploaded_at,
        COUNT(dr.id) as row_count
      FROM datasets d
      LEFT JOIN data_rows dr ON d.id = dr.dataset_id
      GROUP BY d.id
      ORDER BY d.uploaded_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get datasets error:', error);
    res.status(500).json({ error: error.message });
  }
};

const getDatasetById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const datasetResult = await pool.query(
      'SELECT * FROM datasets WHERE id = $1',
      [id]
    );
    
    if (datasetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    
    const dataResult = await pool.query(
      'SELECT data FROM data_rows WHERE dataset_id = $1 LIMIT 100',
      [id]
    );
    
    res.json({
      dataset: datasetResult.rows[0],
      data: dataResult.rows.map(row => row.data)
    });
  } catch (error) {
    console.error('Get dataset error:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteDataset = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM datasets WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    
    res.json({ message: 'Dataset deleted successfully' });
  } catch (error) {
    console.error('Delete dataset error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadFile,
  getDatasets,
  getDatasetById,
  deleteDataset
};