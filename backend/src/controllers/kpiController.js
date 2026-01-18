const pool = require('../config/database');
const { calculateKPI } = require('../utils/kpiCalculator');

// Create KPI
const createKPI = async (req, res) => {
  try {
    const { name, type, field, filters, datasetId } = req.body;
    
    if (!name || !type || !field || !datasetId) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, type, field, datasetId' 
      });
    }
    
    const validTypes = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'PERCENT_CHANGE'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: `Invalid KPI type. Must be one of: ${validTypes.join(', ')}` 
      });
    }
    
    const result = await pool.query(
      `INSERT INTO kpis (name, type, field, filters, dataset_id, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [name, type, field, JSON.stringify(filters || {}), datasetId]
    );
    
    console.log(`✅ Created KPI: ${name} (${type})`);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create KPI error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all KPIs
const getKPIs = async (req, res) => {
  try {
    const { datasetId } = req.query;
    
    let query = `
      SELECT 
        k.*,
        d.name as dataset_name
      FROM kpis k
      LEFT JOIN datasets d ON k.dataset_id = d.id
    `;
    let params = [];
    
    if (datasetId) {
      query += ' WHERE k.dataset_id = $1';
      params.push(datasetId);
    }
    
    query += ' ORDER BY k.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get KPIs error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get KPI by ID
const getKPIById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        k.*,
        d.name as dataset_name
      FROM kpis k
      LEFT JOIN datasets d ON k.dataset_id = d.id
      WHERE k.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'KPI not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get KPI error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Calculate single KPI value
const calculateKPIValue = async (req, res) => {
  try {
    const { id } = req.params;
    
    const kpiResult = await pool.query('SELECT * FROM kpis WHERE id = $1', [id]);
    if (kpiResult.rows.length === 0) {
      return res.status(404).json({ error: 'KPI not found' });
    }
    
    const kpi = kpiResult.rows[0];
    
    const dataResult = await pool.query(
      'SELECT data FROM data_rows WHERE dataset_id = $1',
      [kpi.dataset_id]
    );
    
    const data = dataResult.rows.map(row => row.data);
    
    if (data.length === 0) {
      return res.status(400).json({ error: 'No data available for this dataset' });
    }
    
    const value = calculateKPI(data, {
      type: kpi.type,
      field: kpi.field,
      filters: kpi.filters
    });
    
    await pool.query(
      'UPDATE kpis SET current_value = $1, last_calculated = NOW() WHERE id = $2',
      [value, id]
    );
    
    console.log(`📊 Calculated KPI ${id}: ${value}`);
    
    res.json({ 
      kpiId: id, 
      name: kpi.name,
      value,
      calculatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Calculate KPI error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Calculate all KPIs
const calculateAllKPIs = async (req, res) => {
  try {
    const { datasetId } = req.query;
    
    let query = 'SELECT * FROM kpis';
    let params = [];
    
    if (datasetId) {
      query += ' WHERE dataset_id = $1';
      params.push(datasetId);
    }
    
    const kpisResult = await pool.query(query, params);
    const results = [];
    
    for (const kpi of kpisResult.rows) {
      try {
        const dataResult = await pool.query(
          'SELECT data FROM data_rows WHERE dataset_id = $1',
          [kpi.dataset_id]
        );
        
        const data = dataResult.rows.map(row => row.data);
        
        if (data.length > 0) {
          const value = calculateKPI(data, {
            type: kpi.type,
            field: kpi.field,
            filters: kpi.filters
          });
          
          await pool.query(
            'UPDATE kpis SET current_value = $1, last_calculated = NOW() WHERE id = $2',
            [value, kpi.id]
          );
          
          results.push({
            kpiId: kpi.id,
            name: kpi.name,
            value
          });
        }
      } catch (error) {
        console.error(`Error calculating KPI ${kpi.id}:`, error);
        results.push({
          kpiId: kpi.id,
          name: kpi.name,
          error: error.message
        });
      }
    }
    
    res.json({ 
      message: 'KPI calculation complete',
      results 
    });
  } catch (error) {
    console.error('Calculate all KPIs error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update KPI
const updateKPI = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, field, filters } = req.body;
    
    const result = await pool.query(
      `UPDATE kpis 
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           field = COALESCE($3, field),
           filters = COALESCE($4, filters)
       WHERE id = $5
       RETURNING *`,
      [name, type, field, filters ? JSON.stringify(filters) : null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'KPI not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update KPI error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete KPI
const deleteKPI = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM kpis WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'KPI not found' });
    }
    
    console.log(`🗑️ Deleted KPI: ${result.rows[0].name}`);
    
    res.json({ message: 'KPI deleted successfully' });
  } catch (error) {
    console.error('Delete KPI error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Export all functions
module.exports = {
  createKPI,
  getKPIs,
  getKPIById,
  calculateKPIValue,
  calculateAllKPIs,
  updateKPI,
  deleteKPI
};