const pool = require('../config/database');
const DataAnalyzer = require('../utils/dataAnalyzer');

// Analyze dataset
const analyzeDataset = async (req, res) => {
  try {
    const { datasetId } = req.params;

    const dataResult = await pool.query(
      'SELECT data FROM data_rows WHERE dataset_id = $1',
      [datasetId]
    );

    if (dataResult.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found or empty' });
    }

    const data = dataResult.rows.map(row =>
      typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    );

    const analyzer = new DataAnalyzer(data);
    const analysis = analyzer.analyze();

    res.json({
      success: true,
      analysis,
      message: 'Dataset analyzed successfully'
    });
  } catch (error) {
    console.error('Analyze dataset error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get recommendations
const getRecommendations = async (req, res) => {
  try {
    const { datasetId } = req.params;
    const { dashboardType = 'general' } = req.query;

    const dataResult = await pool.query(
      'SELECT data FROM data_rows WHERE dataset_id = $1',
      [datasetId]
    );

    if (dataResult.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found or empty' });
    }

    const data = dataResult.rows.map(row =>
      typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    );

    const analyzer = new DataAnalyzer(data);
    const recommendations = analyzer.generateKPIRecommendations(dashboardType);

    res.json({
      success: true,
      recommendations,
      dashboardType
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Apply recommendations
const applyRecommendations = async (req, res) => {
  try {
    const { datasetId, recommendations } = req.body;

    if (!datasetId || !Array.isArray(recommendations)) {
      return res.status(400).json({ error: 'Invalid request payload' });
    }

    const client = await pool.connect();
    const createdKPIs = [];

    try {
      await client.query('BEGIN');

      for (const rec of recommendations) {
        const result = await client.query(
          `INSERT INTO kpis (name, type, field, filters, dataset_id, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           RETURNING *`,
          [
            rec.name,
            rec.type,
            rec.field,
            JSON.stringify(rec.filters || {}),
            datasetId
          ]
        );

        createdKPIs.push(result.rows[0]);
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Successfully created ${createdKPIs.length} KPIs`,
        kpis: createdKPIs
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Apply recommendations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  analyzeDataset,
  getRecommendations,
  applyRecommendations
};
