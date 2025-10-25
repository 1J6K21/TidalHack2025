'use client';

import { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { AppMode } from '../../types';

export default function TestPage() {
  const [manuals, setManuals] = useState<any[]>([]);
  const [selectedManual, setSelectedManual] = useState<any>(null);
  const [manualData, setManualData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadManuals();
  }, []);

  const loadManuals = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Test: Loading manuals...');
      const result = await dataService.loadManuals(AppMode.DEMO);
      console.log('✅ Test: Loaded manuals:', result);
      setManuals(result);
    } catch (err) {
      console.error('❌ Test: Error loading manuals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load manuals');
    } finally {
      setLoading(false);
    }
  };

  const loadManualData = async (manual: any) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Test: Loading manual data for:', manual.id);
      const result = await dataService.loadManualData(manual, AppMode.DEMO);
      console.log('✅ Test: Loaded manual data:', result);
      setManualData(result);
      setSelectedManual(manual);
    } catch (err) {
      console.error('❌ Test: Error loading manual data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load manual data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Data Service Test</h1>
        
        {loading && <div className="mb-4 text-blue-600">Loading...</div>}
        {error && <div className="mb-4 text-red-600">Error: {error}</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Manuals List */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Available Manuals ({manuals.length})</h2>
            <div className="space-y-2">
              {manuals.map((manual) => (
                <div key={manual.id} className="border p-3 rounded">
                  <h3 className="font-medium">{manual.productName}</h3>
                  <p className="text-sm text-gray-600">ID: {manual.id}</p>
                  <p className="text-sm text-gray-600">Price: ${manual.totalPrice}</p>
                  <button
                    onClick={() => loadManualData(manual)}
                    className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Load Data
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Data */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Manual Data</h2>
            {selectedManual ? (
              <div>
                <h3 className="font-medium mb-2">{selectedManual.productName}</h3>
                {manualData ? (
                  <div>
                    <p className="mb-2">Steps: {manualData.steps.length}</p>
                    <p className="mb-4">Materials: {manualData.materials.length}</p>
                    
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Steps:</h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {manualData.steps.map((step: any, index: number) => (
                          <div key={index} className="text-sm border-l-2 border-blue-200 pl-2">
                            {step.stepNumber}. {step.title}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Materials:</h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {manualData.materials.map((material: any, index: number) => (
                          <div key={index} className="text-sm border-l-2 border-green-200 pl-2">
                            {material.name} - ${material.totalPrice}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Click "Load Data" to see manual details</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Select a manual to view its data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}