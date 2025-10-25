'use client';

import React, { useState } from 'react';
import { Material, ErrorState } from '../types';
import { formatCurrency } from '../utils/pricing';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface MaterialsViewProps {
  materials: Material[];
  totalPrice: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: ErrorState | null;
}

const MaterialsView: React.FC<MaterialsViewProps> = ({
  materials,
  totalPrice,
  onConfirm,
  onCancel,
  loading = false,
  error = null
}) => {
  // Debug logging
  console.log('🔍 MaterialsView received data:', {
    materialsCount: materials.length,
    totalPrice,
    loading,
    error: error?.message
  });

  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageLoad = (materialId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [materialId]: false }));
  };

  const handleImageError = (materialId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [materialId]: false }));
    setImageErrors(prev => ({ ...prev, [materialId]: true }));
  };

  const formatPrice = (price: number) => {
    return formatCurrency(price);
  };

  const handleMaterialClick = (material: Material) => {
    if (material.amazonURL) {
      window.open(material.amazonURL, '_blank', 'noopener,noreferrer');
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Materials & Pricing
          </h1>
          <p className="text-lg text-gray-600">
            Review the materials needed for your project and confirm to proceed
          </p>
        </div>

        {/* Materials Grid */}
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {materials.map((material) => (
              <div
                key={material.id}
                className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 ${
                  material.amazonURL ? 'cursor-pointer hover:scale-105' : ''
                }`}
                onClick={() => handleMaterialClick(material)}
              >
                {/* Material Image */}
                <div className="relative h-40 bg-gray-200">
                  {imageLoadingStates[material.id] !== false && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  
                  {!imageErrors[material.id] ? (
                    <img
                      src={material.imageURL}
                      alt={material.name}
                      className={`w-full h-full object-cover ${
                        imageLoadingStates[material.id] !== false ? 'opacity-0' : 'opacity-100'
                      } transition-opacity duration-300`}
                      onLoad={() => handleImageLoad(material.id)}
                      onError={() => handleImageError(material.id)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="text-center text-gray-500">
                        <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs">No image</p>
                      </div>
                    </div>
                  )}

                  {/* Amazon Link Indicator */}
                  {material.amazonURL && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                        Amazon
                      </div>
                    </div>
                  )}
                </div>

                {/* Material Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm line-clamp-2">
                    {material.name}
                  </h3>
                  
                  {material.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {material.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">
                      Qty: {material.quantity}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(material.unitPrice)}
                    </span>
                  </div>

                  <div className="border-t pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        Total:
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {formatPrice(material.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {material.category && (
                    <div className="mt-2">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {material.category}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Price Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Total Project Cost
              </h3>
              <p className="text-gray-600">
                {materials.length} materials required
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                {formatPrice(totalPrice)}
              </div>
              <p className="text-sm text-gray-500">
                Estimated total
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onCancel}
            className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Confirm & Continue
          </button>
        </div>
      </main>
    </div>
  );
};

export default MaterialsView;