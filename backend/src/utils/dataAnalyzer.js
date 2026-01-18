class DataAnalyzer {
  constructor(data) {
    this.data = Array.isArray(data) ? data : [];
    this.columns = this.data.length > 0 ? Object.keys(this.data[0]) : [];
    this.analysis = null;
  }

  // ---------------- COLUMN TYPE DETECTION ----------------
  analyzeColumnTypes() {
    const columnTypes = {};

    this.columns.forEach(col => {
      const values = this.data
        .map(row => row[col])
        .filter(v => v !== null && v !== undefined && v !== '');

      if (values.length === 0) {
        columnTypes[col] = 'empty';
        return;
      }

      const numericCount = values.filter(v => !isNaN(parseFloat(v))).length;
      const numericRatio = numericCount / values.length;

      const dateCount = values.filter(v => {
        if (typeof v !== 'string') return false;
        return /^\d{4}-\d{2}-\d{2}/.test(v) || !isNaN(Date.parse(v));
      }).length;
      const dateRatio = dateCount / values.length;

      const uniqueValues = new Set(values);
      const uniqueRatio = uniqueValues.size / values.length;

      const colLower = col.toLowerCase();

      if (numericRatio > 0.8) {
        if (colLower.includes('id') || uniqueRatio > 0.9) {
          columnTypes[col] = 'identifier';
        } else if (
          colLower.includes('price') ||
          colLower.includes('revenue') ||
          colLower.includes('cost') ||
          colLower.includes('amount') ||
          colLower.includes('sales') ||
          colLower.includes('profit')
        ) {
          columnTypes[col] = 'currency';
        } else if (
          colLower.includes('quantity') ||
          colLower.includes('count') ||
          colLower.includes('qty') ||
          colLower.includes('units')
        ) {
          columnTypes[col] = 'quantity';
        } else {
          columnTypes[col] = 'numeric';
        }
      } else if (dateRatio > 0.8) {
        columnTypes[col] = 'date';
      } else if (uniqueRatio < 0.5) {
        columnTypes[col] = 'categorical';
      } else {
        columnTypes[col] = 'text';
      }
    });

    return columnTypes;
  }

  // ---------------- DOMAIN DETECTION ----------------
  detectBusinessDomain() {
    const columnNames = this.columns.map(c => c.toLowerCase()).join(' ');

    const domains = {
      sales: ['revenue', 'sales', 'order', 'customer', 'product', 'price'],
      finance: ['revenue', 'cost', 'profit', 'expense', 'budget'],
      marketing: ['campaign', 'lead', 'conversion', 'click', 'engagement'],
      operations: ['inventory', 'stock', 'delivery', 'production', 'capacity'],
      hr: ['employee', 'salary', 'attendance', 'performance']
    };

    const scores = {};
    Object.keys(domains).forEach(domain => {
      scores[domain] = domains[domain].filter(k =>
        columnNames.includes(k)
      ).length;
    });

    const detected = Object.entries(scores)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([domain]) => domain);

    return detected.length ? detected : ['general'];
  }

  // ---------------- STATISTICS ----------------
  analyzeStatistics(columnTypes) {
    const stats = {};

    this.columns.forEach(col => {
      const values = this.data
        .map(row => row[col])
        .filter(v => v !== null && v !== undefined && v !== '');

      const type = columnTypes[col];

      stats[col] = {
        type,
        count: values.length,
        nullCount: this.data.length - values.length,
        uniqueCount: new Set(values).size
      };

      if (['numeric', 'currency', 'quantity'].includes(type)) {
        const nums = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
        if (nums.length) {
          stats[col].min = Math.min(...nums);
          stats[col].max = Math.max(...nums);
          stats[col].avg = nums.reduce((a, b) => a + b, 0) / nums.length;
          stats[col].sum = nums.reduce((a, b) => a + b, 0);
        }
      }
    });

    return stats;
  }

  // ---------------- MAIN ANALYSIS ----------------
  analyze() {
    const columnTypes = this.analyzeColumnTypes();
    const domains = this.detectBusinessDomain();
    const statistics = this.analyzeStatistics(columnTypes);

    this.analysis = {
      rowCount: this.data.length,
      columnCount: this.columns.length,
      columns: this.columns,
      columnTypes,
      detectedDomains: domains,
      statistics
    };

    return this.analysis;
  }

  // ---------------- KPI RECOMMENDATIONS ----------------
  generateKPIRecommendations(dashboardType = 'general') {
    if (!this.data || this.data.length === 0) {
      return [{
        name: 'Total Records',
        type: 'COUNT',
        field: 'rows',
        category: 'overview',
        priority: 'high',
        description: 'Total number of records',
        reasoning: 'Dataset contains records'
      }];
    }

    if (!this.analysis) this.analyze();

    const recommendations = [];
    const { columnTypes } = this.analysis;

    const currencyCols = Object.entries(columnTypes)
      .filter(([_, t]) => t === 'currency')
      .map(([c]) => c)
      .slice(0, 2);

    const quantityCols = Object.entries(columnTypes)
      .filter(([_, t]) => t === 'quantity' || t === 'numeric')
      .map(([c]) => c)
      .slice(0, 2);

    currencyCols.forEach(col => {
      recommendations.push(
        this.createKPI(`Total ${col}`, 'SUM', col, 'financial', 'high'),
        this.createKPI(`Average ${col}`, 'AVG', col, 'financial', 'medium')
      );
    });

    quantityCols.forEach(col => {
      recommendations.push(
        this.createKPI(`Total ${col}`, 'SUM', col, 'operational', 'medium')
      );
    });

    recommendations.push({
      name: 'Total Records',
      type: 'COUNT',
      field: this.columns[0],
      category: 'overview',
      priority: 'high',
      description: 'Total records in dataset',
      reasoning: 'Baseline dataset size metric'
    });

    return recommendations.slice(0, 8);
  }

  // ---------------- HELPERS ----------------
  createKPI(name, type, field, category, priority) {
    return {
      name: this.formatColumnName(name),
      type,
      field,
      category,
      priority,
      description: `${type} of ${field}`,
      reasoning: `${field} is important for ${category} insights`
    };
  }

  formatColumnName(col) {
    return col
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }
}

module.exports = DataAnalyzer;
