'use client';

import React, { useState, useEffect } from 'react';
import { Manual, LoadingState, ErrorState } from '../types';
import { fetchManualsList, prefetchManualDetails } from '../services/manualDataService';
import ManualCard from './ManualCard';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface HomepageProps {
  onOpenManual: (manualId: string) => void;
  onCreateNew: () => void;
}

const Homepage: React.FC<HomepageProps> = ({ onOpenManual, onCreateNew }) => {
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<ErrorState | null>(null);

  useEffect(() => {
    loadManuals();
  }, []);

  const loadManuals = async () => {
    setLoadingState(LoadingState.LOADING);
    setError(null);

    // Use hardcoded demo data for testing
    const demoManuals: Manual[] = [
      {
        id: 'keyboard-build-2024',
        productName: 'Custom Mechanical Keyboard',
        thumbnailURL: 'https://cdn.thewirecutter.com/wp-content/media/2025/03/BEST-MECHANICAL-KEYBOARDS-2048px-0673.jpg',
        firebaseManualPath: 'manuals/demo/keyboard',
        firebaseImagePath: 'manuals/demo/keyboard/images',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
        totalPrice: 189.99,
        stepCount: 8
      },
      {
        id: 'lamp-build-2024',
        productName: 'Modern Table Lamp',
        thumbnailURL: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcRkN3TPaZbJOved98R8ZlCkIN7xFFPHHgLcDkYtYs5vsogHjA1fwjqjl6nW_jgrqEEwd40N2R-BE-0BKGugGirpG8xaseztkqPrPAeJZ-vvYQ3o5DXRJSPl7E0&usqp=CAc&fit=crop',
        firebaseManualPath: 'manuals/demo/lamp',
        firebaseImagePath: 'manuals/demo/lamp/images',
        createdAt: new Date('2024-01-16T14:20:00.000Z'),
        totalPrice: 45.50,
        stepCount: 5
      }
    ];

    // Simulate loading delay
    setTimeout(() => {
      setManuals(demoManuals);
      setLoadingState(LoadingState.SUCCESS);
    }, 1000);
  };

  const handleRetry = () => {
    loadManuals();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            <span className="text-blue-600">Manny</span>
          </h1>
          <p className="text-2xl text-gray-700 mb-2 font-medium">
            vibe build
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate and visualize DIY projects with AI-powered instructions and materials lists.
            Create step-by-step manuals for any project idea.
          </p>
        </div>

        {/* New Project Button */}
        <div className="text-center mb-12">
          <button
            onClick={onCreateNew}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg transition-colors duration-200 text-lg"
          >
            + New Project
          </button>
        </div>

        {/* Manuals Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Browse Existing Manuals
          </h2>

          {/* Loading State */}
          {loadingState === LoadingState.LOADING && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {/* Error State */}
          {loadingState === LoadingState.ERROR && error && (
            <div className="max-w-md mx-auto">
              <ErrorMessage
                error={error}
                onRetry={error.retryable ? handleRetry : undefined}
              />
            </div>
          )}

          {/* Success State - Manuals Grid */}
          {loadingState === LoadingState.SUCCESS && (
            <>
              {manuals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {manuals.map((manual) => (
                    <ManualCard
                      key={manual.id}
                      manual={manual}
                      onOpenManual={onOpenManual}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      No Manuals Available
                    </h3>
                    <p className="text-gray-600 mb-6">
                      No demo manuals found. Create your first project to get started!
                    </p>
                    <button
                      onClick={onCreateNew}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                    >
                      Create First Project
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Homepage;