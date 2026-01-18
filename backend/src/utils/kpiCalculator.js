const calculateKPI = (data, kpiConfig) => {
  const { type, field, filters } = kpiConfig;
  
  let filteredData = data;
  if (filters && Object.keys(filters).length > 0) {
    filteredData = data.filter(row => {
      return Object.keys(filters).every(key => row[key] === filters[key]);
    });
  }
  
  switch (type) {
    case 'SUM':
      return filteredData.reduce((sum, row) => sum + (parseFloat(row[field]) || 0), 0);
    
    case 'AVG':
      const sum = filteredData.reduce((sum, row) => sum + (parseFloat(row[field]) || 0), 0);
      return filteredData.length > 0 ? sum / filteredData.length : 0;
    
    case 'COUNT':
      return filteredData.length;
    
    case 'MIN':
      const values = filteredData.map(row => parseFloat(row[field]) || 0);
      return values.length > 0 ? Math.min(...values) : 0;
    
    case 'MAX':
      const maxValues = filteredData.map(row => parseFloat(row[field]) || 0);
      return maxValues.length > 0 ? Math.max(...maxValues) : 0;
    
    case 'PERCENT_CHANGE':
      if (filteredData.length < 2) return 0;
      const current = parseFloat(filteredData[filteredData.length - 1][field]) || 0;
      const previous = parseFloat(filteredData[filteredData.length - 2][field]) || 0;
      return previous !== 0 ? ((current - previous) / previous) * 100 : 0;
    
    default:
      throw new Error('Invalid KPI type');
  }
};

module.exports = { calculateKPI };