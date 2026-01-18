-- Sample dataset
INSERT INTO datasets (name, file_name) VALUES 
('Sales Data 2024', 'sales_2024.csv');

-- Sample data rows
INSERT INTO data_rows (dataset_id, data) VALUES
(1, '{"date": "2024-01-15", "customer_id": "C001", "product": "Laptop", "category": "Electronics", "revenue": 1200, "quantity": 1}'),
(1, '{"date": "2024-01-16", "customer_id": "C002", "product": "Phone", "category": "Electronics", "revenue": 800, "quantity": 1}'),
(1, '{"date": "2024-01-17", "customer_id": "C003", "product": "Shirt", "category": "Clothing", "revenue": 50, "quantity": 2}');

-- Sample KPIs
INSERT INTO kpis (name, type, field, dataset_id) VALUES
('Total Revenue', 'SUM', 'revenue', 1),
('Average Order Value', 'AVG', 'revenue', 1),
('Total Orders', 'COUNT', 'customer_id', 1);