'use client';

import { useState } from 'react';
import Homepage from '../components/Homepage';

export default function Home() {
  const [currentView, setCurrentView] = useState<'home' | 'input'>('home');

  const handleOpenManual = (manualId: string) => {
    // TODO: Navigate to manual view (will be implemented in later tasks)
    console.log('Opening manual:', manualId);
  };

  const handleCreateNew = () => {
    // TODO: Navigate to input view (will be implemented in later tasks)
    console.log('Creating new project');
    setCurrentView('input');
  };

  if (currentView === 'home') {
    return (
      <Homepage 
        onOpenManual={handleOpenManual}
        onCreateNew={handleCreateNew}
      />
    );
  }

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
          onClick={() => setCurrentView('home')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
