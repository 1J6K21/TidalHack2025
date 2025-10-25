import { describe, it, expect } from 'vitest';
import { generateDemoManual, simulateApiDelay } from '../demoDataGenerator';

describe('Demo Data Generator', () => {
  describe('generateDemoManual', () => {
    it('should generate lamp template for lamp-related ideas', () => {
      const result = generateDemoManual('modern desk lamp');
      
      expect(result.manualId).toMatch(/^demo-manual-\d+-[a-z0-9]+$/);
      expect(result.steps).toHaveLength(5);
      expect(result.materials).toHaveLength(6);
      expect(result.totalPrice).toBeGreaterThan(0);
      expect(result.firebasePath).toContain('manuals/generated/');
      
      // Check that it's the lamp template
      expect(result.steps[0].title).toContain('wooden base');
      expect(result.materials.some(m => m.name.includes('Oak Wood'))).toBe(true);
    });

    it('should generate shelf template for shelf-related ideas', () => {
      const result = generateDemoManual('industrial bookshelf');
      
      expect(result.steps).toHaveLength(5);
      expect(result.materials).toHaveLength(5);
      expect(result.totalPrice).toBeGreaterThan(0);
      
      // Check that it's the shelf template
      expect(result.steps[0].title).toContain('wooden shelves');
      expect(result.materials.some(m => m.name.includes('Pine Boards'))).toBe(true);
    });

    it('should generate planter template for planter-related ideas', () => {
      const result = generateDemoManual('concrete planters');
      
      expect(result.steps).toHaveLength(5);
      expect(result.materials).toHaveLength(4);
      expect(result.totalPrice).toBeGreaterThan(0);
      
      // Check that it's the planter template
      expect(result.steps[0].title).toContain('concrete molds');
      expect(result.materials.some(m => m.name.includes('Concrete Mix'))).toBe(true);
    });

    it('should default to lamp template for unknown ideas', () => {
      const result = generateDemoManual('unknown project type');
      
      expect(result.steps).toHaveLength(5);
      expect(result.materials).toHaveLength(6);
      
      // Should default to lamp template
      expect(result.steps[0].title).toContain('wooden base');
    });

    it('should generate unique manual IDs', () => {
      const result1 = generateDemoManual('test project 1');
      const result2 = generateDemoManual('test project 2');
      
      expect(result1.manualId).not.toBe(result2.manualId);
    });

    it('should calculate correct total price', () => {
      const result = generateDemoManual('test lamp');
      
      const calculatedTotal = result.materials.reduce((sum, material) => sum + material.totalPrice, 0);
      expect(result.totalPrice).toBe(Math.round(calculatedTotal * 100) / 100);
    });

    it('should generate proper image URLs', () => {
      const result = generateDemoManual('test project');
      
      result.steps.forEach((step, index) => {
        expect(step.imageURL).toContain(`manuals/generated/${result.manualId}/images/steps/step-${index + 1}.jpg`);
      });
      
      result.materials.forEach(material => {
        expect(material.imageURL).toContain(`manuals/generated/${result.manualId}/images/materials/${material.id}.jpg`);
        expect(material.amazonURL).toContain('amazon.com/s?k=');
      });
    });

    it('should have valid step structure', () => {
      const result = generateDemoManual('test project');
      
      result.steps.forEach((step, index) => {
        expect(step.stepNumber).toBe(index + 1);
        expect(step.title).toBeTruthy();
        expect(step.description).toBeTruthy();
        expect(step.estimatedTime).toBeGreaterThan(0);
        expect(Array.isArray(step.tools)).toBe(true);
        expect(step.imageURL).toBeTruthy();
      });
    });

    it('should have valid material structure', () => {
      const result = generateDemoManual('test project');
      
      result.materials.forEach(material => {
        expect(material.id).toBeTruthy();
        expect(material.name).toBeTruthy();
        expect(material.description).toBeTruthy();
        expect(material.quantity).toBeGreaterThan(0);
        expect(material.unitPrice).toBeGreaterThan(0);
        expect(material.totalPrice).toBeGreaterThan(0);
        expect(material.category).toBeTruthy();
        expect(material.imageURL).toBeTruthy();
        expect(material.amazonURL).toBeTruthy();
        
        // Verify price calculation
        expect(material.totalPrice).toBe(material.quantity * material.unitPrice);
      });
    });
  });

  describe('simulateApiDelay', () => {
    it('should return a promise that resolves', async () => {
      const startTime = Date.now();
      await simulateApiDelay();
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeGreaterThanOrEqual(1000); // At least 1 second
      expect(duration).toBeLessThan(4000); // Less than 4 seconds
    });
  });
});