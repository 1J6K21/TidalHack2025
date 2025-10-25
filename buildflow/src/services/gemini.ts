import { GoogleGenerativeAI, GenerativeModel, GenerationConfig, SafetySetting } from '@google/generative-ai';

// ============================================================================
// CONFIGURATION AND CONSTANTS
// ============================================================================

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn('NEXT_PUBLIC_GEMINI_API_KEY is not configured. AI features will not work.');
}

// Gemini AI Configuration
export const GEMINI_CONFIG = {
  MODEL: 'gemini-pro',
  MAX_RETRIES: 3,
  TIMEOUT: 30000,
  MAX_TOKENS: 4096,
  TEMPERATURE: 0.7,
  TOP_K: 40,
  TOP_P: 0.95,
} as const;

// Generation configuration for consistent manual structure
export const GENERATION_CONFIG: GenerationConfig = {
  temperature: GEMINI_CONFIG.TEMPERATURE,
  topK: GEMINI_CONFIG.TOP_K,
  topP: GEMINI_CONFIG.TOP_P,
  maxOutputTokens: GEMINI_CONFIG.MAX_TOKENS,
};

// Safety settings to ensure appropriate content
export const SAFETY_SETTINGS: SafetySetting[] = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
];

// ============================================================================
// GEMINI CLIENT INITIALIZATION
// ============================================================================

// Initialize Gemini AI with proper authentication
const genAI = new GoogleGenerativeAI(apiKey);

// Get the generative model with configuration
export const model: GenerativeModel = genAI.getGenerativeModel({ 
  model: GEMINI_CONFIG.MODEL,
  generationConfig: GENERATION_CONFIG,
  safetySettings: SAFETY_SETTINGS,
});

// ============================================================================
// SERVICE WRAPPER FUNCTIONS
// ============================================================================

/**
 * Test Gemini API connection and authentication
 */
export async function testGeminiConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!apiKey) {
      return { success: false, error: 'API key not configured' };
    }

    // Simple test prompt to verify connection
    const result = await model.generateContent({
      contents: [{ parts: [{ text: 'Hello, respond with "OK" if you can hear me.' }] }],
    });

    const response = await result.response;
    const text = response.text();

    if (text && text.toLowerCase().includes('ok')) {
      return { success: true };
    } else {
      return { success: false, error: 'Unexpected response from Gemini API' };
    }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to connect to Gemini API' 
    };
  }
}

/**
 * Generate content with Gemini AI using consistent configuration
 */
export async function generateWithGemini(prompt: string): Promise<{
  success: boolean;
  content?: string;
  error?: string;
}> {
  try {
    if (!apiKey) {
      return { success: false, error: 'Gemini API key not configured' };
    }

    if (!prompt || prompt.trim().length === 0) {
      return { success: false, error: 'Prompt cannot be empty' };
    }

    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt.trim() }] }],
    });

    const response = await result.response;
    const content = response.text();

    if (!content) {
      return { success: false, error: 'Empty response from Gemini API' };
    }

    return { success: true, content };
  } catch (error: any) {
    console.error('Gemini generation error:', error);
    
    // Handle specific error types
    if (error.message?.includes('API key')) {
      return { success: false, error: 'Invalid API key configuration' };
    }
    if (error.message?.includes('quota')) {
      return { success: false, error: 'API quota exceeded' };
    }
    if (error.message?.includes('safety')) {
      return { success: false, error: 'Content blocked by safety filters' };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to generate content with Gemini AI' 
    };
  }
}

/**
 * Validate API key format
 */
export function validateApiKey(key?: string): { isValid: boolean; error?: string } {
  const keyToValidate = key || apiKey;
  
  if (!keyToValidate) {
    return { isValid: false, error: 'API key is required' };
  }
  
  if (typeof keyToValidate !== 'string') {
    return { isValid: false, error: 'API key must be a string' };
  }
  
  if (keyToValidate.length < 10) {
    return { isValid: false, error: 'API key appears to be too short' };
  }
  
  // Basic format validation (Gemini API keys typically start with specific patterns)
  if (!keyToValidate.startsWith('AI')) {
    return { isValid: false, error: 'API key format appears invalid' };
  }
  
  return { isValid: true };
}

/**
 * Get current Gemini service status
 */
export function getGeminiStatus(): {
  configured: boolean;
  apiKeyValid: boolean;
  model: string;
  config: typeof GEMINI_CONFIG;
} {
  const keyValidation = validateApiKey();
  
  return {
    configured: !!apiKey,
    apiKeyValid: keyValidation.isValid,
    model: GEMINI_CONFIG.MODEL,
    config: GEMINI_CONFIG,
  };
}

// Export the initialized client for backward compatibility
export default genAI;