import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  generateManual,
  generateManualWithRetry,
  validateProductIdea,
  estimateGenerationTime,
  getGenerationStatusMessage,
  validateMaterialPricing,
  estimateMaterialPrice,
  generateMaterialSearchURL,
  analyzeContentQuality,
  MATERIAL_CATEGORIES,
  PRICING_RANGES,
  CONTENT_VALIDATION
} from '../manualGeneration';
import { 
  testGeminiConnection,
  generateWithGemini,
  validateApiKey,
  getGeminiStatus,
  GEMINI_CONFIG
} from '../gemini';
import { GenerateManualRequest } from '../../types';
import { model } from '../gemini';

// Mock the Firebase storage service
vi.mock('../firebaseStorage', () => ({
  uploadManual: vi.fn().mockResolvedValue({
    success: true,
    data: {
      success: true,
      firebasePath: 'manuals/generated/user1/test-manual',
      manualId: 'test-manual'
    }
  })
}));

// Mock the Gemini model and new functions
vi.mock('../gemini', () => ({
  model: {
    generateContent: vi.fn()
  },
  GEMINI_CONFIG: {
    MODEL: 'gemini-pro',
    MAX_RETRIES: 3,
    TIMEOUT: 30000,
    MAX_TOKENS: 4096,
    TEMPERATURE: 0.7,
    TOP_K: 40,
    TOP_P: 0.95,
  },
  GENERATION_CONFIG: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 4096,
  },
  SAFETY_SETTINGS: [],
  testGeminiConnection: vi.fn(),
  generateWithGemini: vi.fn(),
  validateApiKey: vi.fn(),
  getGeminiStatus: vi.fn(),
}));

describe('Manual Generation Service', () => {
  const mockGenerateContent = vi.mocked(model.generateContent);

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment for tests
    process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyTest123456789';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateProductIdea', () => {
    it('should validate a correct product idea', () => {
      const validIdea = 'Custom wooden desk lamp';
      const result = validateProductIdea(validIdea);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty product idea', () => {
      const result = validateProductIdea('');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product idea cannot be empty');
    });

    it('should reject product idea that is too short', () => {
      const result = validateProductIdea('ab');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product idea must be at least 3 characters long');
    });

    it('should reject product idea that is too long', () => {
      const longIdea = 'a'.repeat(201);
      const result = validateProductIdea(longIdea);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product idea must be less than 200 characters');
    });

    it('should reject inappropriate content', () => {
      const result = validateProductIdea('How to make a bomb');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product idea contains inappropriate content');
    });

    it('should reject non-string input', () => {
      const result = validateProductIdea(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product idea must be a string');
    });

    it('should handle whitespace-only input', () => {
      const result = validateProductIdea('   ');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product idea cannot be empty');
    });
  });

  describe('generateManual', () => {
    const validRequest: GenerateManualRequest = {
      productIdea: 'Custom wooden desk lamp',
      userId: 'user123'
    };

    const mockGeminiResponse = {
      projectName: 'Custom Wooden Desk Lamp',
      estimatedTotalTime: 120,
      steps: [
        {
          stepNumber: 1,
          title: 'Prepare the Base',
          description: 'Cut and sand the wooden base',
          estimatedTime: 30,
          tools: ['saw', 'sandpaper'],
          notes: 'Wear safety glasses'
        },
        {
          stepNumber: 2,
          title: 'Install Wiring',
          description: 'Install electrical components',
          estimatedTime: 45,
          tools: ['wire strippers', 'screwdriver'],
          notes: 'Turn off power before working'
        }
      ],
      materials: [
        {
          id: 'wood-base-001',
          name: 'Oak Wood Base',
          description: 'Solid oak base for lamp',
          quantity: 1,
          unitPrice: 25.99,
          totalPrice: 25.99,
          category: 'Hardware'
        },
        {
          id: 'led-bulb-001',
          name: 'LED Bulb',
          description: '9W LED bulb',
          quantity: 1,
          unitPrice: 12.99,
          totalPrice: 12.99,
          category: 'Electronics'
        }
      ]
    };

    it('should successfully generate a manual', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockGeminiResponse)
        }
      });

      const result = await generateManual(validRequest);

      expect(result.success).toBe(true);
      expect(result.data.manualId).toBeDefined();
      expect(result.data.steps).toHaveLength(2);
      expect(result.data.materials).toHaveLength(2);
      expect(result.data.totalPrice).toBe(38.98);
    });

    it('should handle empty product idea', async () => {
      const invalidRequest = {
        ...validRequest,
        productIdea: ''
      };

      const result = await generateManual(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Product idea cannot be empty');
    });

    it('should handle empty user ID', async () => {
      const invalidRequest = {
        ...validRequest,
        userId: ''
      };

      const result = await generateManual(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('User ID is required');
    });

    it('should handle Gemini API errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API quota exceeded'));

      const result = await generateManual(validRequest);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('ai_generation');
      expect(result.error?.message).toContain('API quota exceeded');
    });

    it('should handle invalid JSON response from Gemini', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Invalid JSON response'
        }
      });

      const result = await generateManual(validRequest);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid JSON response from AI');
    });

    it('should handle empty response from Gemini', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => ''
        }
      });

      const result = await generateManual(validRequest);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Empty response from Gemini AI');
    });

    it('should validate Gemini response structure', async () => {
      const invalidResponse = {
        // Missing required fields
        projectName: 'Test Project'
        // Missing steps and materials
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(invalidResponse)
        }
      });

      const result = await generateManual(validRequest);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid AI response structure');
    });

    it('should handle materials with incorrect price calculations', async () => {
      const responseWithBadPrices = {
        ...mockGeminiResponse,
        materials: [
          {
            id: 'material-1',
            name: 'Test Material',
            description: 'Test description',
            quantity: 2,
            unitPrice: 10.00,
            totalPrice: 15.00, // Should be 20.00
            category: 'Hardware'
          }
        ]
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(responseWithBadPrices)
        }
      });

      const result = await generateManual(validRequest);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('totalPrice doesn\'t match quantity × unitPrice');
    });

    it('should clean markdown formatting from response', async () => {
      const responseWithMarkdown = `\`\`\`json\n${JSON.stringify(mockGeminiResponse)}\n\`\`\``;

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => responseWithMarkdown
        }
      });

      const result = await generateManual(validRequest);

      expect(result.success).toBe(true);
      expect(result.data.steps).toHaveLength(2);
    });
  });

  describe('generateManualWithRetry', () => {
    const validRequest: GenerateManualRequest = {
      productIdea: 'Custom wooden desk lamp',
      userId: 'user123'
    };

    it('should succeed on first attempt', async () => {
      const mockResponse = {
        projectName: 'Test Project',
        estimatedTotalTime: 60,
        steps: [{
          stepNumber: 1,
          title: 'Step 1',
          description: 'Test step',
          estimatedTime: 30,
          tools: ['hammer']
        }],
        materials: [{
          id: 'material-1',
          name: 'Test Material',
          description: 'Test description',
          quantity: 1,
          unitPrice: 10.00,
          totalPrice: 10.00,
          category: 'Hardware'
        }]
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse)
        }
      });

      const result = await generateManualWithRetry(validRequest, 2);

      expect(result.success).toBe(true);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      mockGenerateContent
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              projectName: 'Test Project',
              estimatedTotalTime: 60,
              steps: [{
                stepNumber: 1,
                title: 'Step 1',
                description: 'Test step',
                estimatedTime: 30,
                tools: ['hammer']
              }],
              materials: [{
                id: 'material-1',
                name: 'Test Material',
                description: 'Test description',
                quantity: 1,
                unitPrice: 10.00,
                totalPrice: 10.00,
                category: 'Hardware'
              }]
            })
          }
        });

      const result = await generateManualWithRetry(validRequest, 2);

      expect(result.success).toBe(true);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Persistent network error'));

      const result = await generateManualWithRetry(validRequest, 1);

      expect(result.success).toBe(false);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });
  });

  describe('estimateGenerationTime', () => {
    it('should return base time for short ideas', () => {
      const time = estimateGenerationTime('lamp');
      expect(time).toBe(15000); // Base time
    });

    it('should increase time for longer ideas', () => {
      const longIdea = 'a'.repeat(100);
      const time = estimateGenerationTime(longIdea);
      expect(time).toBeGreaterThan(15000);
    });

    it('should cap at maximum multiplier', () => {
      const veryLongIdea = 'a'.repeat(500);
      const time = estimateGenerationTime(veryLongIdea);
      expect(time).toBeLessThanOrEqual(60000); // 15000 * 4 (max multiplier)
    });
  });

  describe('getGenerationStatusMessage', () => {
    it('should return correct messages for each stage', () => {
      expect(getGenerationStatusMessage('validating')).toBe('Validating your project idea...');
      expect(getGenerationStatusMessage('generating')).toBe('AI is creating your build manual...');
      expect(getGenerationStatusMessage('processing')).toBe('Processing generated content...');
      expect(getGenerationStatusMessage('uploading')).toBe('Saving your manual...');
    });

    it('should return default message for unknown stage', () => {
      expect(getGenerationStatusMessage('unknown' as any)).toBe('Generating manual...');
    });
  });

  describe('Material Pricing Utilities', () => {
    describe('validateMaterialPricing', () => {
      it('should validate correct pricing within range', () => {
        const material = {
          category: 'Hardware',
          unitPrice: 25.00
        };
        
        const result = validateMaterialPricing(material);
        expect(result.isValid).toBe(true);
        expect(result.warning).toBeUndefined();
      });

      it('should detect price too low', () => {
        const material = {
          category: 'Hardware',
          unitPrice: 0.50
        };
        
        const result = validateMaterialPricing(material);
        expect(result.isValid).toBe(false);
        expect(result.adjustedPrice).toBe(PRICING_RANGES.Hardware.min);
        expect(result.warning).toContain('Price too low');
      });

      it('should detect price too high', () => {
        const material = {
          category: 'Electronics',
          unitPrice: 1000.00
        };
        
        const result = validateMaterialPricing(material);
        expect(result.isValid).toBe(false);
        expect(result.adjustedPrice).toBe(PRICING_RANGES.Electronics.max);
        expect(result.warning).toContain('Price too high');
      });

      it('should handle unknown category', () => {
        const material = {
          category: 'UnknownCategory',
          unitPrice: 25.00
        };
        
        const result = validateMaterialPricing(material);
        expect(result.isValid).toBe(true);
        expect(result.warning).toContain('Unknown category');
      });
    });

    describe('estimateMaterialPrice', () => {
      it('should estimate price within category range', () => {
        const price = estimateMaterialPrice('Wood Plank', 'Hardware', 1);
        expect(price).toBeGreaterThanOrEqual(PRICING_RANGES.Hardware.min);
        expect(price).toBeLessThanOrEqual(PRICING_RANGES.Hardware.max);
      });

      it('should adjust for premium materials', () => {
        const basicPrice = estimateMaterialPrice('Wood Plank', 'Hardware', 1);
        const premiumPrice = estimateMaterialPrice('Premium Wood Plank', 'Hardware', 1);
        expect(premiumPrice).toBeGreaterThan(basicPrice);
      });

      it('should apply bulk discounts', () => {
        const singlePrice = estimateMaterialPrice('Screw', 'Fasteners', 1);
        const bulkPrice = estimateMaterialPrice('Screw', 'Fasteners', 20);
        expect(bulkPrice).toBeLessThanOrEqual(singlePrice);
      });

      it('should handle unknown category with fallback', () => {
        const price = estimateMaterialPrice('Unknown Item', 'UnknownCategory', 1);
        expect(price).toBe(10.00);
      });
    });

    describe('generateMaterialSearchURL', () => {
      it('should generate valid Amazon search URL', () => {
        const url = generateMaterialSearchURL('Wood Plank', 'Hardware');
        expect(url).toContain('amazon.com/s?k=');
        expect(url).toContain('Wood%20Plank');
        expect(url).toContain('Hardware');
        expect(url).toContain('DIY');
      });

      it('should handle special characters in material name', () => {
        const url = generateMaterialSearchURL('2" x 4" Pine Board', 'Hardware');
        expect(url).toContain('amazon.com/s?k=');
        expect(url).toContain('2%22');
      });
    });
  });

  describe('Content Quality Analysis', () => {
    describe('analyzeContentQuality', () => {
      const goodResponse = {
        steps: [
          { estimatedTime: 15, notes: 'Safety first' },
          { estimatedTime: 20, notes: 'Use proper tools' },
          { estimatedTime: 25, notes: 'Check alignment' }
        ],
        materials: [
          { totalPrice: 15.99, category: 'Hardware' },
          { totalPrice: 25.50, category: 'Electronics' },
          { totalPrice: 8.99, category: 'Fasteners' }
        ]
      };

      it('should analyze good quality content', () => {
        const analysis = analyzeContentQuality(goodResponse);
        expect(analysis.score).toBeGreaterThan(80);
        expect(analysis.strengths.length).toBeGreaterThan(0);
        expect(analysis.strengths).toContain('Well-paced step timing');
        expect(analysis.strengths).toContain('Good safety and tip coverage');
      });

      it('should detect quick steps', () => {
        const quickStepsResponse = {
          ...goodResponse,
          steps: [
            { estimatedTime: 5, notes: 'Quick step' },
            { estimatedTime: 3, notes: 'Another quick step' }
          ]
        };
        
        const analysis = analyzeContentQuality(quickStepsResponse);
        expect(analysis.score).toBeLessThan(100);
        expect(analysis.suggestions).toContain('Steps seem too quick - consider more detailed instructions');
      });

      it('should detect expensive projects', () => {
        const expensiveResponse = {
          ...goodResponse,
          materials: [
            { totalPrice: 200.00, category: 'Electronics' },
            { totalPrice: 300.00, category: 'Hardware' }
          ]
        };
        
        const analysis = analyzeContentQuality(expensiveResponse);
        expect(analysis.suggestions).toContain('Project cost is high - consider budget alternatives');
      });

      it('should handle invalid response', () => {
        const analysis = analyzeContentQuality(null);
        expect(analysis.score).toBe(0);
        expect(analysis.suggestions).toContain('Invalid response');
      });
    });
  });

  describe('Constants and Configuration', () => {
    it('should have valid material categories', () => {
      expect(MATERIAL_CATEGORIES).toContain('Hardware');
      expect(MATERIAL_CATEGORIES).toContain('Electronics');
      expect(MATERIAL_CATEGORIES).toContain('Tools');
      expect(MATERIAL_CATEGORIES.length).toBeGreaterThan(5);
    });

    it('should have valid pricing ranges', () => {
      expect(PRICING_RANGES.Hardware.min).toBeGreaterThan(0);
      expect(PRICING_RANGES.Hardware.max).toBeGreaterThan(PRICING_RANGES.Hardware.min);
      expect(PRICING_RANGES.Electronics.max).toBeGreaterThan(PRICING_RANGES.Hardware.max);
    });

    it('should have valid content validation limits', () => {
      expect(CONTENT_VALIDATION.MIN_STEPS).toBeGreaterThan(0);
      expect(CONTENT_VALIDATION.MAX_STEPS).toBeGreaterThan(CONTENT_VALIDATION.MIN_STEPS);
      expect(CONTENT_VALIDATION.MIN_MATERIALS).toBeGreaterThan(0);
      expect(CONTENT_VALIDATION.MAX_MATERIALS).toBeGreaterThan(CONTENT_VALIDATION.MIN_MATERIALS);
    });
  });
});

describe('Gemini AI Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyTest123456789';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('testGeminiConnection', () => {
    it('should test successful connection', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => 'OK, I can hear you.'
        }
      });
      
      vi.mocked(model.generateContent).mockImplementation(mockGenerateContent);

      const result = await testGeminiConnection();
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle connection failure', async () => {
      const mockGenerateContent = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.mocked(model.generateContent).mockImplementation(mockGenerateContent);

      const result = await testGeminiConnection();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle missing API key', async () => {
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = '';
      
      const result = await testGeminiConnection();
      expect(result.success).toBe(false);
      expect(result.error).toBe('API key not configured');
    });
  });

  describe('generateWithGemini', () => {
    it('should generate content successfully', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => 'Generated content response'
        }
      });
      
      vi.mocked(model.generateContent).mockImplementation(mockGenerateContent);

      const result = await generateWithGemini('Test prompt');
      expect(result.success).toBe(true);
      expect(result.content).toBe('Generated content response');
    });

    it('should handle empty prompt', async () => {
      const result = await generateWithGemini('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Prompt cannot be empty');
    });

    it('should handle API errors', async () => {
      const mockGenerateContent = vi.fn().mockRejectedValue(new Error('API quota exceeded'));
      vi.mocked(model.generateContent).mockImplementation(mockGenerateContent);

      const result = await generateWithGemini('Test prompt');
      expect(result.success).toBe(false);
      expect(result.error).toBe('API quota exceeded');
    });

    it('should handle safety filter blocks', async () => {
      const mockGenerateContent = vi.fn().mockRejectedValue(new Error('Content blocked by safety filters'));
      vi.mocked(model.generateContent).mockImplementation(mockGenerateContent);

      const result = await generateWithGemini('Inappropriate content');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Content blocked by safety filters');
    });
  });

  describe('validateApiKey', () => {
    it('should validate correct API key format', () => {
      const result = validateApiKey('AIzaSyTest123456789');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty API key', () => {
      const result = validateApiKey('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('API key is required');
    });

    it('should reject short API key', () => {
      const result = validateApiKey('AI123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('API key appears to be too short');
    });

    it('should reject invalid format', () => {
      const result = validateApiKey('invalid-key-format');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('API key format appears invalid');
    });

    it('should reject non-string input', () => {
      const result = validateApiKey(123 as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('API key must be a string');
    });
  });

  describe('getGeminiStatus', () => {
    it('should return correct status with valid API key', () => {
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyTest123456789';
      
      const status = getGeminiStatus();
      expect(status.configured).toBe(true);
      expect(status.apiKeyValid).toBe(true);
      expect(status.model).toBe(GEMINI_CONFIG.MODEL);
      expect(status.config).toBeDefined();
    });

    it('should return correct status with missing API key', () => {
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = '';
      
      const status = getGeminiStatus();
      expect(status.configured).toBe(false);
      expect(status.apiKeyValid).toBe(false);
    });

    it('should return correct status with invalid API key', () => {
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'invalid-key';
      
      const status = getGeminiStatus();
      expect(status.configured).toBe(true);
      expect(status.apiKeyValid).toBe(false);
    });
  });

  describe('Integration with Manual Generation', () => {
    it('should handle various product ideas', async () => {
      const testCases = [
        'wooden desk lamp',
        'smart home sensor',
        'garden planter box',
        'phone charging station'
      ];

      const mockResponse = {
        projectName: 'Test Project',
        estimatedTotalTime: 120,
        steps: [
          {
            stepNumber: 1,
            title: 'Prepare Materials',
            description: 'Gather all required materials and tools',
            estimatedTime: 30,
            tools: ['screwdriver', 'drill'],
            notes: 'Ensure workspace is clean'
          }
        ],
        materials: [
          {
            id: 'material-1',
            name: 'Wood Board',
            description: '2x4 pine board',
            quantity: 2,
            unitPrice: 8.99,
            totalPrice: 17.98,
            category: 'Hardware'
          }
        ]
      };

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse)
        }
      });
      
      vi.mocked(model.generateContent).mockImplementation(mockGenerateContent);

      for (const productIdea of testCases) {
        const result = await generateManual({
          productIdea,
          userId: 'test-user'
        });

        expect(result.success).toBe(true);
        expect(result.data.steps.length).toBeGreaterThan(0);
        expect(result.data.materials.length).toBeGreaterThan(0);
        expect(result.data.totalPrice).toBeGreaterThan(0);
      }
    });

    it('should handle error scenarios gracefully', async () => {
      const errorScenarios = [
        { error: new Error('API quota exceeded'), expectedType: 'ai_generation' },
        { error: new Error('network timeout'), expectedType: 'network' },
        { error: new Error('safety filter triggered'), expectedType: 'ai_generation' }
      ];

      for (const scenario of errorScenarios) {
        const mockGenerateContent = vi.fn().mockRejectedValue(scenario.error);
        vi.mocked(model.generateContent).mockImplementation(mockGenerateContent);

        const result = await generateManual({
          productIdea: 'test project',
          userId: 'test-user'
        });

        expect(result.success).toBe(false);
        expect(result.error?.type).toBe(scenario.expectedType);
      }
    });

    it('should validate AI response structure', async () => {
      const invalidResponses = [
        '{"invalid": "structure"}',
        '{"projectName": "Test", "steps": [], "materials": []}', // Empty arrays
        '{"projectName": "", "steps": [{}], "materials": [{}]}', // Invalid step/material
      ];

      for (const invalidResponse of invalidResponses) {
        const mockGenerateContent = vi.fn().mockResolvedValue({
          response: {
            text: () => invalidResponse
          }
        });
        
        vi.mocked(model.generateContent).mockImplementation(mockGenerateContent);

        const result = await generateManual({
          productIdea: 'test project',
          userId: 'test-user'
        });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Invalid AI response structure');
      }
    });
  });
});