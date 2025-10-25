import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loadImage,
  loadFirebaseImage,
  preloadImages,
  clearImageCache,
  getCacheSize,
  isImageCached,
  generateImageSizes,
  compressImage
} from '../imageLoader';
import * as firebaseStorage from '../firebaseStorage';

// Mock Firebase storage
vi.mock('../firebaseStorage', () => ({
  getImageURL: vi.fn()
}));

// Mock Image constructor
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string = '';

  constructor() {
    // Simulate successful load by default
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 10);
  }
}

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'blob:mock-url')
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn()
});

// Mock canvas and context for image compression
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => ({
    drawImage: vi.fn()
  })),
  toBlob: vi.fn((callback) => {
    const mockBlob = new Blob(['mock'], { type: 'image/jpeg' });
    callback(mockBlob);
  })
};

Object.defineProperty(document, 'createElement', {
  writable: true,
  value: vi.fn((tagName) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    return {};
  })
});

describe('Image Loader Service', () => {
  const mockGetImageURL = vi.mocked(firebaseStorage.getImageURL);

  beforeEach(() => {
    vi.clearAllMocks();
    clearImageCache();
    
    // Mock global Image constructor
    global.Image = MockImage as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadImage', () => {
    it('should load image successfully', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      const result = await loadImage(imageUrl);

      expect(result.success).toBe(true);
      expect(result.url).toBe(imageUrl);
      expect(result.fromCache).toBe(false);
      expect(typeof result.loadTime).toBe('number');
    });

    it('should return cached image on subsequent calls', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      // First load
      await loadImage(imageUrl);
      
      // Second load should be from cache
      const result = await loadImage(imageUrl);

      expect(result.success).toBe(true);
      expect(result.fromCache).toBe(true);
      expect(result.loadTime).toBe(0);
    });

    it('should retry on failure', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      let attemptCount = 0;

      // Mock Image to fail first two attempts, succeed on third
      global.Image = class extends MockImage {
        constructor() {
          super();
          attemptCount++;
          setTimeout(() => {
            if (attemptCount < 3) {
              if (this.onerror) {
                this.onerror();
              }
            } else {
              if (this.onload) {
                this.onload();
              }
            }
          }, 10);
        }
      } as any;

      const result = await loadImage(imageUrl, { retryAttempts: 3 });

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
    });

    it('should use fallback URL when main image fails', async () => {
      const imageUrl = 'https://example.com/broken-image.jpg';
      const fallbackUrl = 'https://example.com/fallback.jpg';

      // Mock Image to fail for main URL, succeed for fallback
      global.Image = class extends MockImage {
        constructor() {
          super();
          setTimeout(() => {
            if (this.src === imageUrl) {
              if (this.onerror) {
                this.onerror();
              }
            } else {
              if (this.onload) {
                this.onload();
              }
            }
          }, 10);
        }
      } as any;

      const result = await loadImage(imageUrl, { 
        fallbackUrl,
        retryAttempts: 1 
      });

      expect(result.success).toBe(true);
      expect(result.url).toBe(fallbackUrl);
    });

    it('should handle timeout', async () => {
      const imageUrl = 'https://example.com/slow-image.jpg';

      // Mock Image that never loads
      global.Image = class extends MockImage {
        constructor() {
          super();
          // Don't call onload or onerror
        }
      } as any;

      const result = await loadImage(imageUrl, { 
        timeout: 50,
        retryAttempts: 1 
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Failed to load image after 1 attempts');
    });

    it('should prevent duplicate requests for same URL', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      let imageConstructorCount = 0;

      global.Image = class extends MockImage {
        constructor() {
          super();
          imageConstructorCount++;
        }
      } as any;

      // Start multiple loads simultaneously
      const promises = [
        loadImage(imageUrl),
        loadImage(imageUrl),
        loadImage(imageUrl)
      ];

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should only create one Image instance
      expect(imageConstructorCount).toBe(1);
    });
  });

  describe('loadFirebaseImage', () => {
    it('should load Firebase image successfully', async () => {
      const firebasePath = 'images/test.jpg';
      const downloadUrl = 'https://firebase.com/download/test.jpg';

      mockGetImageURL.mockResolvedValue({
        data: downloadUrl,
        success: true,
        timestamp: new Date()
      });

      const result = await loadFirebaseImage(firebasePath);

      expect(result.success).toBe(true);
      expect(result.url).toBe(downloadUrl);
      expect(mockGetImageURL).toHaveBeenCalledWith(firebasePath);
    });

    it('should handle Firebase URL resolution failure', async () => {
      const firebasePath = 'images/nonexistent.jpg';

      mockGetImageURL.mockResolvedValue({
        data: '',
        success: false,
        error: {
          type: 'firebase' as any,
          message: 'File not found',
          timestamp: new Date(),
          retryable: true
        },
        timestamp: new Date()
      });

      const result = await loadFirebaseImage(firebasePath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('preloadImages', () => {
    it('should preload multiple images', async () => {
      const imageUrls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg'
      ];

      const results = await preloadImages(imageUrls);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.url).toBe(imageUrls[index]);
      });
    });

    it('should handle mixed success and failure in preload', async () => {
      const imageUrls = [
        'https://example.com/good-image.jpg',
        'https://example.com/bad-image.jpg'
      ];

      // Mock Image to fail for bad-image
      global.Image = class extends MockImage {
        constructor() {
          super();
          setTimeout(() => {
            if (this.src.includes('bad-image')) {
              if (this.onerror) {
                this.onerror();
              }
            } else {
              if (this.onload) {
                this.onload();
              }
            }
          }, 10);
        }
      } as any;

      const results = await preloadImages(imageUrls, { retryAttempts: 1 });

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should track cache size correctly', async () => {
      expect(getCacheSize()).toBe(0);

      await loadImage('https://example.com/image1.jpg');
      expect(getCacheSize()).toBe(1);

      await loadImage('https://example.com/image2.jpg');
      expect(getCacheSize()).toBe(2);
    });

    it('should check if image is cached', async () => {
      const imageUrl = 'https://example.com/image.jpg';

      expect(isImageCached(imageUrl)).toBe(false);

      await loadImage(imageUrl);

      expect(isImageCached(imageUrl)).toBe(true);
    });

    it('should clear cache', async () => {
      await loadImage('https://example.com/image1.jpg');
      await loadImage('https://example.com/image2.jpg');

      expect(getCacheSize()).toBe(2);

      clearImageCache();

      expect(getCacheSize()).toBe(0);
    });
  });

  describe('generateImageSizes', () => {
    it('should generate different size URLs for Firebase images', () => {
      const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/project/o/image.jpg?alt=media';
      
      const sizes = generateImageSizes(baseUrl);

      expect(sizes.thumbnail).toContain('size_150x150');
      expect(sizes.small).toContain('size_300x300');
      expect(sizes.medium).toContain('size_600x600');
      expect(sizes.large).toContain('size_1200x1200');
    });

    it('should return original URL for non-Firebase images', () => {
      const baseUrl = 'https://example.com/image.jpg';
      
      const sizes = generateImageSizes(baseUrl);

      expect(sizes.thumbnail).toBe(baseUrl);
      expect(sizes.small).toBe(baseUrl);
      expect(sizes.medium).toBe(baseUrl);
      expect(sizes.large).toBe(baseUrl);
    });
  });

  describe('compressImage', () => {
    it('should compress image file', async () => {
      const mockFile = new File(['mock image data'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock Image for compression
      global.Image = class extends MockImage {
        width = 1600;
        height = 1200;
        
        constructor() {
          super();
          setTimeout(() => {
            if (this.onload) {
              this.onload();
            }
          }, 10);
        }
      } as any;

      const compressedFile = await compressImage(mockFile, 800, 600, 0.8);

      expect(compressedFile).toBeInstanceOf(File);
      expect(compressedFile.name).toBe('test.jpg');
      expect(compressedFile.type).toBe('image/jpeg');
    });

    it('should maintain aspect ratio when compressing', async () => {
      const mockFile = new File(['mock image data'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock Image with specific dimensions
      global.Image = class extends MockImage {
        width = 2000;
        height = 1000;
        
        constructor() {
          super();
          setTimeout(() => {
            if (this.onload) {
              this.onload();
            }
          }, 10);
        }
      } as any;

      await compressImage(mockFile, 1000, 1000, 0.8);

      // Canvas should be set to maintain aspect ratio
      expect(mockCanvas.width).toBe(1000);
      expect(mockCanvas.height).toBe(500); // Half the height to maintain 2:1 ratio
    });
  });

  describe('Error Handling', () => {
    it('should create proper error states', async () => {
      const imageUrl = 'https://example.com/broken-image.jpg';

      // Mock Image to always fail
      global.Image = class extends MockImage {
        constructor() {
          super();
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 10);
        }
      } as any;

      const result = await loadImage(imageUrl, { retryAttempts: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('firebase');
      expect(result.error?.retryable).toBe(true);
      expect(result.error?.timestamp).toBeInstanceOf(Date);
    });

    it('should handle Firebase service errors', async () => {
      const firebasePath = 'images/error.jpg';

      mockGetImageURL.mockRejectedValue(new Error('Firebase connection failed'));

      const result = await loadFirebaseImage(firebasePath);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Firebase image loading failed');
    });
  });

  describe('Performance', () => {
    it('should measure load time accurately', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      // Mock Image with delayed load
      global.Image = class extends MockImage {
        constructor() {
          super();
          setTimeout(() => {
            if (this.onload) {
              this.onload();
            }
          }, 100);
        }
      } as any;

      const result = await loadImage(imageUrl);

      expect(result.success).toBe(true);
      expect(result.loadTime).toBeGreaterThan(90);
      expect(result.loadTime).toBeLessThan(200);
    });

    it('should handle concurrent loads efficiently', async () => {
      const imageUrls = Array.from({ length: 10 }, (_, i) => 
        `https://example.com/image${i}.jpg`
      );

      const startTime = Date.now();
      const results = await preloadImages(imageUrls);
      const endTime = Date.now();

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete in reasonable time (concurrent, not sequential)
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});