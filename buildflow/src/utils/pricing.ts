// Pricing calculation utilities for BuildFlow application

import { Material } from '../types';

// ============================================================================
// PRICING CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate the total price for a single material item
 * @param unitPrice - Price per unit
 * @param quantity - Number of units
 * @returns Total price for the material
 */
export function calculateMaterialTotal(unitPrice: number, quantity: number): number {
  if (unitPrice < 0 || quantity < 0) {
    throw new Error('Unit price and quantity must be non-negative');
  }
  
  return Math.round((unitPrice * quantity) * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate the grand total for all materials
 * @param materials - Array of materials
 * @returns Total price for all materials
 */
export function calculateGrandTotal(materials: Material[]): number {
  if (!Array.isArray(materials)) {
    throw new Error('Materials must be an array');
  }

  const total = materials.reduce((sum, material) => {
    if (!material || typeof material.totalPrice !== 'number') {
      throw new Error('Invalid material object or missing totalPrice');
    }
    return sum + material.totalPrice;
  }, 0);

  return Math.round(total * 100) / 100; // Round to 2 decimal places
}

/**
 * Recalculate total prices for all materials based on unit price and quantity
 * @param materials - Array of materials
 * @returns Array of materials with updated total prices
 */
export function recalculateMaterialTotals(materials: Material[]): Material[] {
  return materials.map(material => ({
    ...material,
    totalPrice: calculateMaterialTotal(material.unitPrice, material.quantity)
  }));
}

// ============================================================================
// CURRENCY FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format a price value as currency string
 * @param price - Price value to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  price: number, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string {
  if (typeof price !== 'number' || isNaN(price)) {
    throw new Error('Price must be a valid number');
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  } catch (error) {
    // Fallback formatting if Intl.NumberFormat fails
    return `$${price.toFixed(2)}`;
  }
}

/**
 * Format price with compact notation for large numbers
 * @param price - Price value to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string with compact notation
 */
export function formatCompactCurrency(
  price: number, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string {
  if (typeof price !== 'number' || isNaN(price)) {
    throw new Error('Price must be a valid number');
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(price);
  } catch (error) {
    // Fallback to regular formatting
    return formatCurrency(price, currency, locale);
  }
}

// ============================================================================
// PRICE VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate if a price value is valid
 * @param price - Price value to validate
 * @returns Validation result object
 */
export function validatePrice(price: any): { isValid: boolean; error?: string } {
  if (price === null || price === undefined) {
    return { isValid: false, error: 'Price cannot be null or undefined' };
  }

  if (typeof price !== 'number') {
    return { isValid: false, error: 'Price must be a number' };
  }

  if (isNaN(price)) {
    return { isValid: false, error: 'Price cannot be NaN' };
  }

  if (!isFinite(price)) {
    return { isValid: false, error: 'Price must be a finite number' };
  }

  if (price < 0) {
    return { isValid: false, error: 'Price cannot be negative' };
  }

  // Check for reasonable price limits (adjust as needed)
  if (price > 1000000) {
    return { isValid: false, error: 'Price exceeds maximum allowed value' };
  }

  return { isValid: true };
}

/**
 * Validate material pricing data
 * @param material - Material object to validate
 * @returns Validation result object
 */
export function validateMaterialPricing(material: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!material) {
    return { isValid: false, errors: ['Material object is required'] };
  }

  // Validate unit price
  const unitPriceValidation = validatePrice(material.unitPrice);
  if (!unitPriceValidation.isValid) {
    errors.push(`Unit price: ${unitPriceValidation.error}`);
  }

  // Validate total price
  const totalPriceValidation = validatePrice(material.totalPrice);
  if (!totalPriceValidation.isValid) {
    errors.push(`Total price: ${totalPriceValidation.error}`);
  }

  // Validate quantity
  if (typeof material.quantity !== 'number' || material.quantity < 0 || !Number.isInteger(material.quantity)) {
    errors.push('Quantity must be a non-negative integer');
  }

  // Validate price consistency (only if all individual validations pass)
  if (unitPriceValidation.isValid && totalPriceValidation.isValid && 
      typeof material.quantity === 'number' && material.quantity >= 0 && Number.isInteger(material.quantity)) {
    try {
      const expectedTotal = calculateMaterialTotal(material.unitPrice, material.quantity);
      const tolerance = 0.01; // Allow for small rounding differences
      
      if (Math.abs(material.totalPrice - expectedTotal) > tolerance) {
        errors.push(`Total price (${material.totalPrice}) does not match unit price × quantity (${expectedTotal})`);
      }
    } catch (error) {
      // Skip consistency check if calculation fails
    }
  }

  return { isValid: errors.length === 0, errors };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse a price string and return a number
 * @param priceString - String representation of price (e.g., "$19.99", "19.99")
 * @returns Parsed price as number
 */
export function parsePrice(priceString: string): number {
  if (typeof priceString !== 'string') {
    throw new Error('Price string must be a string');
  }

  // Remove currency symbols and whitespace
  const cleanedString = priceString.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleanedString);

  if (isNaN(parsed)) {
    throw new Error(`Cannot parse price from string: ${priceString}`);
  }

  return parsed;
}

/**
 * Calculate percentage of total for a material
 * @param materialPrice - Price of the material
 * @param totalPrice - Total price of all materials
 * @returns Percentage as a number between 0 and 100
 */
export function calculatePricePercentage(materialPrice: number, totalPrice: number): number {
  if (totalPrice === 0) {
    return 0;
  }

  const percentage = (materialPrice / totalPrice) * 100;
  return Math.round(percentage * 100) / 100; // Round to 2 decimal places
}

/**
 * Apply discount to a price
 * @param price - Original price
 * @param discountPercent - Discount percentage (0-100)
 * @returns Discounted price
 */
export function applyDiscount(price: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount percentage must be between 0 and 100');
  }

  const discountAmount = (price * discountPercent) / 100;
  const discountedPrice = price - discountAmount;
  
  return Math.round(discountedPrice * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate tax amount for a price
 * @param price - Price before tax
 * @param taxRate - Tax rate as percentage (e.g., 8.25 for 8.25%)
 * @returns Tax amount
 */
export function calculateTax(price: number, taxRate: number): number {
  if (taxRate < 0) {
    throw new Error('Tax rate cannot be negative');
  }

  const taxAmount = (price * taxRate) / 100;
  return Math.round(taxAmount * 100) / 100; // Round to 2 decimal places
}