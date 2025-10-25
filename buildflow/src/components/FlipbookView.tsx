'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Step, Material, ErrorState } from '../types';
import { formatCurrency } from '../utils/pricing';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import ProgressiveImage from './ProgressiveImage';

interface FlipbookViewProps {
  steps: Step[];
  materials: Material[];
  projectName: string;
  onCancel: () => void;
  loading?: boolean;
  error?: ErrorState | null;
}

const FlipbookView: React.FC<FlipbookViewProps> = ({
  steps,
  materials,
  projectName,
  onCancel,
  loading = false,
  error = null
}) => {
  // Debug logging
  console.log('🔍 FlipbookView received data:', {
    projectName,
    stepsCount: steps.length,
    materialsCount: materials.length,
    loading,
    error: error?.message
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([0]));
  const [navigationHistory, setNavigationHistory] = useState<number[]>([0]);

  // Total pages = materials page + step pages
  const totalPages = 1 + steps.length;

  // State persistence key
  const stateKey = `flipbook-${projectName.replace(/\s+/g, '-').toLowerCase()}`;

  // Load saved state on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(stateKey);
      if (savedState) {
        const { page, visited, history } = JSON.parse(savedState);
        if (typeof page === 'number' && page >= 0 && page < totalPages) {
          setCurrentPage(page);
          setVisitedPages(new Set(visited || [page]));
          setNavigationHistory(history || [page]);
        }
      }
    } catch (error) {
      console.warn('Failed to load flipbook state:', error);
    }
  }, [stateKey, totalPages]);

  // Save state when it changes
  useEffect(() => {
    try {
      const state = {
        page: currentPage,
        visited: Array.from(visitedPages),
        history: navigationHistory
      };
      localStorage.setItem(stateKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save flipbook state:', error);
    }
  }, [currentPage, visitedPages, navigationHistory, stateKey]);



  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      const nextPage = currentPage + 1;
      setDirection(1);
      setCurrentPage(nextPage);
      setVisitedPages(prev => new Set([...prev, nextPage]));
      setNavigationHistory(prev => [...prev, nextPage]);
    }
  }, [currentPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 0) {
      const prevPage = currentPage - 1;
      setDirection(-1);
      setCurrentPage(prevPage);
      setVisitedPages(prev => new Set([...prev, prevPage]));
      setNavigationHistory(prev => [...prev, prevPage]);
    }
  }, [currentPage]);

  const goToPage = useCallback((pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < totalPages && pageIndex !== currentPage) {
      setDirection(pageIndex > currentPage ? 1 : -1);
      setCurrentPage(pageIndex);
      setVisitedPages(prev => new Set([...prev, pageIndex]));
      setNavigationHistory(prev => [...prev, pageIndex]);
    }
  }, [currentPage, totalPages]);

  const goBack = useCallback(() => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop(); // Remove current page
      const previousPage = newHistory[newHistory.length - 1];
      
      setDirection(previousPage < currentPage ? -1 : 1);
      setCurrentPage(previousPage);
      setNavigationHistory(newHistory);
    }
  }, [navigationHistory, currentPage]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent navigation if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          goToPreviousPage();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ': // Spacebar
          event.preventDefault();
          goToNextPage();
          break;
        case 'Home':
          event.preventDefault();
          goToPage(0);
          break;
        case 'End':
          event.preventDefault();
          goToPage(totalPages - 1);
          break;
        case 'Escape':
          event.preventDefault();
          onCancel();
          break;
        default:
          // Handle number keys for direct page navigation
          const pageNumber = parseInt(event.key);
          if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
            event.preventDefault();
            goToPage(pageNumber - 1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages, goToPreviousPage, goToNextPage, goToPage, onCancel]);



  const handleMaterialClick = (material: Material) => {
    if (material.amazonURL) {
      window.open(material.amazonURL, '_blank', 'noopener,noreferrer');
    }
  };

  // Animation variants for page transitions
  const pageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const pageTransition = {
    x: { type: "spring" as const, stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto">
          <ErrorMessage error={error} />
        </div>
      </div>
    );
  }

  const renderMaterialsPage = () => (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Materials Overview</h2>
        <p className="text-gray-600">Required materials for {projectName}</p>
      </div>

      {/* Materials Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {materials.map((material) => (
            <div
              key={material.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 ${
                material.amazonURL ? 'cursor-pointer hover:scale-105' : ''
              }`}
              onClick={() => handleMaterialClick(material)}
            >
              {/* Material Image */}
              <div className="relative h-24 bg-gray-200">
                <ProgressiveImage
                  src={material.imageURL}
                  alt={material.name}
                  width="100%"
                  height="6rem"
                  className="w-full h-full object-cover"
                  skeletonClassName="h-24"
                  loading="lazy"
                />

                {/* Amazon Link Indicator */}
                {material.amazonURL && (
                  <div className="absolute top-1 right-1">
                    <div className="bg-orange-500 text-white text-xs px-1 py-0.5 rounded-full font-semibold">
                      Amazon
                    </div>
                  </div>
                )}
              </div>

              {/* Material Details */}
              <div className="p-3">
                <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                  {material.name}
                </h4>
                
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Qty: {material.quantity}</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(material.totalPrice)}
                  </span>
                </div>

                {material.category && (
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                    {material.category}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Total Cost Summary */}
        <div className="bg-white rounded-lg shadow-md p-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">Total Cost:</span>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(materials.reduce((sum, material) => sum + material.totalPrice, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepPage = (step: Step) => (
    <div className="h-full flex flex-col">
      {/* Step Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
            {step.stepNumber}
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h2>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {step.estimatedTime} min
          </span>
          {step.tools.length > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {step.tools.length} tools
            </span>
          )}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* Step Image */}
        <div className="lg:w-1/2">
          <div className="relative bg-gray-200 rounded-lg overflow-hidden h-64 lg:h-full">
            <ProgressiveImage
              src={step.imageURL}
              alt={`Step ${step.stepNumber}: ${step.title}`}
              width="100%"
              height="100%"
              className="w-full h-full object-cover rounded-lg"
              skeletonClassName="h-full rounded-lg"
              loading="eager"
              retryable={true}
            />
          </div>
        </div>

        {/* Step Details */}
        <div className="lg:w-1/2 flex flex-col">
          {/* Description */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-4 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
            <p className="text-gray-700 leading-relaxed">{step.description}</p>
            
            {step.notes && (
              <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Note:</p>
                    <p className="text-sm text-yellow-700">{step.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tools Required */}
          {step.tools.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tools Required</h3>
              <div className="flex flex-wrap gap-2">
                {step.tools.map((tool, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">{projectName}</h1>
          </div>

          {/* Product Legend */}
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-md px-4 py-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">{projectName}</span>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              className="absolute inset-0 bg-white rounded-lg shadow-lg p-8"
            >
              {currentPage === 0 ? renderMaterialsPage() : renderStepPage(steps[currentPage - 1])}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between mt-6">
          {/* Left Navigation */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {/* Back Button (History) */}
            {navigationHistory.length > 1 && (
              <button
                onClick={goBack}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
                title="Go back in navigation history"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Back
              </button>
            )}
          </div>

          {/* Page Indicators */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => goToPage(index)}
                className={`relative w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentPage
                    ? 'bg-blue-600 scale-125'
                    : visitedPages.has(index)
                    ? 'bg-blue-300 hover:bg-blue-400'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                title={`Go to ${index === 0 ? 'Materials' : `Step ${index}`}`}
              >
                {/* Progress indicator for visited pages */}
                {visitedPages.has(index) && index !== currentPage && (
                  <div className="absolute inset-0 rounded-full border-2 border-blue-600 opacity-50"></div>
                )}
              </button>
            ))}
          </div>

          {/* Right Navigation */}
          <div className="flex items-center gap-2">
            {/* Next Button */}
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages - 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentPage === totalPages - 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              Next
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Jump to End Button */}
            {currentPage < totalPages - 2 && (
              <button
                onClick={() => goToPage(totalPages - 1)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
                title="Jump to last step"
              >
                Last
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Page Info and Keyboard Shortcuts */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">
              Page {currentPage + 1} of {totalPages}
            </span>
            <span className="ml-2">
              {currentPage === 0 ? '(Materials Overview)' : `(Step ${currentPage})`}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="hidden sm:inline">Use ← → arrow keys to navigate</span>
            <span className="hidden md:inline">Press ESC to exit</span>
            <div className="text-right">
              <div>Progress: {Math.round(((currentPage + 1) / totalPages) * 100)}%</div>
              <div>Visited: {visitedPages.size}/{totalPages} pages</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlipbookView;