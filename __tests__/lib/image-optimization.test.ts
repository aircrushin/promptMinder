/**
 * @jest-environment jsdom
 */

import {
  supportsImageFormat,
  getBestImageFormat,
  getOptimizedImageUrl,
  generateResponsiveSources,
  compressImage,
} from '@/lib/image-optimization';

// Mock canvas and its methods
const mockToBlob = jest.fn();
const mockGetContext = jest.fn(() => ({
  fillStyle: '',
  fillRect: jest.fn(),
  drawImage: jest.fn(),
  filter: '',
}));
const mockToDataURL = jest.fn(() => 'data:image/jpeg;base64,test');

(global.HTMLCanvasElement.prototype as any).getContext = mockGetContext;
global.HTMLCanvasElement.prototype.toBlob = mockToBlob;
global.HTMLCanvasElement.prototype.toDataURL = mockToDataURL;

// Mock Image constructor
(global as any).Image = class MockImage {
  onload: (() => void) | null = null;
  _src: string = '';

  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }

  set src(value: string) {
    this._src = value;
  }

  get src() {
    return this._src;
  }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:test');

describe('Image Optimization Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('supportsImageFormat', () => {
    it('should check if browser supports WebP format', async () => {
      mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
        callback(new Blob(['test'], { type: 'image/webp' }));
      });

      const result = await supportsImageFormat('webp');
      expect(result).toBe(true);
      expect(mockToBlob).toHaveBeenCalledWith(expect.any(Function), 'image/webp');
    });

    it('should return false for unsupported format', async () => {
      mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
        callback(null);
      });

      const result = await supportsImageFormat('avif');
      expect(result).toBe(false);
    });
  });

  describe('getBestImageFormat', () => {
    it('should return the best supported format', async () => {
      // Mock AVIF support
      mockToBlob.mockImplementation((callback: (blob: Blob | null) => void, format: string) => {
        if (format === 'image/avif') {
          callback(new Blob(['test'], { type: 'image/avif' }));
        } else {
          callback(null);
        }
      });

      const result = await getBestImageFormat();
      expect(result).toBe('avif');
    });

    it('should fallback to jpeg if no modern formats are supported', async () => {
      mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
        callback(null);
      });

      const result = await getBestImageFormat();
      expect(result).toBe('jpeg');
    });
  });

  describe('getOptimizedImageUrl', () => {
    it('should return local URLs unchanged', () => {
      const result = getOptimizedImageUrl('/local-image.jpg');
      expect(result).toBe('/local-image.jpg');
    });

    it('should add optimization parameters to external URLs', () => {
      const result = getOptimizedImageUrl('https://example.com/image.jpg', {
        width: 800,
        height: 600,
        quality: 80,
        format: 'webp',
      });

      expect(result).toContain('w=800');
      expect(result).toContain('h=600');
      expect(result).toContain('q=80');
      expect(result).toContain('f=webp');
    });
  });

  describe('generateResponsiveSources', () => {
    it('should generate responsive sources for different formats', () => {
      const result = generateResponsiveSources('https://example.com/image.jpg');

      expect(result).toHaveProperty('webp');
      expect(result).toHaveProperty('avif');
      expect(result).toHaveProperty('jpeg');

      expect(result.webp).toHaveLength(3); // Default sizes
      expect(result.avif).toHaveLength(3);
      expect(result.jpeg).toHaveLength(3);
    });

    it('should use custom sizes when provided', () => {
      const customSizes = [
        { width: 300, suffix: '-xs' },
        { width: 600, suffix: '-sm' },
      ];

      const result = generateResponsiveSources('https://example.com/image.jpg', customSizes);

      expect(result.webp).toHaveLength(2);
      expect(result.webp[0].srcSet).toContain('-xs.webp');
      expect(result.webp[1].srcSet).toContain('-sm.webp');
    });
  });

  describe('compressImage', () => {
    it('should compress an image file', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockBlob = new Blob(['compressed'], { type: 'image/jpeg' });

      mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
        callback(mockBlob);
      });

      const result = await compressImage(mockFile, {
        maxWidth: 800,
        quality: 0.8,
      });

      expect(result).toBe(mockBlob);
      expect(mockToBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/jpeg',
        0.8
      );
    });

    it('should reject if compression fails', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
        callback(null);
      });

      await expect(compressImage(mockFile)).rejects.toThrow('Failed to compress image');
    });
  });
});
