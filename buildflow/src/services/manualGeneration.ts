import { model } from './gemini';
import { uploadManual } from './firebaseStorage';
import {
  Manual,
  Step,
  Material,
  GenerateManualRequest,
  GenerateManualResponse,
  ApiResponse,
  ErrorState,
  ErrorType
} from '../types';

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

// Material categories for consistent classification
export const MATERIAL_CATEGORIES = [
  'Hardware',
  'Electronics', 
  'Accessories',
  'Tools',
  'Fasteners',
  'Materials',
  'Components'
] as const;

// Pricing estimation ranges for different categories
export const PRICING_RANGES = {
  Hardware: { min: 1.00, max: 100.00 },
  Electronics: { min: 5.00, max: 500.00 },
  Accessories: { min: 0.50, max: 50.00 },
  Tools: { min: 10.00, max: 200.00 },
  Fasteners: { min: 0.10, max: 20.00 },
  Materials: { min: 2.00, max: 150.00 },
  Components: { min: 1.00, max: 300.00 }
} as const;

// Content validation patterns
export const CONTENT_VALIDATION = {
  MIN_STEPS: 3,
  MAX_STEPS: 12,
  MIN_MATERIALS: 3,
  MAX_MATERIALS: 20,
  MIN_STEP_TIME: 5,
  MAX_STEP_TIME: 180,
  MIN_TOTAL_TIME: 30,
  MAX_TOTAL_TIME: 600
} as const;



// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

function createErrorState(type: ErrorType, message: string, details?: any): ErrorState {
  return {
    type,
    message,
    details,
    timestamp: new Date(),
    retryable: type === ErrorType.NETWORK || type === ErrorType.AI_GENERATION
  };
}

function handleGeminiError(error: any): ErrorState {
  console.error('Gemini AI Error:', error);
  
  if (error.message) {
    if (error.message.includes('API key')) {
      return createErrorState(ErrorType.AI_GENERATION, 'Invalid API key configuration', error);
    }
    if (error.message.includes('quota')) {
      return createErrorState(ErrorType.AI_GENERATION, 'API quota exceeded', error);
    }
    if (error.message.includes('safety')) {
      return createErrorState(ErrorType.AI_GENERATION, 'Content blocked by safety filters', error);
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return createErrorState(ErrorType.NETWORK, 'Network error connecting to AI service', error);
    }
    
    // For validation errors and other specific errors, preserve the original message
    if (error.message.includes('Product idea') || 
        error.message.includes('User ID') || 
        error.message.includes('Invalid JSON') ||
        error.message.includes('Empty response') ||
        error.message.includes('Invalid AI response') ||
        error.message.includes('totalPrice')) {
      return createErrorState(ErrorType.AI_GENERATION, error.message, error);
    }
  }
  
  return createErrorState(ErrorType.AI_GENERATION, 'AI generation failed', error);
}

// ============================================================================
// PROMPT ENGINEERING
// ============================================================================

/**
 * Enhanced prompt engineering for consistent manual structure
 */
function createManualGenerationPrompt(productIdea: string): string {
  const categoriesList = MATERIAL_CATEGORIES.join('|');
  
  return `You are an expert DIY project designer and technical writer. Create a comprehensive build manual for: "${productIdea}"

CRITICAL INSTRUCTIONS:
1. Respond ONLY with valid JSON - no markdown, explanations, or additional text
2. Follow the exact structure specified below
3. Ensure all pricing is realistic and accurate
4. Make instructions clear and actionable for DIY enthusiasts

REQUIRED JSON STRUCTURE:
{
  "projectName": "Clear, descriptive project name",
  "estimatedTotalTime": 120,
  "steps": [
    {
      "stepNumber": 1,
      "title": "Concise step title (max 50 chars)",
      "description": "Detailed, specific instructions with measurements and techniques. Include safety considerations.",
      "estimatedTime": 15,
      "tools": ["Specific tool names"],
      "notes": "Safety warnings, tips, or important considerations"
    }
  ],
  "materials": [
    {
      "id": "descriptive-kebab-case-id",
      "name": "Specific material name with brand/model if relevant",
      "description": "Detailed description including dimensions, specifications, and purpose",
      "quantity": 1,
      "unitPrice": 12.99,
      "totalPrice": 12.99,
      "category": "${categoriesList}"
    }
  ]
}

DETAILED REQUIREMENTS:

STEPS (${CONTENT_VALIDATION.MIN_STEPS}-${CONTENT_VALIDATION.MAX_STEPS} steps):
- Each step should be ${CONTENT_VALIDATION.MIN_STEP_TIME}-${CONTENT_VALIDATION.MAX_STEP_TIME} minutes
- Include specific measurements, angles, or quantities
- Mention safety precautions for power tools or hazardous materials
- Ensure logical progression from preparation to completion
- Include quality checks or verification points

MATERIALS (${CONTENT_VALIDATION.MIN_MATERIALS}-${CONTENT_VALIDATION.MAX_MATERIALS} items):
- Use realistic market pricing (check current prices)
- Include specific dimensions, grades, or specifications
- Ensure quantities match project requirements
- Calculate totalPrice = quantity × unitPrice exactly
- Choose appropriate categories from: ${categoriesList}
- Include both consumables and reusable items

TOOLS:
- List specific tools needed for each step
- Include both hand tools and power tools as appropriate
- Mention tool alternatives when possible

PRICING GUIDELINES:
- Hardware: $${PRICING_RANGES.Hardware.min}-$${PRICING_RANGES.Hardware.max}
- Electronics: $${PRICING_RANGES.Electronics.min}-$${PRICING_RANGES.Electronics.max}
- Tools: $${PRICING_RANGES.Tools.min}-$${PRICING_RANGES.Tools.max}
- Materials: $${PRICING_RANGES.Materials.min}-$${PRICING_RANGES.Materials.max}

QUALITY STANDARDS:
- Total project time: ${CONTENT_VALIDATION.MIN_TOTAL_TIME}-${CONTENT_VALIDATION.MAX_TOTAL_TIME} minutes
- Instructions should be beginner-friendly but thorough
- Include troubleshooting tips in notes where relevant
- Ensure project is achievable with common DIY skills

Generate the manual for: "${productIdea}"`;
}

/**
 * Create a simplified prompt for quick generation (fallback)
 */
function createSimpleManualPrompt(productIdea: string): string {
  return `Create a simple DIY manual for "${productIdea}". Respond with JSON only:

{
  "projectName": "Project name",
  "estimatedTotalTime": 90,
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step title",
      "description": "Clear instructions",
      "estimatedTime": 20,
      "tools": ["tool1", "tool2"],
      "notes": "Safety notes"
    }
  ],
  "materials": [
    {
      "id": "material-1",
      "name": "Material name",
      "description": "Material description",
      "quantity": 1,
      "unitPrice": 10.00,
      "totalPrice": 10.00,
      "category": "Hardware"
    }
  ]
}

Make it practical and affordable for "${productIdea}".`;
}

// ============================================================================
// DATA PROCESSING AND VALIDATION
// ============================================================================

/**
 * Enhanced validation with content quality checks
 */
function validateGeminiResponse(response: any): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!response || typeof response !== 'object') {
    errors.push('Response must be a valid object');
    return { isValid: false, errors, warnings };
  }
  
  // Validate project name
  if (!response.projectName || typeof response.projectName !== 'string') {
    errors.push('Missing or invalid projectName');
  } else {
    if (response.projectName.length < 5) {
      warnings.push('Project name is quite short');
    }
    if (response.projectName.length > 100) {
      errors.push('Project name is too long (max 100 characters)');
    }
  }
  
  // Validate estimated total time
  if (typeof response.estimatedTotalTime !== 'number' || response.estimatedTotalTime <= 0) {
    errors.push('Missing or invalid estimatedTotalTime');
  } else {
    if (response.estimatedTotalTime < CONTENT_VALIDATION.MIN_TOTAL_TIME) {
      warnings.push(`Total time seems low (${response.estimatedTotalTime} min)`);
    }
    if (response.estimatedTotalTime > CONTENT_VALIDATION.MAX_TOTAL_TIME) {
      warnings.push(`Total time seems high (${response.estimatedTotalTime} min)`);
    }
  }
  
  // Validate steps array
  if (!Array.isArray(response.steps) || response.steps.length === 0) {
    errors.push('Steps must be a non-empty array');
  } else {
    if (response.steps.length < CONTENT_VALIDATION.MIN_STEPS) {
      warnings.push(`Few steps for a DIY project (${response.steps.length})`);
    }
    if (response.steps.length > CONTENT_VALIDATION.MAX_STEPS) {
      warnings.push(`Many steps for a DIY project (${response.steps.length})`);
    }
    
    response.steps.forEach((step: any, index: number) => {
      if (typeof step.stepNumber !== 'number' || step.stepNumber !== index + 1) {
        errors.push(`Step ${index + 1}: Invalid stepNumber`);
      }
      if (!step.title || typeof step.title !== 'string') {
        errors.push(`Step ${index + 1}: Missing or invalid title`);
      } else if (step.title.length > 50) {
        warnings.push(`Step ${index + 1}: Title is quite long`);
      }
      
      if (!step.description || typeof step.description !== 'string') {
        errors.push(`Step ${index + 1}: Missing or invalid description`);
      } else if (step.description.length < 20) {
        warnings.push(`Step ${index + 1}: Description seems brief`);
      }
      
      if (typeof step.estimatedTime !== 'number' || step.estimatedTime <= 0) {
        errors.push(`Step ${index + 1}: Invalid estimatedTime`);
      } else {
        if (step.estimatedTime < CONTENT_VALIDATION.MIN_STEP_TIME) {
          warnings.push(`Step ${index + 1}: Very quick step (${step.estimatedTime} min)`);
        }
        if (step.estimatedTime > CONTENT_VALIDATION.MAX_STEP_TIME) {
          warnings.push(`Step ${index + 1}: Very long step (${step.estimatedTime} min)`);
        }
      }
      
      if (!Array.isArray(step.tools)) {
        errors.push(`Step ${index + 1}: Tools must be an array`);
      } else if (step.tools.length === 0) {
        warnings.push(`Step ${index + 1}: No tools specified`);
      }
    });
  }
  
  // Validate materials array
  if (!Array.isArray(response.materials) || response.materials.length === 0) {
    errors.push('Materials must be a non-empty array');
  } else {
    if (response.materials.length < CONTENT_VALIDATION.MIN_MATERIALS) {
      warnings.push(`Few materials for a DIY project (${response.materials.length})`);
    }
    if (response.materials.length > CONTENT_VALIDATION.MAX_MATERIALS) {
      warnings.push(`Many materials for a DIY project (${response.materials.length})`);
    }
    
    response.materials.forEach((material: any, index: number) => {
      if (!material.id || typeof material.id !== 'string') {
        errors.push(`Material ${index + 1}: Missing or invalid id`);
      }
      if (!material.name || typeof material.name !== 'string') {
        errors.push(`Material ${index + 1}: Missing or invalid name`);
      }
      if (!material.description || typeof material.description !== 'string') {
        errors.push(`Material ${index + 1}: Missing or invalid description`);
      } else if (material.description.length < 10) {
        warnings.push(`Material ${index + 1}: Brief description`);
      }
      
      if (typeof material.quantity !== 'number' || material.quantity <= 0) {
        errors.push(`Material ${index + 1}: Invalid quantity`);
      }
      if (typeof material.unitPrice !== 'number' || material.unitPrice < 0) {
        errors.push(`Material ${index + 1}: Invalid unitPrice`);
      }
      if (typeof material.totalPrice !== 'number' || material.totalPrice < 0) {
        errors.push(`Material ${index + 1}: Invalid totalPrice`);
      }
      
      if (!material.category || typeof material.category !== 'string') {
        errors.push(`Material ${index + 1}: Missing or invalid category`);
      } else if (!MATERIAL_CATEGORIES.includes(material.category as any)) {
        warnings.push(`Material ${index + 1}: Unusual category "${material.category}"`);
      }
      
      // Validate price calculation
      if (typeof material.quantity === 'number' && typeof material.unitPrice === 'number') {
        const expectedTotal = material.quantity * material.unitPrice;
        if (Math.abs(material.totalPrice - expectedTotal) > 0.01) {
          errors.push(`Material ${index + 1}: totalPrice doesn't match quantity × unitPrice`);
        }
        
        // Check pricing reasonableness
        if (material.unitPrice > 1000) {
          warnings.push(`Material ${index + 1}: Very expensive unit price ($${material.unitPrice})`);
        }
        if (material.totalPrice > 500) {
          warnings.push(`Material ${index + 1}: Very expensive total ($${material.totalPrice})`);
        }
      }
    });
  }
  
  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Sanitize and clean AI response content
 */
function sanitizeAIResponse(response: any): any {
  if (!response || typeof response !== 'object') {
    return response;
  }
  
  const sanitized = { ...response };
  
  // Clean project name
  if (sanitized.projectName && typeof sanitized.projectName === 'string') {
    sanitized.projectName = sanitized.projectName
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML
      .substring(0, 100); // Limit length
  }
  
  // Clean steps
  if (Array.isArray(sanitized.steps)) {
    sanitized.steps = sanitized.steps.map((step: any) => ({
      ...step,
      title: typeof step.title === 'string' ? 
        step.title.trim().replace(/[<>]/g, '').substring(0, 50) : step.title,
      description: typeof step.description === 'string' ? 
        step.description.trim().replace(/[<>]/g, '') : step.description,
      notes: typeof step.notes === 'string' ? 
        step.notes.trim().replace(/[<>]/g, '') : step.notes,
      tools: Array.isArray(step.tools) ? 
        step.tools.map((tool: any) => typeof tool === 'string' ? tool.trim() : tool) : step.tools
    }));
  }
  
  // Clean materials
  if (Array.isArray(sanitized.materials)) {
    sanitized.materials = sanitized.materials.map((material: any) => ({
      ...material,
      id: typeof material.id === 'string' ? 
        material.id.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') : material.id,
      name: typeof material.name === 'string' ? 
        material.name.trim().replace(/[<>]/g, '') : material.name,
      description: typeof material.description === 'string' ? 
        material.description.trim().replace(/[<>]/g, '') : material.description,
      category: typeof material.category === 'string' ? 
        material.category.trim() : material.category,
      // Round prices to 2 decimal places
      unitPrice: typeof material.unitPrice === 'number' ? 
        Math.round(material.unitPrice * 100) / 100 : material.unitPrice,
      totalPrice: typeof material.totalPrice === 'number' ? 
        Math.round(material.totalPrice * 100) / 100 : material.totalPrice
    }));
  }
  
  return sanitized;
}

function processGeminiResponse(rawResponse: any, _productIdea: string): {
  manual: Manual;
  steps: Step[];
  materials: Material[];
} {
  const manualId = `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  
  // Calculate total price from materials
  const totalPrice = rawResponse.materials.reduce(
    (sum: number, material: any) => sum + material.totalPrice,
    0
  );
  
  // Create Manual object
  const manual: Manual = {
    id: manualId,
    productName: rawResponse.projectName,
    thumbnailURL: '', // Will be set when image is uploaded
    firebaseManualPath: `manuals/generated/${manualId}`,
    firebaseImagePath: `manuals/generated/${manualId}/images`,
    createdAt: now,
    totalPrice: Math.round(totalPrice * 100) / 100, // Round to 2 decimal places
    stepCount: rawResponse.steps.length
  };
  
  // Process steps
  const steps: Step[] = rawResponse.steps.map((step: any) => ({
    stepNumber: step.stepNumber,
    title: step.title,
    description: step.description,
    imageURL: `${manual.firebaseImagePath}/steps/step-${step.stepNumber}.jpg`,
    estimatedTime: step.estimatedTime,
    tools: step.tools || [],
    notes: step.notes || undefined
  }));
  
  // Process materials
  const materials: Material[] = rawResponse.materials.map((material: any) => ({
    id: material.id,
    name: material.name,
    description: material.description,
    quantity: material.quantity,
    unitPrice: Math.round(material.unitPrice * 100) / 100,
    totalPrice: Math.round(material.totalPrice * 100) / 100,
    imageURL: `${manual.firebaseImagePath}/materials/${material.id}.jpg`,
    amazonURL: undefined, // Will be populated later if needed
    category: material.category
  }));
  
  return { manual, steps, materials };
}

// ============================================================================
// MAIN GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate a complete manual using Gemini AI
 */
export async function generateManual(request: GenerateManualRequest): Promise<ApiResponse<GenerateManualResponse>> {
  try {
    const { productIdea, userId } = request;
    
    // Validate input
    if (!productIdea || productIdea.trim().length === 0) {
      throw new Error('Product idea cannot be empty');
    }
    
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }
    
    // Call Gemini AI with enhanced error handling
    console.log('🤖 Generating manual with Gemini AI...');
    
    let parsedResponse: any;
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const currentPrompt = attempts === 1 ? 
          createManualGenerationPrompt(productIdea.trim()) : 
          createSimpleManualPrompt(productIdea.trim());
          
        console.log(`🔄 Generation attempt ${attempts}/${maxAttempts}`);
        
        const result = await model.generateContent(currentPrompt);
        
        const response = await result.response;
        const text = response.text();
        
        if (!text) {
          throw new Error('Empty response from Gemini AI');
        }
        
        // Parse JSON response with better cleaning
        try {
          // Enhanced cleaning for various response formats
          let cleanText = text
            .replace(/```json\n?/gi, '')
            .replace(/```\n?/g, '')
            .replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1') // Extract JSON object
            .trim();
            
          parsedResponse = JSON.parse(cleanText);
          
          // Sanitize the response
          parsedResponse = sanitizeAIResponse(parsedResponse);
          
          // Validate response structure
          const validation = validateGeminiResponse(parsedResponse);
          
          if (!validation.isValid) {
            console.warn('Validation errors:', validation.errors);
            if (attempts < maxAttempts) {
              console.log('🔄 Retrying with simpler prompt...');
              continue;
            }
            throw new Error(`Invalid AI response structure: ${validation.errors.join(', ')}`);
          }
          
          // Log warnings but continue
          if (validation.warnings.length > 0) {
            console.warn('Content warnings:', validation.warnings);
          }
          
          // Success - break out of retry loop
          break;
          
        } catch (parseError) {
          console.error('Failed to parse Gemini response:', text.substring(0, 200) + '...');
          if (attempts < maxAttempts) {
            console.log('🔄 Retrying with simpler prompt...');
            continue;
          }
          throw new Error(`Invalid JSON response from AI: ${parseError}`);
        }
        
      } catch (apiError: any) {
        console.error(`Attempt ${attempts} failed:`, apiError.message);
        if (attempts < maxAttempts && apiError.message?.includes('safety')) {
          console.log('🔄 Retrying with content safety adjustments...');
          continue;
        }
        throw apiError;
      }
    }
    
    // Process the response into our data models
    const { manual, steps, materials } = processGeminiResponse(parsedResponse, productIdea);
    
    // Upload to Firebase Storage
    console.log('📤 Uploading manual to Firebase...');
    const uploadResult = await uploadManual({
      manual,
      steps,
      materials,
      userId
    });
    
    if (!uploadResult.success) {
      throw new Error(`Failed to upload manual: ${uploadResult.error?.message}`);
    }
    
    console.log('✅ Manual generated and uploaded successfully');
    
    return {
      data: {
        manualId: manual.id,
        projectName: manual.productName,
        steps,
        materials,
        totalPrice: manual.totalPrice,
        firebasePath: uploadResult.data.firebasePath
      },
      success: true,
      timestamp: new Date()
    };
    
  } catch (error) {
    const errorState = handleGeminiError(error);
    console.error('Manual generation failed:', errorState);
    
    return {
      data: {
        manualId: '',
        projectName: '',
        steps: [],
        materials: [],
        totalPrice: 0,
        firebasePath: ''
      },
      success: false,
      error: errorState,
      timestamp: new Date()
    };
  }
}

/**
 * Generate manual with retry logic
 */
export async function generateManualWithRetry(
  request: GenerateManualRequest,
  maxRetries: number = 2
): Promise<ApiResponse<GenerateManualResponse>> {
  let lastError: ErrorState | undefined;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    console.log(`🔄 Manual generation attempt ${attempt}/${maxRetries + 1}`);
    
    const result = await generateManual(request);
    
    if (result.success) {
      return result;
    }
    
    lastError = result.error;
    
    // Don't retry if it's not a retryable error
    if (!result.error?.retryable || attempt > maxRetries) {
      break;
    }
    
    // Wait before retrying (exponential backoff)
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
    console.log(`⏳ Waiting ${delay}ms before retry...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  return {
    data: {
      manualId: '',
      projectName: '',
      steps: [],
      materials: [],
      totalPrice: 0,
      firebasePath: ''
    },
    success: false,
    error: lastError || createErrorState(ErrorType.UNKNOWN, 'Generation failed after retries'),
    timestamp: new Date()
  };
}

/**
 * Validate product idea before generation
 */
export function validateProductIdea(productIdea: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (typeof productIdea !== 'string') {
    errors.push('Product idea must be a string');
    return { isValid: false, errors };
  }
  
  const trimmed = productIdea.trim();
  
  if (trimmed.length === 0) {
    errors.push('Product idea cannot be empty');
  }
  
  if (trimmed.length > 0 && trimmed.length < 3) {
    errors.push('Product idea must be at least 3 characters long');
  }
  
  if (trimmed.length > 200) {
    errors.push('Product idea must be less than 200 characters');
  }
  
  // Check for inappropriate content (basic filtering)
  if (trimmed.length > 0) {
    const inappropriateWords = ['weapon', 'bomb', 'explosive', 'drug', 'illegal'];
    const lowerIdea = trimmed.toLowerCase();
    
    for (const word of inappropriateWords) {
      if (lowerIdea.includes(word)) {
        errors.push('Product idea contains inappropriate content');
        break;
      }
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

// ============================================================================
// MATERIAL PRICING AND ESTIMATION UTILITIES
// ============================================================================

/**
 * Validate material pricing against category ranges
 */
export function validateMaterialPricing(material: any): { isValid: boolean; adjustedPrice?: number; warning?: string } {
  if (!material.category || !material.unitPrice) {
    return { isValid: false };
  }
  
  const range = PRICING_RANGES[material.category as keyof typeof PRICING_RANGES];
  if (!range) {
    return { isValid: true, warning: `Unknown category: ${material.category}` };
  }
  
  const price = material.unitPrice;
  
  if (price < range.min) {
    return {
      isValid: false,
      adjustedPrice: range.min,
      warning: `Price too low for ${material.category} (min: $${range.min})`
    };
  }
  
  if (price > range.max) {
    return {
      isValid: false,
      adjustedPrice: range.max,
      warning: `Price too high for ${material.category} (max: $${range.max})`
    };
  }
  
  return { isValid: true };
}

/**
 * Estimate realistic pricing for materials based on category and description
 */
export function estimateMaterialPrice(name: string, category: string, quantity: number = 1): number {
  const range = PRICING_RANGES[category as keyof typeof PRICING_RANGES];
  if (!range) {
    return 10.00; // Default fallback price
  }
  
  const nameLower = name.toLowerCase();
  let basePrice = (range.min + range.max) / 2; // Start with category average
  
  // Adjust based on material keywords
  if (nameLower.includes('premium') || nameLower.includes('professional')) {
    basePrice *= 1.5;
  } else if (nameLower.includes('basic') || nameLower.includes('standard')) {
    basePrice *= 0.8;
  }
  
  // Adjust for quantity (bulk discounts)
  if (quantity > 10) {
    basePrice *= 0.9;
  } else if (quantity > 50) {
    basePrice *= 0.8;
  }
  
  // Ensure within range
  return Math.max(range.min, Math.min(range.max, Math.round(basePrice * 100) / 100));
}

/**
 * Generate Amazon-style search URLs for materials
 */
export function generateMaterialSearchURL(materialName: string, category: string): string {
  const searchTerm = encodeURIComponent(`${materialName} ${category} DIY`);
  return `https://www.amazon.com/s?k=${searchTerm}&ref=nb_sb_noss`;
}

// ============================================================================
// CONTENT QUALITY UTILITIES
// ============================================================================

/**
 * Analyze content quality and provide improvement suggestions
 */
export function analyzeContentQuality(response: any): {
  score: number;
  suggestions: string[];
  strengths: string[];
} {
  const suggestions: string[] = [];
  const strengths: string[] = [];
  let score = 100;
  
  if (!response) {
    return { score: 0, suggestions: ['Invalid response'], strengths: [] };
  }
  
  // Analyze steps quality
  if (Array.isArray(response.steps)) {
    const avgStepTime = response.steps.reduce((sum: number, step: any) => 
      sum + (step.estimatedTime || 0), 0) / response.steps.length;
    
    if (avgStepTime < 10) {
      suggestions.push('Steps seem too quick - consider more detailed instructions');
      score -= 10;
    } else if (avgStepTime > 30) {
      suggestions.push('Steps might be too complex - consider breaking them down');
      score -= 5;
    } else {
      strengths.push('Well-paced step timing');
    }
    
    const stepsWithNotes = response.steps.filter((step: any) => step.notes).length;
    if (stepsWithNotes / response.steps.length > 0.5) {
      strengths.push('Good safety and tip coverage');
    } else {
      suggestions.push('Consider adding more safety notes and tips');
      score -= 5;
    }
  }
  
  // Analyze materials quality
  if (Array.isArray(response.materials)) {
    const totalCost = response.materials.reduce((sum: number, material: any) => 
      sum + (material.totalPrice || 0), 0);
    
    if (totalCost < 20) {
      suggestions.push('Project cost seems low - verify material pricing');
      score -= 5;
    } else if (totalCost > 500) {
      suggestions.push('Project cost is high - consider budget alternatives');
      score -= 10;
    } else {
      strengths.push('Reasonable project cost');
    }
    
    const categoryCoverage = new Set(response.materials.map((m: any) => m.category)).size;
    if (categoryCoverage > 2) {
      strengths.push('Good variety of material types');
    }
  }
  
  return { score: Math.max(0, score), suggestions, strengths };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Estimate generation time based on complexity
 */
export function estimateGenerationTime(productIdea: string): number {
  const baseTime = 15000; // 15 seconds base
  
  // Only add complexity for longer ideas
  if (productIdea.length <= 10) {
    return baseTime;
  }
  
  const complexityMultiplier = Math.min((productIdea.length - 10) / 50, 3); // Max 3x multiplier
  return Math.round(baseTime * (1 + complexityMultiplier));
}

/**
 * Get generation status message
 */
export function getGenerationStatusMessage(stage: 'validating' | 'generating' | 'processing' | 'uploading'): string {
  switch (stage) {
    case 'validating':
      return 'Validating your project idea...';
    case 'generating':
      return 'AI is creating your build manual...';
    case 'processing':
      return 'Processing generated content...';
    case 'uploading':
      return 'Saving your manual...';
    default:
      return 'Generating manual...';
  }
}