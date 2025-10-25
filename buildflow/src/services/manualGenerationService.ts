import { GenerateManualRequest, GenerateManualResponse } from '../types';

export class ManualGenerationService {
  async generateManual(request: GenerateManualRequest): Promise<GenerateManualResponse> {
    // This would normally call the Gemini API
    // For now, return a mock response
    return {
      manualId: 'generated-' + Date.now(),
      projectName: request.productIdea,
      steps: [],
      materials: [],
      totalPrice: 0,
      firebasePath: `manuals/generated/${request.userId}/generated-${Date.now()}`
    };
  }
}

export const manualGenerationService = new ManualGenerationService();