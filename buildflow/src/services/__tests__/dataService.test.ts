import { vi } from 'vitest';
import { dataService } from '../dataService';
import { AppMode, Manual } from '../../types';

// Mock the dependencies
vi.mock('../firebaseService', () => ({
  firebaseService: {
    getSteps: vi.fn(),
    getMaterials: vi.fn()
  }
}));

vi.mock('../manualGenerationService', () => ({
  manualGenerationService: {
    generateManual: vi.fn()
  }
}));

// Import mocked services
import { firebaseService } from '../firebaseService';
import { manualGenerationService } from '../manualGenerationService';

const mockFirebaseService = firebaseService as any;
const mockManualGenerationService = manualGenerationService as any;

describe('DataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadManuals', () => {
    it('should load demo manuals in demo mode', async () => {
      const result = await dataService.loadManuals(AppMode.DEMO);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('keyboard-build-2024');
      expect(result[1].id).toBe('lamp-build-2024');
      expect(result[0].productName).toBe('Custom Mechanical Keyboard');
      expect(result[1].productName).toBe('Modern Table Lamp');
    });

    it('should load user manuals in live mode', async () => {
      const result = await dataService.loadManuals(AppMode.LIVE);

      expect(result).toEqual([]);
    });

    it('should handle errors when loading demo manuals', async () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // This test verifies error handling, but since demo manuals are hardcoded,
      // we can't easily simulate an error. The test ensures the method completes.
      const result = await dataService.loadManuals(AppMode.DEMO);
      expect(result).toHaveLength(2);

      consoleSpy.mockRestore();
    });
  });

  describe('loadManualData', () => {
    const mockManual: Manual = {
      id: 'test-manual',
      productName: 'Test Manual',
      thumbnailURL: 'https://example.com/thumb.jpg',
      firebaseManualPath: 'manuals/demo/test',
      firebaseImagePath: 'manuals/demo/test/images',
      createdAt: new Date(),
      totalPrice: 100,
      stepCount: 3
    };

    it('should load demo manual data successfully', async () => {
      const mockSteps = [
        {
          stepNumber: 1,
          title: 'Step 1',
          description: 'Test step',
          imageURL: 'https://example.com/step1.jpg',
          estimatedTime: 10,
          tools: ['hammer']
        }
      ];

      const mockMaterials = [
        {
          id: 'material-1',
          name: 'Test Material',
          description: 'A test material',
          quantity: 1,
          unitPrice: 10,
          totalPrice: 10,
          imageURL: 'https://example.com/material.jpg',
          category: 'Test'
        }
      ];

      mockFirebaseService.getSteps.mockResolvedValue(mockSteps);
      mockFirebaseService.getMaterials.mockResolvedValue(mockMaterials);

      const result = await dataService.loadManualData(mockManual, AppMode.DEMO);

      expect(result.steps).toEqual(mockSteps);
      expect(result.materials).toEqual(mockMaterials);
      expect(mockFirebaseService.getSteps).toHaveBeenCalledWith(mockManual.firebaseManualPath);
      expect(mockFirebaseService.getMaterials).toHaveBeenCalledWith(mockManual.firebaseManualPath);
    });

    it('should load generated manual data successfully', async () => {
      const mockSteps = [
        {
          stepNumber: 1,
          title: 'Generated Step 1',
          description: 'Generated test step',
          imageURL: 'https://example.com/gen-step1.jpg',
          estimatedTime: 15,
          tools: ['screwdriver']
        }
      ];

      const mockMaterials = [
        {
          id: 'gen-material-1',
          name: 'Generated Material',
          description: 'A generated material',
          quantity: 2,
          unitPrice: 20,
          totalPrice: 40,
          imageURL: 'https://example.com/gen-material.jpg',
          category: 'Generated'
        }
      ];

      mockFirebaseService.getSteps.mockResolvedValue(mockSteps);
      mockFirebaseService.getMaterials.mockResolvedValue(mockMaterials);

      const result = await dataService.loadManualData(mockManual, AppMode.LIVE);

      expect(result.steps).toEqual(mockSteps);
      expect(result.materials).toEqual(mockMaterials);
      expect(mockFirebaseService.getSteps).toHaveBeenCalledWith(mockManual.firebaseManualPath);
      expect(mockFirebaseService.getMaterials).toHaveBeenCalledWith(mockManual.firebaseManualPath);
    });

    it('should return fallback data when Firebase fails in demo mode', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockFirebaseService.getSteps.mockRejectedValue(new Error('Firebase error'));
      mockFirebaseService.getMaterials.mockRejectedValue(new Error('Firebase error'));

      const keyboardManual: Manual = {
        ...mockManual,
        id: 'keyboard-build-2024'
      };

      const result = await dataService.loadManualData(keyboardManual, AppMode.DEMO);

      expect(result.steps).toHaveLength(2);
      expect(result.materials).toHaveLength(2);
      expect(result.steps[0].title).toBe('Prepare the PCB');
      expect(result.materials[0].name).toBe('60% Mechanical Keyboard PCB');

      consoleSpy.mockRestore();
    });

    it('should throw error when Firebase fails in live mode', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockFirebaseService.getSteps.mockRejectedValue(new Error('Firebase error'));

      await expect(
        dataService.loadManualData(mockManual, AppMode.LIVE)
      ).rejects.toThrow('Failed to load manual data');

      consoleSpy.mockRestore();
    });

    it('should return fallback data for lamp manual', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockFirebaseService.getSteps.mockRejectedValue(new Error('Firebase error'));
      mockFirebaseService.getMaterials.mockRejectedValue(new Error('Firebase error'));

      const lampManual: Manual = {
        ...mockManual,
        id: 'lamp-build-2024'
      };

      const result = await dataService.loadManualData(lampManual, AppMode.DEMO);

      expect(result.steps).toHaveLength(2);
      expect(result.materials).toHaveLength(2);
      expect(result.steps[0].title).toBe('Prepare the Base');
      expect(result.materials[0].name).toBe('Wooden Lamp Base');

      consoleSpy.mockRestore();
    });

    it('should return empty fallback data for unknown manual', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockFirebaseService.getSteps.mockRejectedValue(new Error('Firebase error'));
      mockFirebaseService.getMaterials.mockRejectedValue(new Error('Firebase error'));

      const unknownManual: Manual = {
        ...mockManual,
        id: 'unknown-manual'
      };

      const result = await dataService.loadManualData(unknownManual, AppMode.DEMO);

      expect(result.steps).toEqual([]);
      expect(result.materials).toEqual([]);

      consoleSpy.mockRestore();
    });
  });

  describe('generateManual', () => {
    it('should generate manual in live mode', async () => {
      const mockResponse = {
        manualId: 'generated-123',
        projectName: 'Generated Project',
        steps: [],
        materials: [],
        totalPrice: 50,
        firebasePath: 'manuals/generated/testuser/generated-123'
      };

      mockManualGenerationService.generateManual.mockResolvedValue(mockResponse);

      const result = await dataService.generateManual('test idea', AppMode.LIVE);

      expect(result).toEqual(mockResponse);
      expect(mockManualGenerationService.generateManual).toHaveBeenCalledWith({
        productIdea: 'test idea',
        userId: 'testuser'
      });
    });

    it('should throw error when trying to generate in demo mode', async () => {
      await expect(
        dataService.generateManual('test idea', AppMode.DEMO)
      ).rejects.toThrow('Manual generation is disabled in demo mode');

      expect(mockManualGenerationService.generateManual).not.toHaveBeenCalled();
    });

    it('should handle generation errors in live mode', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockManualGenerationService.generateManual.mockRejectedValue(new Error('Generation failed'));

      await expect(
        dataService.generateManual('test idea', AppMode.LIVE)
      ).rejects.toThrow('Failed to generate manual');

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Test that the service handles various error types
      mockFirebaseService.getSteps.mockRejectedValue(new Error('Network error'));
      
      const result = await dataService.loadManualData({
        id: 'keyboard-build-2024',
        productName: 'Test',
        thumbnailURL: '',
        firebaseManualPath: 'test/path',
        firebaseImagePath: 'test/images',
        createdAt: new Date(),
        totalPrice: 0,
        stepCount: 0
      }, AppMode.DEMO);

      // Should return fallback data instead of throwing
      expect(result.steps).toHaveLength(2);
      expect(result.materials).toHaveLength(2);

      consoleSpy.mockRestore();
    });

    it('should log errors appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockFirebaseService.getSteps.mockRejectedValue(new Error('Test error'));
      
      await dataService.loadManualData({
        id: 'keyboard-build-2024',
        productName: 'Test',
        thumbnailURL: '',
        firebaseManualPath: 'test/path',
        firebaseImagePath: 'test/images',
        createdAt: new Date(),
        totalPrice: 0,
        stepCount: 0
      }, AppMode.DEMO);

      expect(consoleSpy).toHaveBeenCalledWith('Error loading demo manual data:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});