'use client';

import React, { useState, useEffect } from 'react';
import { Manual, LoadingState, ErrorState } from '../types';
import { useAppMode, useAppContext } from '../contexts/AppContext';
import { dataService } from '../services/dataService';

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
  
  const appMode = useAppMode();
  const { setLoading } = useAppContext();

  useEffect(() => {
    loadManuals();
  }, [appMode]); // Reload when mode changes

  const loadManuals = async () => {
    console.log('🔍 Homepage: Loading manuals in mode:', appMode);
    setLoadingState(LoadingState.LOADING);
    setLoading('manuals', LoadingState.LOADING);
    setError(null);

    try {
      const manualsData = await dataService.loadManuals(appMode);
      console.log('✅ Homepage: Loaded manuals:', manualsData);
      setManuals(manualsData);
      setLoadingState(LoadingState.SUCCESS);
      setLoading('manuals', LoadingState.SUCCESS);
    } catch (err) {
      console.error('❌ Homepage: Error loading manuals:', err);
      const errorState: ErrorState = {
        type: 'firebase' as any,
        message: err instanceof Error ? err.message : 'Failed to load manuals',
        timestamp: new Date(),
        retryable: true
      };
      setError(errorState);
      setLoadingState(LoadingState.ERROR);
      setLoading('manuals', LoadingState.ERROR);
    }
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
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
            Generate and visualize DIY projects with AI-powered instructions and materials lists.
            Create step-by-step manuals for any project idea.
          </p>
          
          {/* Mode Indicator */}
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <div className={`w-2 h-2 rounded-full mr-2 ${appMode === 'demo' ? 'bg-orange-400' : 'bg-green-400'}`}></div>
            {appMode === 'demo' ? 'Demo Mode' : 'Live Mode'}
          </div>
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
                {...(error.retryable && { onRetry: handleRetry })}
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