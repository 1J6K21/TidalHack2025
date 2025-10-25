import { Step, Material } from '../types';

export class FirebaseService {
  async getSteps(_firebaseManualPath: string): Promise<Step[]> {
    // This would normally fetch from Firebase Cloud Storage
    // For now, return empty array as this is just for testing
    return [];
  }

  async getMaterials(_firebaseManualPath: string): Promise<Material[]> {
    // This would normally fetch from Firebase Cloud Storage
    // For now, return empty array as this is just for testing
    return [];
  }
}

export const firebaseService = new FirebaseService();