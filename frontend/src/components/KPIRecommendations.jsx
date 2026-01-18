import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import * as kpiService from '../services/kpiService';

const KPIRecommendations = ({ datasetId, onApply, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [dashboardType, setDashboardType] = useState('general');
  const [selectedKPIs, setSelectedKPIs] = useState(new Set());
  const [analysis, setAnalysis] = useState(null);

  const dashboardTypes = [
    { value: 'general', label: 'General Analytics', icon: '📊' },
    { value: 'sales', label: 'Sales Dashboard', icon: '💰' },
    { value: 'finance', label: 'Financial Dashboard', icon: '💳' },
    { value: 'marketing', label: 'Marketing Dashboard', icon: '📈' },
    { value: 'operations', label: 'Operations Dashboard', icon: '⚙️' },
    { value: 'hr', label: 'HR Dashboard', icon: '👥' }
  ];

  useEffect(() => {
    loadRecommendations();
  }, [dashboardType]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const response = await kpiService.getRecommendations(datasetId, dashboardType);
      setRecommendations(response.data.recommendations);
      setAnalysis(response.data.analysis);
      
      // Select all high priority KPIs by default
      const highPriority = new Set(
        response.data.recommendations
          .map((r, index) => ({ r, index }))
          .filter(({ r }) => r.priority === 'high')
          .map(({ index }) => index)
      );
      setSelectedKPIs(highPriority);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      alert('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const toggleKPI = (index) => {
    const newSelected = new Set(selectedKPIs);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedKPIs(newSelected);
  };

  const handleApply = async () => {
    const selected = recommendations.filter((_, index) => selectedKPIs.has(index));
    
    if (selected.length === 0) {
      alert('Please select at least one KPI');
      return;
    }

    try {
      await onApply(selected);
      onClose();
    } catch (error) {
      alert('Failed to apply KPIs');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="text-purple-600" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Smart KPI Recommendations</h2>
                <p className="text-sm text-gray-600">100% Free - No API Required</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <XCircle size={24} />
            </button>
          </div>

          {analysis && (
            <div className="flex gap-4 text-sm text-gray-600 mb-4">
              <span>📋 {analysis.rowCount} rows</span>
              <span>📊 {analysis.columnCount} columns</span>
              <span>🎯 {analysis.detectedDomains.join(', ')}</span>
            </div>
          )}

          {/* Dashboard Type Selector */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {dashboardTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setDashboardType(type.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  dashboardType === type.value
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="text-2xl mb-1">{type.icon}</div>
                <div className="text-sm font-medium">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Recommendations List */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing your data...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  onClick={() => toggleKPI(index)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedKPIs.has(index)
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedKPIs.has(index)}
                          onChange={() => toggleKPI(index)}
                          className="w-5 h-5"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <h3 className="font-semibold text-lg">{rec.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                          {rec.priority}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {rec.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                      {rec.reasoning && (
                        <p className="text-sm text-gray-500 italic">💡 {rec.reasoning}</p>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        Field: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{rec.field}</span>
                        {rec.category && <span className="ml-3">Category: {rec.category}</span>}
                      </div>
                    </div>
                    {selectedKPIs.has(index) && (
                      <CheckCircle className="text-purple-600" size={24} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedKPIs.size} KPI{selectedKPIs.size !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={selectedKPIs.size === 0}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition-colors disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <TrendingUp size={18} />
                Apply {selectedKPIs.size} KPI{selectedKPIs.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIRecommendations;