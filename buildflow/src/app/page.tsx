'use client';

import { useState } from 'react';
import Homepage from '../components/Homepage';
import TextInput from '../components/TextInput';
import MaterialsView from '../components/MaterialsView';
import { AppMode, AppView } from '../types';
import { useManualGeneration } from '../hooks/useManualGeneration';

export default function Home() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  
  // Determine app mode based on environment and API key configuration
  const [appMode] = useState<AppMode>(() => {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const hasGeminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY && 
                        process.env.NEXT_PUBLIC_GEMINI_API_KEY !== 'your_gemini_api_key';
    
    // Use demo mode if explicitly set or if Gemini API key is not configured
    return (isDemoMode || !hasGeminiKey) ? AppMode.DEMO : AppMode.LIVE;
  });

  // Use the manual generation hook
  const { state: generationState, generateManual, reset: resetGeneration } = useManualGeneration();

  const handleOpenManual = (manualId: string) => {
    // TODO: Navigate to manual view (will be implemented in later tasks)
    console.log('Opening manual:', manualId);
  };

  const handleCreateNew = () => {
    setCurrentView(AppView.INPUT);
    resetGeneration();
  };

  const handleCancelInput = () => {
    setCurrentView(AppView.HOME);
    resetGeneration();
  };

  const handleSubmitIdea = async (productIdea: string) => {
    console.log('Submitting product idea:', productIdea);

    const result = await generateManual({
      productIdea,
      userId: 'demo-user' // TODO: Replace with actual user ID when auth is implemented
    });

    if (result) {
      console.log('Manual generation completed:', result);
      
      // Navigate to materials view with generated data
      setCurrentView(AppView.MATERIALS);
    }
    // Error handling is managed by the hook
  };

  const handleMaterialsConfirm = () => {
    // TODO: Navigate to flipbook view (will be implemented in later tasks)
    console.log('Materials confirmed, navigating to flipbook...');
    alert('Materials confirmed! Flipbook view will be implemented in later tasks.');
    setCurrentView(AppView.HOME);
  };

  const handleMaterialsCancel = () => {
    setCurrentView(AppView.HOME);
    resetGeneration();
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
          materials={generationState.result?.materials || []}
          totalPrice={generationState.result?.totalPrice || 0}
          onConfirm={handleMaterialsConfirm}
          onCancel={handleMaterialsCancel}
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
              onClick={() => setCurrentView(AppView.HOME)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
  }
}