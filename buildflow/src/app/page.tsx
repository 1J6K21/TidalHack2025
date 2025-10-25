'use client';

import { useState } from 'react';
import Homepage from '../components/Homepage';
import TextInput from '../components/TextInput';
import MaterialsView from '../components/MaterialsView';
import FlipbookView from '../components/FlipbookView';
import { AppView } from '../types';
import { useManualGeneration } from '../hooks/useManualGeneration';
import { useAppContext, useAppMode, useCurrentView } from '../contexts/AppContext';
import { dataService } from '../services/dataService';

export default function Home() {
  const [loadedManualData, setLoadedManualData] = useState<{
    steps: any[];
    materials: any[];
    projectName: string;
    totalPrice: number;
  } | null>(null);
  
  // Use the app context for state management
  const { setView, setCurrentManual, setError, resetState } = useAppContext();
  const appMode = useAppMode();
  const currentView = useCurrentView();

  // Use the manual generation hook
  const { state: generationState, generateManual, reset: resetGeneration } = useManualGeneration();

  const handleOpenManual = async (manualId: string) => {
    console.log('🔍 Opening manual:', manualId);
    
    try {
      // Find the manual from the loaded manuals list
      console.log('🔍 Loading manuals for mode:', appMode);
      const manuals = await dataService.loadManuals(appMode);
      console.log('🔍 Available manuals:', manuals.map(m => ({ id: m.id, name: m.productName })));
      
      const manual = manuals.find(m => m.id === manualId);
      console.log('🔍 Found manual:', manual);
      
      if (!manual) {
        throw new Error(`Manual not found: ${manualId}`);
      }
      
      // Load the manual data using the data service
      console.log('🔍 Loading manual data for:', manual.id);
      const { steps, materials } = await dataService.loadManualData(manual, appMode);
      console.log('🔍 Loaded data:', { stepsCount: steps.length, materialsCount: materials.length });
      
      // Set the loaded manual data
      const manualData = {
        steps,
        materials,
        projectName: manual.productName,
        totalPrice: manual.totalPrice
      };
      
      setLoadedManualData(manualData);
      setCurrentManual(manual);
      setView(AppView.FLIPBOOK);
    } catch (error) {
      console.error('❌ Error loading manual:', error);
      setError({
        type: 'firebase' as any,
        message: error instanceof Error ? error.message : 'Failed to load manual',
        timestamp: new Date(),
        retryable: true
      });
    }
  };

  const handleCreateNew = () => {
    setView(AppView.INPUT);
    setLoadedManualData(null);
    resetGeneration();
  };

  const handleCancelInput = () => {
    setView(AppView.HOME);
    resetGeneration();
  };

  const handleSubmitIdea = async (productIdea: string) => {
    console.log('🚀 Submitting product idea:', productIdea, 'in mode:', appMode);

    // Use the existing manual generation hook which already handles demo/live mode
    const result = await generateManual({
      productIdea,
      userId: 'demo-user' // TODO: Replace with actual user ID when auth is implemented
    });

    if (result) {
      console.log('✅ Manual generation completed:', {
        manualId: result.manualId,
        projectName: result.projectName,
        stepsCount: result.steps.length,
        materialsCount: result.materials.length,
        totalPrice: result.totalPrice
      });
      
      // Navigate to materials view with generated data
      setView(AppView.MATERIALS);
    } else {
      console.log('❌ Manual generation failed');
    }
    // Error handling is managed by the hook
  };

  const handleMaterialsConfirm = () => {
    console.log('Materials confirmed, navigating to flipbook...');
    setView(AppView.FLIPBOOK);
  };

  const handleMaterialsCancel = () => {
    setView(AppView.HOME);
    setLoadedManualData(null);
    resetGeneration();
    resetState();
  };

  // Render current view
  switch (currentView) {
    case AppView.HOME:
      return (
        <Homepage 
          onOpenManual={handleOpenManual}
          onCreateNew={handleCreateNew}
        />
      );

    case AppView.INPUT:
      return (
        <TextInput
          onSubmit={handleSubmitIdea}
          onCancel={handleCancelInput}
          mode={appMode}
          loading={generationState.isGenerating}
          error={generationState.error}
        />
      );

    case AppView.MATERIALS:
      return (
        <MaterialsView
          materials={generationState.lastResult?.materials || []}
          totalPrice={generationState.lastResult?.totalPrice || 0}
          onConfirm={handleMaterialsConfirm}
          onCancel={handleMaterialsCancel}
          loading={generationState.isGenerating}
          error={generationState.error}
        />
      );

    case AppView.FLIPBOOK:
      // Use loaded manual data if available, otherwise use generated data
      const flipbookData = loadedManualData || {
        steps: generationState.lastResult?.steps || [],
        materials: generationState.lastResult?.materials || [],
        projectName: generationState.lastResult?.projectName || 'DIY Project',
        totalPrice: generationState.lastResult?.totalPrice || 0
      };
      
      return (
        <FlipbookView
          steps={flipbookData.steps}
          materials={flipbookData.materials}
          projectName={flipbookData.projectName}
          onCancel={() => {
            setView(AppView.HOME);
            setLoadedManualData(null);
            resetState();
          }}
          loading={generationState.isGenerating}
          error={generationState.error}
        />
      );

    default:
      // Placeholder for other views
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Coming Soon
            </h2>
            <p className="text-gray-600 mb-6">
              This view will be implemented in upcoming tasks.
            </p>
            <button
              onClick={() => setView(AppView.HOME)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
  }
}