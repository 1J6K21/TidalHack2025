import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  uploadManual, 
  getManual, 
  getManualsList,
  validateManualStructure,
  validateStepsStructure,
  validateMaterialsStructure,
  STORAGE_PATHS
} from '../firebaseStorage';
import { Manual, Step, Material } from '../../types';
import { ref, uploadBytes, getBytes, listAll } from 'firebase/storage';

// Mock Firebase Storage functions
vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getBytes: vi.fn(),
  listAll: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
  getMetadata: vi.fn(),
  updateMetadata: vi.fn(),
}));

vi.mock('../firebase', () => ({
  storage: {},
}));

describe('Firebase Storage Service', () => {
  const mockRef = vi.mocked(ref);
  const mockUploadBytes = vi.mocked(uploadBytes);
  const mockGetBytes = vi.mocked(getBytes);
  const mockListAll = vi.mocked(listAll);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateManualStructure', () => {
    it('should validate a correct manual structure', () => {
      const validManual: Manual = {
        id: 'test-manual-1',
        productName: 'Test Product',
        thumbnailURL: 'https://example.com/thumb.jpg',
        firebaseManualPath: 'manuals/demo/test',
        firebaseImagePath: 'manuals/demo/test/images',
        createdAt: new Date(),
        totalPrice: 99.99,
        stepCount: 5
      };

      const result = validateManualStructure(validManual);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject manual with missing required fields', () => {
      const invalidManual = {
        id: 'test-manual-1',
        // Missing productName
        thumbnailURL: 'https://example.com/thumb.jpg',
        totalPrice: 99.99,
        stepCount: 5
      };

      const result = validateManualStructure(invalidManual);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Manual must have a valid productName');
    });

    it('should reject manual with invalid price', () => {
      const invalidManual = {
        id: 'test-manual-1',
        productName: 'Test Product',
        thumbnailURL: 'https://example.com/thumb.jpg',
        totalPrice: -10, // Invalid negative price
        stepCount: 5
      };

      const result = validateManualStructure(invalidManual);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Manual must have a valid totalPrice');
    });

    it('should reject non-object input', () => {
      const result = validateManualStructure(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Manual data must be an object');
    });
  });

  describe('validateStepsStructure', () => {
    it('should validate correct steps structure', () => {
      const validSteps: Step[] = [
        {
          stepNumber: 1,
          title: 'Step 1',
          description: 'First step description',
          imageURL: 'https://example.com/step1.jpg',
          estimatedTime: 10,
          tools: ['hammer', 'screwdriver']
        },
        {
          stepNumber: 2,
          title: 'Step 2',
          description: 'Second step description',
          imageURL: 'https://example.com/step2.jpg',
          estimatedTime: 15,
          tools: ['drill']
        }
      ];

      const result = validateStepsStructure(validSteps);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject steps with missing required fields', () => {
      const invalidSteps = [
        {
          stepNumber: 1,
          // Missing title
          description: 'First step description',
          imageURL: 'https://example.com/step1.jpg',
          estimatedTime: 10,
          tools: ['hammer']
        }
      ];

      const result = validateStepsStructure(invalidSteps);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Step 1 must have a valid title');
    });

    it('should reject non-array input', () => {
      const result = validateStepsStructure('not an array' as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Steps must be an array');
    });

    it('should reject steps with invalid tools array', () => {
      const invalidSteps = [
        {
          stepNumber: 1,
          title: 'Step 1',
          description: 'First step description',
          imageURL: 'https://example.com/step1.jpg',
          estimatedTime: 10,
          tools: 'not an array' // Should be array
        }
      ];

      const result = validateStepsStructure(invalidSteps);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Step 1 must have a valid tools array');
    });
  });

  describe('validateMaterialsStructure', () => {
    it('should validate correct materials structure', () => {
      const validMaterials: Material[] = [
        {
          id: 'material-1',
          name: 'Wood Plank',
          description: '2x4 pine wood plank',
          quantity: 4,
          unitPrice: 5.99,
          totalPrice: 23.96,
          imageURL: 'https://example.com/wood.jpg',
          category: 'Hardware'
        },
        {
          id: 'material-2',
          name: 'Screws',
          description: 'Wood screws 2 inch',
          quantity: 20,
          unitPrice: 0.25,
          totalPrice: 5.00,
          imageURL: 'https://example.com/screws.jpg',
          category: 'Hardware'
        }
      ];

      const result = validateMaterialsStructure(validMaterials);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject materials with missing required fields', () => {
      const invalidMaterials = [
        {
          id: 'material-1',
          // Missing name
          description: '2x4 pine wood plank',
          quantity: 4,
          unitPrice: 5.99,
          totalPrice: 23.96,
          category: 'Hardware'
        }
      ];

      const result = validateMaterialsStructure(invalidMaterials);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Material 1 must have a valid name');
    });

    it('should reject materials with invalid quantities', () => {
      const invalidMaterials = [
        {
          id: 'material-1',
          name: 'Wood Plank',
          description: '2x4 pine wood plank',
          quantity: 0, // Invalid quantity
          unitPrice: 5.99,
          totalPrice: 23.96,
          category: 'Hardware'
        }
      ];

      const result = validateMaterialsStructure(invalidMaterials);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Material 1 must have a valid quantity');
    });

    it('should reject non-array input', () => {
      const result = validateMaterialsStructure('not an array' as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Materials must be an array');
    });
  });

  describe('uploadManual', () => {
    it('should successfully upload a valid manual', async () => {
      const mockManual: Manual = {
        id: 'test-manual-1',
        productName: 'Test Product',
        thumbnailURL: 'https://example.com/thumb.jpg',
        firebaseManualPath: 'manuals/generated/user1/test-manual-1',
        firebaseImagePath: 'manuals/generated/user1/test-manual-1/images',
        createdAt: new Date(),
        totalPrice: 99.99,
        stepCount: 2
      };

      const mockSteps: Step[] = [
        {
          stepNumber: 1,
          title: 'Step 1',
          description: 'First step',
          imageURL: 'https://example.com/step1.jpg',
          estimatedTime: 10,
          tools: ['hammer']
        }
      ];

      const mockMaterials: Material[] = [
        {
          id: 'material-1',
          name: 'Wood',
          description: 'Pine wood',
          quantity: 1,
          unitPrice: 10.00,
          totalPrice: 10.00,
          imageURL: 'https://example.com/wood.jpg',
          category: 'Hardware'
        }
      ];

      mockRef.mockReturnValue({ fullPath: 'test-path' });
      mockUploadBytes.mockResolvedValue({ ref: { fullPath: 'test-path' } });

      const result = await uploadManual({
        manual: mockManual,
        steps: mockSteps,
        materials: mockMaterials,
        userId: 'user1'
      });

      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
      expect(result.data.manualId).toBe('test-manual-1');
      expect(mockUploadBytes).toHaveBeenCalledTimes(3); // metadata, steps, materials
    });

    it('should handle upload errors gracefully', async () => {
      const mockManual: Manual = {
        id: 'test-manual-1',
        productName: 'Test Product',
        thumbnailURL: 'https://example.com/thumb.jpg',
        firebaseManualPath: 'manuals/generated/user1/test-manual-1',
        firebaseImagePath: 'manuals/generated/user1/test-manual-1/images',
        createdAt: new Date(),
        totalPrice: 99.99,
        stepCount: 1
      };

      mockRef.mockReturnValue({ fullPath: 'test-path' });
      mockUploadBytes.mockRejectedValue(new Error('Upload failed'));

      const result = await uploadManual({
        manual: mockManual,
        steps: [],
        materials: [],
        userId: 'user1'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('unknown');
    });

    it('should reject invalid manual data', async () => {
      const invalidManual = {
        id: 'test-manual-1',
        // Missing required fields
      } as Manual;

      const result = await uploadManual({
        manual: invalidManual,
        steps: [],
        materials: [],
        userId: 'user1'
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Manual validation failed');
    });
  });

  describe('getManual', () => {
    it('should successfully retrieve a manual', async () => {
      const mockManualData = {
        id: 'test-manual-1',
        productName: 'Test Product',
        thumbnailURL: 'https://example.com/thumb.jpg',
        firebaseManualPath: 'manuals/demo/test-manual-1',
        firebaseImagePath: 'manuals/demo/test-manual-1/images',
        createdAt: '2024-01-01T00:00:00.000Z',
        totalPrice: 99.99,
        stepCount: 1
      };

      const mockStepsData = [
        {
          stepNumber: 1,
          title: 'Step 1',
          description: 'First step',
          imageURL: 'https://example.com/step1.jpg',
          estimatedTime: 10,
          tools: ['hammer']
        }
      ];

      const mockMaterialsData = [
        {
          id: 'material-1',
          name: 'Wood',
          description: 'Pine wood',
          quantity: 1,
          unitPrice: 10.00,
          totalPrice: 10.00,
          imageURL: 'https://example.com/wood.jpg',
          category: 'Hardware'
        }
      ];

      mockRef.mockReturnValue({ fullPath: 'test-path' });
      mockGetBytes
        .mockResolvedValueOnce(new TextEncoder().encode(JSON.stringify(mockManualData)))
        .mockResolvedValueOnce(new TextEncoder().encode(JSON.stringify(mockStepsData)))
        .mockResolvedValueOnce(new TextEncoder().encode(JSON.stringify(mockMaterialsData)));

      const result = await getManual('test-manual-1', true);

      expect(result.success).toBe(true);
      expect(result.data.manual.id).toBe('test-manual-1');
      expect(result.data.steps).toHaveLength(1);
      expect(result.data.materials).toHaveLength(1);
    });

    it('should handle retrieval errors gracefully', async () => {
      mockRef.mockReturnValue({ fullPath: 'test-path' });
      mockGetBytes.mockRejectedValue(new Error('File not found'));

      const result = await getManual('nonexistent-manual', true);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getManualsList', () => {
    it('should successfully retrieve manuals list', async () => {
      const mockManualData = {
        id: 'test-manual-1',
        productName: 'Test Product',
        thumbnailURL: 'https://example.com/thumb.jpg',
        firebaseManualPath: 'manuals/demo/test-manual-1',
        firebaseImagePath: 'manuals/demo/test-manual-1/images',
        createdAt: '2024-01-01T00:00:00.000Z',
        totalPrice: 99.99,
        stepCount: 1
      };

      mockRef.mockReturnValue({ fullPath: 'test-path' });
      mockListAll.mockResolvedValue({
        prefixes: [
          { fullPath: 'manuals/demo/test-manual-1', name: 'test-manual-1' }
        ],
        items: []
      });
      mockGetBytes.mockResolvedValue(new TextEncoder().encode(JSON.stringify(mockManualData)));

      const result = await getManualsList(true);

      expect(result.success).toBe(true);
      expect(result.data.manuals).toHaveLength(1);
      expect(result.data.manuals[0].id).toBe('test-manual-1');
      expect(result.data.total).toBe(1);
    });

    it('should handle empty manuals list', async () => {
      mockRef.mockReturnValue({ fullPath: 'test-path' });
      mockListAll.mockResolvedValue({
        prefixes: [],
        items: []
      });

      const result = await getManualsList(true);

      expect(result.success).toBe(true);
      expect(result.data.manuals).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });

    it('should handle list retrieval errors', async () => {
      mockRef.mockReturnValue({ fullPath: 'test-path' });
      mockListAll.mockRejectedValue(new Error('Access denied'));

      const result = await getManualsList(true);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('STORAGE_PATHS constants', () => {
    it('should have correct storage path constants', () => {
      expect(STORAGE_PATHS.MANUALS.DEMO).toBe('manuals/demo');
      expect(STORAGE_PATHS.MANUALS.GENERATED).toBe('manuals/generated');
      expect(STORAGE_PATHS.IMAGES.THUMBNAILS).toBe('images/thumbnails');
      expect(STORAGE_PATHS.IMAGES.STEPS).toBe('images/steps');
    });
  });
});