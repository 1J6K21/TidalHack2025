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

  // Total pages = materials page + step pages + congratulation page
  const totalPages = 1 + steps.length + 1;

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

  // Realistic notebook page flip animation
  const pageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      rotateY: direction > 0 ? -15 : 15,
      opacity: 0,
      scale: 0.95,
      transformOrigin: direction > 0 ? "left center" : "right center"
    }),
    center: {
      x: "0%",
      rotateY: 0,
      opacity: 1,
      scale: 1,
      transformOrigin: "center center",
      zIndex: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      rotateY: direction < 0 ? -15 : 15,
      opacity: 0,
      scale: 0.95,
      transformOrigin: direction < 0 ? "left center" : "right center",
      zIndex: 0
    })
  };

  const pageTransition = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8
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
      {/* Page Header - Compact */}
      <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-t-2xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl mb-2 border border-white border-opacity-30">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-1">Materials Overview</h2>
          <p className="text-purple-100 text-sm">Everything you need for {projectName}</p>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs text-purple-100">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {materials.length} items
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              {formatCurrency(materials.reduce((sum, material) => sum + material.totalPrice, 0))} total
            </span>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full">
          {materials.map((material) => (
            <div
              key={material.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 ${
                material.amazonURL ? 'cursor-pointer hover:scale-105 hover:-translate-y-1' : ''
              }`}
              onClick={() => handleMaterialClick(material)}
            >
              {/* Material Image */}
              <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200">
                <ProgressiveImage
                  src={material.imageURL}
                  alt={material.name}
                  width="100%"
                  height="8rem"
                  className="w-full h-full object-cover"
                  skeletonClassName="h-32"
                  loading="lazy"
                />

                {/* Amazon Link Indicator */}
                {material.amazonURL && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M.045 18.02c9.715.522 16.728 1.227 16.728 1.227.329-2.52-.49-4.427-.49-4.427-5.913-1.227-16.238-1.227-16.238-1.227s-.329 1.848 0 4.427zm8.953-8.515c0-6.09-2.47-8.515-5.913-8.515-2.47 0-4.427 1.227-4.427 1.227s1.227 3.697 1.227 7.288c0 2.47.49 3.697.49 3.697 2.47-.49 5.913-.49 8.623-.49v-3.207zm6.09 4.427c0-1.227-.49-2.47-.49-2.47-1.227 0-2.47.49-2.47.49v8.515s1.227.49 2.47.49c1.227 0 .49-1.227.49-2.47v-4.555zm8.515-4.427c0-6.09-2.47-8.515-5.913-8.515-2.47 0-4.427 1.227-4.427 1.227s1.227 3.697 1.227 7.288c0 2.47.49 3.697.49 3.697 2.47-.49 5.913-.49 8.623-.49v-3.207z"/>
                      </svg>
                      Buy
                    </div>
                  </div>
                )}

                {/* Quantity badge */}
                <div className="absolute bottom-2 left-2">
                  <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm">
                    Qty: {material.quantity}
                  </div>
                </div>
              </div>

              {/* Material Details */}
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 leading-tight">
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
      {/* Step Header - Fixed at top */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl w-12 h-12 flex items-center justify-center font-bold text-xl border border-white border-opacity-30">
              {step.stepNumber}
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">{step.title}</h2>
              <div className="flex items-center gap-3 text-blue-100 text-sm">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {step.estimatedTime} min
                </span>
                {step.tools.length > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {step.tools.length} tools
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="text-right">
            <div className="text-blue-100 text-xs">Step</div>
            <div className="text-lg font-bold">{step.stepNumber}</div>
            <div className="text-blue-200 text-xs">of {steps.length}</div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0">
        {/* Step Image */}
        <div className="lg:w-3/5 flex-shrink-0">
          <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden h-64 lg:h-full shadow-inner">
            <ProgressiveImage
              src={step.imageURL}
              alt={`Step ${step.stepNumber}: ${step.title}`}
              width="100%"
              height="100%"
              className="w-full h-full object-cover rounded-xl"
              skeletonClassName="h-full rounded-xl"
              loading="eager"
              retryable={true}
            />
            
            {/* Image overlay with step number */}
            <div className="absolute top-3 left-3 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
              {step.stepNumber}
            </div>
          </div>
        </div>

        {/* Step Details */}
        <div className="lg:w-2/5 flex flex-col space-y-3 min-h-0">
          {/* Description Card */}
          <div className="bg-white rounded-xl shadow-lg p-4 flex-1 border border-gray-100 min-h-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">Instructions</h3>
            </div>
            <p className="text-gray-700 leading-relaxed text-sm">{step.description}</p>
            
            {step.notes && (
              <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-2 h-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-800 mb-1">💡 Pro Tip</p>
                    <p className="text-xs text-amber-700 leading-relaxed">{step.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tools Required */}
          {step.tools.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900">Tools Needed</h3>
              </div>
              <div className="space-y-2">
                {step.tools.map((tool, index) => {
                  // Find matching material for this tool
                  const matchingMaterial = materials.find(material => 
                    material.name.toLowerCase().includes(tool.toLowerCase()) ||
                    tool.toLowerCase().includes(material.name.toLowerCase().split(' ')[0])
                  );
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 transition-colors duration-200"
                    >
                      {/* Material image if found */}
                      {matchingMaterial ? (
                        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                          <ProgressiveImage
                            src={matchingMaterial.imageURL}
                            alt={matchingMaterial.name}
                            width="32"
                            height="32"
                            className="w-full h-full object-cover"
                            skeletonClassName="w-8 h-8"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      )}
                      <span className="text-gray-800 font-medium flex-1">{tool}</span>
                      {matchingMaterial && (
                        <span className="text-xs text-gray-500">
                          {formatCurrency(matchingMaterial.unitPrice)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCongratulationPage = () => (
    <div className="h-full flex flex-col items-center justify-center text-center">
      {/* Celebration Animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="mb-8"
      >
        <div className="relative">
          {/* Trophy Icon */}
          <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl">
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          
          {/* Confetti Animation */}
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-4 -right-4 w-8 h-8 text-yellow-400"
          >
            ✨
          </motion.div>
          <motion.div
            animate={{ 
              rotate: [360, 0],
              scale: [1, 1.3, 1]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
              delay: 0.5
            }}
            className="absolute -bottom-2 -left-4 w-6 h-6 text-yellow-300"
          >
            🎉
          </motion.div>
          <motion.div
            animate={{ 
              y: [-10, 10, -10],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-4 h-4 text-yellow-500"
          >
            ⭐
          </motion.div>
        </div>
      </motion.div>

      {/* Congratulation Text */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Congratulations! 🎊
        </h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">
          You've completed your {projectName}!
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          You've successfully followed all {steps.length} steps and should now have a beautiful, 
          handcrafted {projectName.toLowerCase()}. Great job on completing this DIY project!
        </p>
      </motion.div>

      {/* Project Summary */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 mb-8 max-w-md w-full"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Project Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Steps Completed:</span>
            <span className="font-semibold text-green-600">{steps.length}/{steps.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Materials Used:</span>
            <span className="font-semibold text-blue-600">{materials.length} items</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Investment:</span>
            <span className="font-semibold text-purple-600">
              {formatCurrency(materials.reduce((sum, material) => sum + material.totalPrice, 0))}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-gray-600">Estimated Time:</span>
            <span className="font-semibold text-orange-600">
              {steps.reduce((sum, step) => sum + step.estimatedTime, 0)} minutes
            </span>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <button
          onClick={() => setCurrentPage(0)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Review Instructions
        </button>
        
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back to Home
        </button>
      </motion.div>

      {/* Share Achievement */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-sm text-gray-500 mb-3">Share your achievement!</p>
        <div className="flex justify-center gap-3">
          <button className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors duration-200">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
            </svg>
          </button>
          <button className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-200">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
          <button className="w-10 h-10 bg-pink-500 text-white rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors duration-200">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
            </svg>
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col max-h-screen">
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
        <div className="flex-1 relative perspective-1000">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              className="absolute inset-0 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
              style={{
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                background: `
                  radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.02) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.02) 0%, transparent 50%),
                  radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.02) 0%, transparent 50%),
                  linear-gradient(135deg, #ffffff 0%, #fafafa 100%)
                `
              }}
            >
              {/* Subtle paper texture overlay */}
              <div 
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(
                      0deg,
                      transparent,
                      transparent 2px,
                      rgba(0,0,0,0.01) 2px,
                      rgba(0,0,0,0.01) 4px
                    ),
                    repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent 2px,
                      rgba(0,0,0,0.01) 2px,
                      rgba(0,0,0,0.01) 4px
                    )
                  `
                }}
              />
              
              {/* Page content */}
              <div className="relative z-10 h-full">
                {currentPage === 0 
                  ? renderMaterialsPage() 
                  : currentPage === totalPages - 1 
                  ? renderCongratulationPage()
                  : renderStepPage(steps[currentPage - 1])}
              </div>
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
              {currentPage === 0 
                ? '(Materials Overview)' 
                : currentPage === totalPages - 1 
                ? '(Congratulations!)' 
                : `(Step ${currentPage})`}
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