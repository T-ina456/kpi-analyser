import React, { useState, useEffect } from 'react';
import { Upload, Plus, BarChart3, Trash2, RefreshCw, Sparkles } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as kpiService from './services/kpiService';
import KPIRecommendations from './components/KPIRecommendations';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [showKPIBuilder, setShowKPIBuilder] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      loadKPIs(selectedDataset.id);
    }
  }, [selectedDataset]);

  const loadDatasets = async () => {
    try {
      const response = await kpiService.getDatasets();
      setDatasets(response.data);
      if (response.data.length > 0 && !selectedDataset) {
        setSelectedDataset(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading datasets:', error);
    }
  };

  const loadKPIs = async (datasetId) => {
    try {
      const response = await kpiService.getKPIs(datasetId);
      setKpis(response.data);
    } catch (error) {
      console.error('Error loading KPIs:', error);
    }
  };

  const handleApplyRecommendations = async (recommendations) => {
    try {
      await kpiService.applyRecommendations(selectedDataset.id, recommendations);
      await loadKPIs(selectedDataset.id);
      alert(`✅ Successfully created ${recommendations.length} KPIs!`);
    } catch (error) {
      alert('❌ Error applying recommendations: ' + (error.response?.data?.error || error.message));
      throw error;
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await kpiService.uploadFile(file, file.name.replace(/\.[^/.]+$/, ''));
      alert(`✅ File uploaded successfully! ${response.data.rowCount} rows imported.`);
      await loadDatasets();
      setActiveTab('dashboard');
    } catch (error) {
      alert('❌ Error uploading file: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleCreateKPI = async (kpiData) => {
    try {
      await kpiService.createKPI({
        ...kpiData,
        datasetId: selectedDataset.id
      });
      await loadKPIs(selectedDataset.id);
      setShowKPIBuilder(false);
      alert('✅ KPI created successfully!');
    } catch (error) {
      alert('❌ Error creating KPI: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCalculateKPIs = async () => {
    if (!selectedDataset) return;
    
    setCalculating(true);
    try {
      await kpiService.calculateAllKPIs(selectedDataset.id);
      await loadKPIs(selectedDataset.id);
      alert('✅ All KPIs calculated successfully!');
    } catch (error) {
      alert('❌ Error calculating KPIs: ' + (error.response?.data?.error || error.message));
    } finally {
      setCalculating(false);
    }
  };

  const handleDeleteKPI = async (kpiId) => {
    if (!confirm('Are you sure you want to delete this KPI?')) return;
    
    try {
      await kpiService.deleteKPI(kpiId);
      await loadKPIs(selectedDataset.id);
      alert('✅ KPI deleted successfully!');
    } catch (error) {
      alert('❌ Error deleting KPI: ' + (error.response?.data?.error || error.message));
    }
  };

  const KPICard = ({ kpi }) => {
    const formatValue = (value, type) => {
      if (value === null || value === undefined) return 'N/A';
      
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return value;
      
      if (type === 'SUM' || type === 'AVG') {
        return `$${numValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
      }
      return numValue.toLocaleString();
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">{kpi.name}</p>
            <h3 className="text-3xl font-bold text-gray-900">
              {formatValue(kpi.current_value, kpi.type)}
            </h3>
          </div>
          <div className="p-3 rounded-lg bg-blue-100">
            <BarChart3 className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Type: <span className="font-semibold">{kpi.type}</span>
          </span>
          <button
            onClick={() => handleDeleteKPI(kpi.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  const KPIBuilder = () => {
    const [formData, setFormData] = useState({
      name: '',
      type: 'SUM',
      field: '',
      filters: {}
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleCreateKPI(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <h3 className="text-xl font-bold mb-4">Create New KPI</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KPI Name*</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Total Revenue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aggregation Type*</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="SUM">SUM</option>
                <option value="AVG">AVERAGE</option>
                <option value="COUNT">COUNT</option>
                <option value="MIN">MINIMUM</option>
                <option value="MAX">MAXIMUM</option>
                <option value="PERCENT_CHANGE">% CHANGE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Field*</label>
              <input
                type="text"
                required
                value={formData.field}
                onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., revenue"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowKPIBuilder(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create KPI
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-blue-600" size={32} />
              <h1 className="text-2xl font-bold text-gray-900">KPI Analyser</h1>
            </div>
            {selectedDataset && (
              <div className="flex items-center gap-4">
                <select
                  value={selectedDataset?.id || ''}
                  onChange={(e) => {
                    const dataset = datasets.find(d => d.id === parseInt(e.target.value));
                    setSelectedDataset(dataset);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  {datasets.map(dataset => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload Data
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('kpis')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'kpis'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              KPI Manager
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8 border-2 border-dashed border-gray-300 text-center">
              <Upload className="mx-auto text-gray-400 mb-4" size={48} />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Data</h2>
              <p className="text-gray-600 mb-6">
                Support for CSV and Excel files up to 10MB
              </p>
              <label className="inline-block">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <span className={`px-6 py-3 rounded-md cursor-pointer inline-block transition-colors ${
                  uploading 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}>
                  {uploading ? 'Uploading...' : 'Choose File'}
                </span>
              </label>
            </div>

            {datasets.length > 0 && (
              <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Uploaded Datasets</h3>
                <div className="space-y-3">
                  {datasets.map(dataset => (
                    <div key={dataset.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{dataset.name}</p>
                        <p className="text-sm text-gray-600">{dataset.row_count} rows</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(dataset.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {selectedDataset ? (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                  <button
                    onClick={handleCalculateKPIs}
                    disabled={calculating}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                  >
                    <RefreshCw size={18} className={calculating ? 'animate-spin' : ''} />
                    {calculating ? 'Calculating...' : 'Calculate All KPIs'}
                  </button>
                </div>

                {kpis.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {kpis.map(kpi => (
                      <KPICard key={kpi.id} kpi={kpi} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <p className="text-gray-600 mb-4">No KPIs created yet for this dataset.</p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => setShowRecommendations(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 flex items-center gap-2"
                      >
                        <Sparkles size={18} />
                        Get AI Recommendations
                      </button>
                      <button
                        onClick={() => setActiveTab('kpis')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Create Manual KPI
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 mb-4">Please upload a dataset first.</p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Upload Data
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'kpis' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">KPI Manager</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRecommendations(true)}
                  disabled={!selectedDataset}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition-colors disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-400"
                >
                  <Sparkles size={18} />
                  Get AI Recommendations
                </button>
                <button
                  onClick={() => setShowKPIBuilder(true)}
                  disabled={!selectedDataset}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  <Plus size={18} />
                  Create Manual KPI
                </button>
              </div>
            </div>

            {selectedDataset ? (
              <>
                {kpis.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            KPI Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Field
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Current Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {kpis.map(kpi => (
                          <tr key={kpi.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {kpi.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {kpi.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {kpi.field}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                              {kpi.current_value !== null ? kpi.current_value : 'Not calculated'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleDeleteKPI(kpi.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <Sparkles className="mx-auto text-purple-600 mb-4" size={48} />
                    <p className="text-gray-600 mb-4">No KPIs yet. Let AI recommend the best metrics for your data!</p>
                    <button
                      onClick={() => setShowRecommendations(true)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 flex items-center gap-2 mx-auto"
                    >
                      <Sparkles size={20} />
                      Get AI Recommendations
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">Please select or upload a dataset first.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {showKPIBuilder && <KPIBuilder />}
      {showRecommendations && (
        <KPIRecommendations
          datasetId={selectedDataset.id}
          onApply={handleApplyRecommendations}
          onClose={() => setShowRecommendations(false)}
        />
      )}
    </div>
  );
}

export default App;