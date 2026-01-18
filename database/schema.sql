-- Create datasets table
CREATE TABLE IF NOT EXISTS datasets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create data_rows table
CREATE TABLE IF NOT EXISTS data_rows (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create KPIs table
CREATE TABLE IF NOT EXISTS kpis (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  field VARCHAR(100) NOT NULL,
  filters JSONB,
  dataset_id INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
  current_value NUMERIC,
  last_calculated TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_data_rows_dataset_id ON data_rows(dataset_id);
CREATE INDEX idx_kpis_dataset_id ON kpis(dataset_id);
CREATE INDEX idx_data_rows_data ON data_rows USING GIN (data);