'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppMode, ErrorState } from '../types';
import { validateProductIdea } from '../services/manualGeneration';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface TextInputProps {
  onSubmit: (productIdea: string) => void;
  onCancel: () => void;
  mode: AppMode;
  loading?: boolean;
  error?: ErrorState | null;
  disabled?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
  onSubmit,
  onCancel,
  mode,
  loading = false,
  error = null,
  disabled = false
}) => {
  const [productIdea, setProductIdea] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Validate input in real-time
  useEffect(() => {
    if (productIdea.trim().length > 0) {
      const validation = validateProductIdea(productIdea);
      setValidationErrors(validation.errors);
    } else {
      setValidationErrors([]);
    }
  }, [productIdea]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled || loading || isSubmitting) {
      return;
    }

    const trimmedIdea = productIdea.trim();
    
    // Final validation
    const validation = validateProductIdea(trimmedIdea);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Check if Gemini API key is configured (only in live mode)
    if (mode === AppMode.LIVE) {
      const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!geminiApiKey || geminiApiKey === 'your_gemini_api_key') {
        alert('Gemini API key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file.');
        return;
      }
    }

    setIsSubmitting(true);
    setValidationErrors([]);
    
    try {
      await onSubmit(trimmedIdea);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as any);
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const isFormDisabled = disabled || loading || isSubmitting;
  const hasValidationErrors = validationErrors.length > 0;
  const canSubmit = productIdea.trim().length > 0 && !hasValidationErrors && !isFormDisabled;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            <span className="text-blue-600">Create New Project</span>
          </h1>
          <p className="text-xl text-gray-700 mb-2">
            Describe your DIY project idea
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our AI will generate step-by-step instructions, materials list, and pricing for your project.
          </p>
        </div>

        {/* Demo Mode Notice */}
        {mode === AppMode.DEMO && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Demo Mode Active
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Demo mode active. Generated manuals will use sample data instead of live AI generation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <label htmlFor="productIdea" className="block text-sm font-medium text-gray-700 mb-2">
                Project Idea
              </label>
              <textarea
                ref={textareaRef}
                id="productIdea"
                name="productIdea"
                rows={4}
                value={productIdea}
                onChange={(e) => setProductIdea(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isFormDisabled}
                placeholder="Describe your DIY project idea... (e.g., 'A modern wooden desk lamp with adjustable brightness')"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                  hasValidationErrors 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300'
                } ${
                  isFormDisabled 
                    ? 'bg-gray-100 cursor-not-allowed' 
                    : 'bg-white'
                }`}
              />
              
              {/* Character count */}
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm text-gray-500">
                  {productIdea.length}/200 characters
                </div>
                <div className="text-sm text-gray-500">
                  Press Cmd+Enter to submit
                </div>
              </div>
            </div>

            {/* Validation Errors */}
            {hasValidationErrors && (
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Please fix the following issues:
                      </h3>
                      <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API Error */}
            {error && (
              <div className="mb-6">
                <ErrorMessage error={error} />
              </div>
            )}

            {/* Loading State */}
            {(loading || isSubmitting) && (
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        {isSubmitting ? 'Generating your manual...' : 'Processing...'}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        This may take 15-30 seconds
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={onCancel}
                disabled={isFormDisabled}
                className={`px-6 py-2 border border-gray-300 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isFormDisabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={!canSubmit}
                className={`px-8 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  canSubmit
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Generating...</span>
                  </div>
                ) : (
                  'Generate Manual'
                )}
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Be specific about materials, size, and style for better results.
              </p>
            </div>
          </form>
        </div>

        {/* Example Ideas */}
        <div className="max-w-2xl mx-auto mt-12">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            Need inspiration? Try these ideas:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'A floating wooden nightstand with hidden storage',
              'Modern concrete planters for succulents',
              'Adjustable laptop stand made from bamboo',
              'Industrial pipe bookshelf with wood shelves'
            ].map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => !isFormDisabled && setProductIdea(example)}
                disabled={isFormDisabled}
                className={`text-left p-4 border border-gray-200 rounded-lg transition-colors duration-200 ${
                  isFormDisabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
              >
                <p className="text-sm text-gray-700">{example}</p>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TextInput;