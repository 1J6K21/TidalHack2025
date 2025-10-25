import { describe, it, expect } from 'vitest';
import {
  calculateMaterialTotal,
  calculateGrandTotal,
  recalculateMaterialTotals,
  formatCurrency,
  formatCompactCurrency,
  validatePrice,
  validateMaterialPricing,
  parsePrice,
  calculatePricePercentage,
  applyDiscount,
  calculateTax
} from '../pricing';
import { Material } from '../../types';

describe('Pricing Utilities', () => {
  const mockMaterials: Material[] = [
    {
      id: 'material-1',
      name: 'Arduino Uno',
      description: 'Microcontroller board',
      quantity: 2,
      unitPrice: 25.99,
      totalPrice: 51.98,
      imageURL: 'https://example.com/arduino.jpg',
      amazonURL: 'https://amazon.com/arduino',
      category: 'Electronics'
    },
    {
      id: 'material-2',
      name: 'Breadboard',
      description: 'Solderless breadboard',
      quantity: 1,
      unitPrice: 8.50,
      totalPrice: 8.50,
      imageURL: 'https://example.com/breadboard.jpg',
      category: 'Electronics'
    },
    {
      id: 'material-3',
      name: 'LED Pack',
      description: 'Assorted LEDs',
      quantity: 3,
      unitPrice: 4.33,
      totalPrice: 12.99,
      imageURL: 'https://example.com/leds.jpg',
      category: 'Components'
    }
  ];

  describe('calculateMaterialTotal', () => {
    it('should calculate correct total for positive values', () => {
      expect(calculateMaterialTotal(25.99, 2)).toBe(51.98);
      expect(calculateMaterialTotal(10.00, 1)).toBe(10.00);
      expect(calculateMaterialTotal(3.33, 3)).toBe(9.99);
    });

    it('should handle zero values', () => {
      expect(calculateMaterialTotal(0, 5)).toBe(0);
      expect(calculateMaterialTotal(10.50, 0)).toBe(0);
      expect(calculateMaterialTotal(0, 0)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      expect(calculateMaterialTotal(1.234, 2)).toBe(2.47);
      expect(calculateMaterialTotal(0.333, 3)).toBe(1.00);
    });

    it('should throw error for negative values', () => {
      expect(() => calculateMaterialTotal(-5, 2)).toThrow('Unit price and quantity must be non-negative');
      expect(() => calculateMaterialTotal(5, -2)).toThrow('Unit price and quantity must be non-negative');
      expect(() => calculateMaterialTotal(-5, -2)).toThrow('Unit price and quantity must be non-negative');
    });
  });

  describe('calculateGrandTotal', () => {
    it('should calculate correct grand total for multiple materials', () => {
      const total = calculateGrandTotal(mockMaterials);
      expect(total).toBe(73.47); // 51.98 + 8.50 + 12.99
    });

    it('should handle empty array', () => {
      expect(calculateGrandTotal([])).toBe(0);
    });

    it('should handle single material', () => {
      const singleMaterial = [mockMaterials[0]];
      expect(calculateGrandTotal(singleMaterial)).toBe(51.98);
    });

    it('should round to 2 decimal places', () => {
      const materialsWithDecimals: Material[] = [
        { ...mockMaterials[0], totalPrice: 1.111 },
        { ...mockMaterials[1], totalPrice: 2.222 }
      ];
      expect(calculateGrandTotal(materialsWithDecimals)).toBe(3.33);
    });

    it('should throw error for invalid input', () => {
      expect(() => calculateGrandTotal(null as any)).toThrow('Materials must be an array');
      expect(() => calculateGrandTotal(undefined as any)).toThrow('Materials must be an array');
      expect(() => calculateGrandTotal('invalid' as any)).toThrow('Materials must be an array');
    });

    it('should throw error for invalid material objects', () => {
      const invalidMaterials = [
        { ...mockMaterials[0], totalPrice: null },
        mockMaterials[1]
      ];
      expect(() => calculateGrandTotal(invalidMaterials as any)).toThrow('Invalid material object or missing totalPrice');
    });
  });

  describe('recalculateMaterialTotals', () => {
    it('should recalculate all material totals correctly', () => {
      const materialsWithWrongTotals = mockMaterials.map(m => ({ ...m, totalPrice: 0 }));
      const recalculated = recalculateMaterialTotals(materialsWithWrongTotals);
      
      expect(recalculated[0].totalPrice).toBe(51.98);
      expect(recalculated[1].totalPrice).toBe(8.50);
      expect(recalculated[2].totalPrice).toBe(12.99);
    });

    it('should preserve other material properties', () => {
      const recalculated = recalculateMaterialTotals(mockMaterials);
      
      expect(recalculated[0].id).toBe('material-1');
      expect(recalculated[0].name).toBe('Arduino Uno');
      expect(recalculated[0].unitPrice).toBe(25.99);
      expect(recalculated[0].quantity).toBe(2);
    });

    it('should handle empty array', () => {
      expect(recalculateMaterialTotals([])).toEqual([]);
    });
  });

  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      expect(formatCurrency(25.99)).toBe('$25.99');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });

    it('should handle different currencies', () => {
      expect(formatCurrency(25.99, 'EUR', 'en-US')).toBe('€25.99');
      expect(formatCurrency(25.99, 'GBP', 'en-US')).toBe('£25.99');
    });

    it('should handle different locales', () => {
      expect(formatCurrency(1234.56, 'USD', 'en-US')).toBe('$1,234.56');
      // Note: Different locales may format differently, but we'll test the basic functionality
    });

    it('should throw error for invalid price', () => {
      expect(() => formatCurrency(NaN)).toThrow('Price must be a valid number');
      expect(() => formatCurrency('invalid' as any)).toThrow('Price must be a valid number');
    });

    it('should fallback to basic formatting on Intl error', () => {
      // Test with invalid currency to trigger fallback
      const result = formatCurrency(25.99, 'INVALID');
      expect(result).toBe('$25.99'); // Should fallback to basic format
    });
  });

  describe('formatCompactCurrency', () => {
    it('should format large numbers with compact notation', () => {
      expect(formatCompactCurrency(1000)).toBe('$1K');
      expect(formatCompactCurrency(1500)).toBe('$1.5K');
      expect(formatCompactCurrency(1000000)).toBe('$1M');
    });

    it('should format small numbers normally', () => {
      expect(formatCompactCurrency(25.99)).toBe('$26');
      expect(formatCompactCurrency(100)).toBe('$100');
    });

    it('should fallback to regular formatting on error', () => {
      const result = formatCompactCurrency(25.99, 'INVALID');
      expect(result).toBe('$25.99'); // Should fallback to regular formatting
    });
  });

  describe('validatePrice', () => {
    it('should validate correct prices', () => {
      expect(validatePrice(25.99)).toEqual({ isValid: true });
      expect(validatePrice(0)).toEqual({ isValid: true });
      expect(validatePrice(1000000)).toEqual({ isValid: true });
    });

    it('should reject null and undefined', () => {
      expect(validatePrice(null)).toEqual({ isValid: false, error: 'Price cannot be null or undefined' });
      expect(validatePrice(undefined)).toEqual({ isValid: false, error: 'Price cannot be null or undefined' });
    });

    it('should reject non-numbers', () => {
      expect(validatePrice('25.99')).toEqual({ isValid: false, error: 'Price must be a number' });
      expect(validatePrice({})).toEqual({ isValid: false, error: 'Price must be a number' });
      expect(validatePrice([])).toEqual({ isValid: false, error: 'Price must be a number' });
    });

    it('should reject NaN', () => {
      expect(validatePrice(NaN)).toEqual({ isValid: false, error: 'Price cannot be NaN' });
    });

    it('should reject negative prices', () => {
      expect(validatePrice(-1)).toEqual({ isValid: false, error: 'Price cannot be negative' });
      expect(validatePrice(-25.99)).toEqual({ isValid: false, error: 'Price cannot be negative' });
    });

    it('should reject infinite values', () => {
      expect(validatePrice(Infinity)).toEqual({ isValid: false, error: 'Price must be a finite number' });
      expect(validatePrice(-Infinity)).toEqual({ isValid: false, error: 'Price must be a finite number' });
    });

    it('should reject extremely large values', () => {
      expect(validatePrice(10000000)).toEqual({ isValid: false, error: 'Price exceeds maximum allowed value' });
    });
  });

  describe('validateMaterialPricing', () => {
    it('should validate correct material', () => {
      const result = validateMaterialPricing(mockMaterials[0]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject null material', () => {
      const result = validateMaterialPricing(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(['Material object is required']);
    });

    it('should validate unit price', () => {
      const invalidMaterial = { ...mockMaterials[0], unitPrice: -5 };
      const result = validateMaterialPricing(invalidMaterial);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unit price: Price cannot be negative');
    });

    it('should validate total price', () => {
      const invalidMaterial = { ...mockMaterials[0], totalPrice: NaN };
      const result = validateMaterialPricing(invalidMaterial);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total price: Price cannot be NaN');
    });

    it('should validate quantity', () => {
      const invalidMaterial = { ...mockMaterials[0], quantity: -1 };
      const result = validateMaterialPricing(invalidMaterial);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quantity must be a non-negative integer');
    });

    it('should validate price consistency', () => {
      const inconsistentMaterial = { ...mockMaterials[0], totalPrice: 100 }; // Should be 51.98
      const result = validateMaterialPricing(inconsistentMaterial);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Total price (100) does not match unit price × quantity');
    });

    it('should allow small rounding differences', () => {
      const materialWithRounding = { ...mockMaterials[0], totalPrice: 51.979 }; // Close to 51.98
      const result = validateMaterialPricing(materialWithRounding);
      expect(result.isValid).toBe(true);
    });
  });

  describe('parsePrice', () => {
    it('should parse price strings correctly', () => {
      expect(parsePrice('25.99')).toBe(25.99);
      expect(parsePrice('$25.99')).toBe(25.99);
      expect(parsePrice('$1,234.56')).toBe(1234.56);
      expect(parsePrice(' $25.99 ')).toBe(25.99);
    });

    it('should handle different formats', () => {
      expect(parsePrice('25')).toBe(25);
      expect(parsePrice('0.99')).toBe(0.99);
      expect(parsePrice('1,000')).toBe(1000);
    });

    it('should throw error for non-string input', () => {
      expect(() => parsePrice(25.99 as any)).toThrow('Price string must be a string');
      expect(() => parsePrice(null as any)).toThrow('Price string must be a string');
    });

    it('should throw error for unparseable strings', () => {
      expect(() => parsePrice('invalid')).toThrow('Cannot parse price from string: invalid');
      expect(() => parsePrice('$abc')).toThrow('Cannot parse price from string: $abc');
    });
  });

  describe('calculatePricePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePricePercentage(25, 100)).toBe(25);
      expect(calculatePricePercentage(33.33, 100)).toBe(33.33);
      expect(calculatePricePercentage(1, 3)).toBe(33.33);
    });

    it('should handle zero total', () => {
      expect(calculatePricePercentage(25, 0)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      expect(calculatePricePercentage(1, 3)).toBe(33.33);
      expect(calculatePricePercentage(2, 3)).toBe(66.67);
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount correctly', () => {
      expect(applyDiscount(100, 10)).toBe(90);
      expect(applyDiscount(50, 20)).toBe(40);
      expect(applyDiscount(25.99, 15)).toBe(22.09);
    });

    it('should handle zero discount', () => {
      expect(applyDiscount(100, 0)).toBe(100);
    });

    it('should handle 100% discount', () => {
      expect(applyDiscount(100, 100)).toBe(0);
    });

    it('should throw error for invalid discount percentage', () => {
      expect(() => applyDiscount(100, -5)).toThrow('Discount percentage must be between 0 and 100');
      expect(() => applyDiscount(100, 105)).toThrow('Discount percentage must be between 0 and 100');
    });

    it('should round to 2 decimal places', () => {
      expect(applyDiscount(33.33, 33.33)).toBe(22.22);
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax correctly', () => {
      expect(calculateTax(100, 8.25)).toBe(8.25);
      expect(calculateTax(50, 10)).toBe(5);
      expect(calculateTax(25.99, 7.5)).toBe(1.95);
    });

    it('should handle zero tax rate', () => {
      expect(calculateTax(100, 0)).toBe(0);
    });

    it('should throw error for negative tax rate', () => {
      expect(() => calculateTax(100, -5)).toThrow('Tax rate cannot be negative');
    });

    it('should round to 2 decimal places', () => {
      expect(calculateTax(33.33, 8.333)).toBe(2.78);
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle very small prices', () => {
      expect(calculateMaterialTotal(0.01, 1)).toBe(0.01);
      expect(formatCurrency(0.01)).toBe('$0.01');
      expect(validatePrice(0.01)).toEqual({ isValid: true });
    });

    it('should handle large quantities', () => {
      expect(calculateMaterialTotal(1.99, 1000)).toBe(1990);
      expect(calculateGrandTotal([{
        ...mockMaterials[0],
        quantity: 1000,
        totalPrice: 25990
      }])).toBe(25990);
    });

    it('should maintain precision through calculations', () => {
      const material = {
        ...mockMaterials[0],
        unitPrice: 0.33,
        quantity: 3
      };
      const recalculated = recalculateMaterialTotals([material]);
      expect(recalculated[0].totalPrice).toBe(0.99);
    });
  });
});