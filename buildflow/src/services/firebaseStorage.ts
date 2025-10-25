import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  listAll, 
  getBytes,
  deleteObject,
  getMetadata,
  updateMetadata
} from 'firebase/storage';
import { storage } from './firebase';
import { 
  Manual, 
  Step, 
  Material, 
  UploadManualRequest, 
  UploadManualResponse,
  GetManualResponse,
  GetManualsListResponse,
  FirebaseUploadOptions,
  FirebaseDownloadOptions,
  ApiResponse,
  ErrorState,
  ErrorType
} from '../types';

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

export const STORAGE_PATHS = {
  MANUALS: {
    DEMO: 'manuals/demo',
    GENERATED: 'manuals/generated'
  },
  IMAGES: {
    THUMBNAILS: 'images/thumbnails',
    STEPS: 'images/steps'
  }
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
    retryable: type === ErrorType.NETWORK || type === ErrorType.FIREBASE
  };
}

function handleFirebaseError(error: any): ErrorState {
  console.error('Firebase Storage Error:', error);
  
  if (error.code) {
    switch (error.code) {
      case 'storage/object-not-found':
        return createErrorState(ErrorType.FIREBASE, 'File not found', error);
      case 'storage/unauthorized':
        return createErrorState(ErrorType.FIREBASE, 'Unauthorized access', error);
      case 'storage/canceled':
        return createErrorState(ErrorType.FIREBASE, 'Operation canceled', error);
      case 'storage/unknown':
        return createErrorState(ErrorType.FIREBASE, 'Unknown storage error', error);
      case 'storage/invalid-format':
        return createErrorState(ErrorType.VALIDATION, 'Invalid file format', error);
      case 'storage/invalid-event-name':
        return createErrorState(ErrorType.VALIDATION, 'Invalid event name', error);
      default:
        return createErrorState(ErrorType.FIREBASE, `Firebase error: ${error.code}`, error);
    }
  }
  
  // For validation errors, preserve the original message
  if (error.message && error.message.includes('validation failed')) {
    return createErrorState(ErrorType.VALIDATION, error.message, error);
  }
  
  return createErrorState(ErrorType.UNKNOWN, error.message || 'An unexpected error occurred', error);
}

// ============================================================================
// DATA VALIDATION UTILITIES
// ============================================================================

export function validateManualStructure(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Manual data must be an object');
    return { isValid: false, errors };
  }
  
  // Validate Manual fields
  if (!data.id || typeof data.id !== 'string') {
    errors.push('Manual must have a valid id');
  }
  
  if (!data.productName || typeof data.productName !== 'string') {
    errors.push('Manual must have a valid productName');
  }
  
  if (!data.thumbnailURL || typeof data.thumbnailURL !== 'string') {
    errors.push('Manual must have a valid thumbnailURL');
  }
  
  if (typeof data.totalPrice !== 'number' || data.totalPrice < 0) {
    errors.push('Manual must have a valid totalPrice');
  }
  
  if (typeof data.stepCount !== 'number' || data.stepCount < 1) {
    errors.push('Manual must have a valid stepCount');
  }
  
  return { isValid: errors.length === 0, errors };
}

export function validateStepsStructure(steps: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!Array.isArray(steps)) {
    errors.push('Steps must be an array');
    return { isValid: false, errors };
  }
  
  steps.forEach((step, index) => {
    if (!step || typeof step !== 'object') {
      errors.push(`Step ${index + 1} must be an object`);
      return;
    }
    
    if (typeof step.stepNumber !== 'number' || step.stepNumber < 1) {
      errors.push(`Step ${index + 1} must have a valid stepNumber`);
    }
    
    if (!step.title || typeof step.title !== 'string') {
      errors.push(`Step ${index + 1} must have a valid title`);
    }
    
    if (!step.description || typeof step.description !== 'string') {
      errors.push(`Step ${index + 1} must have a valid description`);
    }
    
    if (!step.imageURL || typeof step.imageURL !== 'string') {
      errors.push(`Step ${index + 1} must have a valid imageURL`);
    }
    
    if (typeof step.estimatedTime !== 'number' || step.estimatedTime < 0) {
      errors.push(`Step ${index + 1} must have a valid estimatedTime`);
    }
    
    if (!Array.isArray(step.tools)) {
      errors.push(`Step ${index + 1} must have a valid tools array`);
    }
  });
  
  return { isValid: errors.length === 0, errors };
}

export function validateMaterialsStructure(materials: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!Array.isArray(materials)) {
    errors.push('Materials must be an array');
    return { isValid: false, errors };
  }
  
  materials.forEach((material, index) => {
    if (!material || typeof material !== 'object') {
      errors.push(`Material ${index + 1} must be an object`);
      return;
    }
    
    if (!material.id || typeof material.id !== 'string') {
      errors.push(`Material ${index + 1} must have a valid id`);
    }
    
    if (!material.name || typeof material.name !== 'string') {
      errors.push(`Material ${index + 1} must have a valid name`);
    }
    
    if (typeof material.quantity !== 'number' || material.quantity < 1) {
      errors.push(`Material ${index + 1} must have a valid quantity`);
    }
    
    if (typeof material.unitPrice !== 'number' || material.unitPrice < 0) {
      errors.push(`Material ${index + 1} must have a valid unitPrice`);
    }
    
    if (typeof material.totalPrice !== 'number' || material.totalPrice < 0) {
      errors.push(`Material ${index + 1} must have a valid totalPrice`);
    }
    
    if (!material.category || typeof material.category !== 'string') {
      errors.push(`Material ${index + 1} must have a valid category`);
    }
  });
  
  return { isValid: errors.length === 0, errors };
}

// ============================================================================
// FIREBASE STORAGE SERVICE FUNCTIONS
// ============================================================================

/**
 * Upload manual data to Firebase Cloud Storage
 */
export async function uploadManual(request: UploadManualRequest): Promise<ApiResponse<UploadManualResponse>> {
  try {
    const { manual, steps, materials, userId } = request;
    
    // Validate data structure
    const manualValidation = validateManualStructure(manual);
    if (!manualValidation.isValid) {
      throw new Error(`Manual validation failed: ${manualValidation.errors.join(', ')}`);
    }
    
    const stepsValidation = validateStepsStructure(steps);
    if (!stepsValidation.isValid) {
      throw new Error(`Steps validation failed: ${stepsValidation.errors.join(', ')}`);
    }
    
    const materialsValidation = validateMaterialsStructure(materials);
    if (!materialsValidation.isValid) {
      throw new Error(`Materials validation failed: ${materialsValidation.errors.join(', ')}`);
    }
    
    // Create Firebase paths
    const basePath = `${STORAGE_PATHS.MANUALS.GENERATED}/${userId}/${manual.id}`;
    
    // Upload manual metadata
    const manualRef = ref(storage, `${basePath}/metadata.json`);
    const manualBlob = new Blob([JSON.stringify(manual, null, 2)], { type: 'application/json' });
    await uploadBytes(manualRef, manualBlob);
    
    // Upload steps data
    const stepsRef = ref(storage, `${basePath}/steps.json`);
    const stepsBlob = new Blob([JSON.stringify(steps, null, 2)], { type: 'application/json' });
    await uploadBytes(stepsRef, stepsBlob);
    
    // Upload materials data
    const materialsRef = ref(storage, `${basePath}/materials.json`);
    const materialsBlob = new Blob([JSON.stringify(materials, null, 2)], { type: 'application/json' });
    await uploadBytes(materialsRef, materialsBlob);
    
    return {
      data: {
        success: true,
        firebasePath: basePath,
        manualId: manual.id
      },
      success: true,
      timestamp: new Date()
    };
    
  } catch (error) {
    const errorState = handleFirebaseError(error);
    return {
      data: {
        success: false,
        firebasePath: '',
        manualId: ''
      },
      success: false,
      error: errorState,
      timestamp: new Date()
    };
  }
}

/**
 * Retrieve manual data from Firebase Cloud Storage
 */
export async function getManual(manualId: string, isDemo: boolean = false): Promise<ApiResponse<GetManualResponse>> {
  try {
    const basePath = isDemo 
      ? `${STORAGE_PATHS.MANUALS.DEMO}/${manualId}`
      : `${STORAGE_PATHS.MANUALS.GENERATED}/${manualId}`;
    
    // Download manual metadata
    const manualRef = ref(storage, `${basePath}/metadata.json`);
    const manualBytes = await getBytes(manualRef);
    const manualText = new TextDecoder().decode(manualBytes);
    const rawManual = JSON.parse(manualText);
    
    // Convert createdAt string to Date object
    const manual: Manual = {
      ...rawManual,
      createdAt: new Date(rawManual.createdAt)
    };
    
    // Download steps data
    const stepsRef = ref(storage, `${basePath}/steps.json`);
    const stepsBytes = await getBytes(stepsRef);
    const stepsText = new TextDecoder().decode(stepsBytes);
    const steps: Step[] = JSON.parse(stepsText);
    
    // Download materials data
    const materialsRef = ref(storage, `${basePath}/materials.json`);
    const materialsBytes = await getBytes(materialsRef);
    const materialsText = new TextDecoder().decode(materialsBytes);
    const materials: Material[] = JSON.parse(materialsText);
    
    // Validate retrieved data
    const manualValidation = validateManualStructure(manual);
    if (!manualValidation.isValid) {
      throw new Error(`Retrieved manual validation failed: ${manualValidation.errors.join(', ')}`);
    }
    
    return {
      data: {
        manual,
        steps,
        materials
      },
      success: true,
      timestamp: new Date()
    };
    
  } catch (error) {
    const errorState = handleFirebaseError(error);
    return {
      data: {
        manual: {} as Manual,
        steps: [],
        materials: []
      },
      success: false,
      error: errorState,
      timestamp: new Date()
    };
  }
}

/**
 * Get list of available manuals from Firebase Cloud Storage
 */
export async function getManualsList(isDemo: boolean = true): Promise<ApiResponse<GetManualsListResponse>> {
  try {
    const basePath = isDemo 
      ? STORAGE_PATHS.MANUALS.DEMO
      : STORAGE_PATHS.MANUALS.GENERATED;
    
    console.log('🔥 Firebase getManualsList - basePath:', basePath);
    
    const listRef = ref(storage, basePath);
    const listResult = await listAll(listRef);
    
    console.log('🔥 Firebase listAll result:', {
      prefixes: listResult.prefixes.map(p => p.name),
      items: listResult.items.map(i => i.name)
    });
    
    const manuals: Manual[] = [];
    
    // Process each manual directory
    for (const folderRef of listResult.prefixes) {
      try {
        console.log('🔥 Processing folder:', folderRef.name, 'fullPath:', folderRef.fullPath);
        
        const metadataRef = ref(storage, `${folderRef.fullPath}/metadata.json`);
        const metadataBytes = await getBytes(metadataRef);
        const metadataText = new TextDecoder().decode(metadataBytes);
        const rawManual = JSON.parse(metadataText);
        
        console.log('🔥 Raw manual data:', rawManual);
        
        // Convert createdAt string to Date object
        const manual: Manual = {
          ...rawManual,
          createdAt: new Date(rawManual.createdAt)
        };
        
        console.log('🔥 Processed manual:', manual);
        
        // Validate manual structure
        const validation = validateManualStructure(manual);
        console.log('🔥 Validation result:', validation);
        
        if (validation.isValid) {
          manuals.push(manual);
          console.log('🔥 Added manual to list. Total count:', manuals.length);
        } else {
          console.warn(`Invalid manual structure for ${folderRef.name}:`, validation.errors);
        }
      } catch (error) {
        console.warn(`Failed to load manual ${folderRef.name}:`, error);
      }
    }
    
    return {
      data: {
        manuals,
        total: manuals.length,
        hasMore: false
      },
      success: true,
      timestamp: new Date()
    };
    
  } catch (error) {
    const errorState = handleFirebaseError(error);
    return {
      data: {
        manuals: [],
        total: 0,
        hasMore: false
      },
      success: false,
      error: errorState,
      timestamp: new Date()
    };
  }
}

/**
 * Upload image to Firebase Cloud Storage
 */
export async function uploadImage(
  file: File, 
  path: string, 
  options?: FirebaseUploadOptions
): Promise<ApiResponse<string>> {
  try {
    const imageRef = ref(storage, path);
    const uploadResult = await uploadBytes(imageRef, file, options);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    return {
      data: downloadURL,
      success: true,
      timestamp: new Date()
    };
    
  } catch (error) {
    const errorState = handleFirebaseError(error);
    return {
      data: '',
      success: false,
      error: errorState,
      timestamp: new Date()
    };
  }
}

/**
 * Get download URL for an image
 */
export async function getImageURL(path: string): Promise<ApiResponse<string>> {
  try {
    const imageRef = ref(storage, path);
    const downloadURL = await getDownloadURL(imageRef);
    
    return {
      data: downloadURL,
      success: true,
      timestamp: new Date()
    };
    
  } catch (error) {
    const errorState = handleFirebaseError(error);
    return {
      data: '',
      success: false,
      error: errorState,
      timestamp: new Date()
    };
  }
}

/**
 * Delete manual from Firebase Cloud Storage
 */
export async function deleteManual(manualId: string, userId?: string): Promise<ApiResponse<boolean>> {
  try {
    const basePath = userId 
      ? `${STORAGE_PATHS.MANUALS.GENERATED}/${userId}/${manualId}`
      : `${STORAGE_PATHS.MANUALS.DEMO}/${manualId}`;
    
    // Delete all files in the manual directory
    const listRef = ref(storage, basePath);
    const listResult = await listAll(listRef);
    
    // Delete all files
    const deletePromises = listResult.items.map(itemRef => deleteObject(itemRef));
    await Promise.all(deletePromises);
    
    // Delete subdirectories (images)
    for (const folderRef of listResult.prefixes) {
      const subListResult = await listAll(folderRef);
      const subDeletePromises = subListResult.items.map(itemRef => deleteObject(itemRef));
      await Promise.all(subDeletePromises);
    }
    
    return {
      data: true,
      success: true,
      timestamp: new Date()
    };
    
  } catch (error) {
    const errorState = handleFirebaseError(error);
    return {
      data: false,
      success: false,
      error: errorState,
      timestamp: new Date()
    };
  }
}