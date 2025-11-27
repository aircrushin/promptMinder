'use client';

/**
 * Utility functions for image optimization and format selection
 */

/**
 * Check if the browser supports a specific image format
 * @param {string} format - Image format to check (webp, avif, etc.)
 * @returns {Promise<boolean>} - Whether the format is supported
 */
export function supportsImageFormat(format) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 1, 1);
    
    canvas.toBlob((blob) => {
      resolve(blob !== null);
    }, `image/${format}`);
  });
}

/**
 * Get the best supported image format for the current browser
 * @returns {Promise<string>} - The best supported format
 */
export async function getBestImageFormat() {
  // Check formats in order of preference (best compression first)
  const formats = ['avif', 'webp', 'jpeg'];
  
  for (const format of formats) {
    if (await supportsImageFormat(format)) {
      return format;
    }
  }
  
  return 'jpeg'; // Fallback
}

/**
 * Generate optimized image URL with format selection
 * @param {string} baseUrl - Base image URL
 * @param {Object} options - Optimization options
 * @returns {string} - Optimized image URL
 */
export function getOptimizedImageUrl(baseUrl, options = {}) {
  const {
    width,
    height,
    quality = 75,
    format = 'auto',
  } = options;
  
  // If using Next.js Image component, it will handle optimization
  if (baseUrl.startsWith('/')) {
    return baseUrl;
  }
  
  // For external URLs, we can add query parameters for services that support them
  const url = new URL(baseUrl);
  
  if (width) url.searchParams.set('w', width.toString());
  if (height) url.searchParams.set('h', height.toString());
  if (quality !== 75) url.searchParams.set('q', quality.toString());
  if (format !== 'auto') url.searchParams.set('f', format);
  
  return url.toString();
}

/**
 * Generate responsive image sources for different formats
 * @param {string} baseUrl - Base image URL
 * @param {Array} sizes - Array of size configurations
 * @returns {Object} - Object with sources for different formats
 */
export function generateResponsiveSources(baseUrl, sizes = []) {
  const defaultSizes = [
    { width: 400, suffix: '-sm' },
    { width: 800, suffix: '-md' },
    { width: 1200, suffix: '-lg' }
  ];
  
  const sizesToUse = sizes.length > 0 ? sizes : defaultSizes;
  
  const sources = {
    webp: [],
    avif: [],
    jpeg: []
  };
  
  sizesToUse.forEach(({ width, suffix }) => {
    const baseName = baseUrl.replace(/\.[^/.]+$/, ''); // Remove extension
    
    sources.avif.push({
      srcSet: `${baseName}${suffix}.avif`,
      media: `(max-width: ${width}px)`,
      type: 'image/avif'
    });
    
    sources.webp.push({
      srcSet: `${baseName}${suffix}.webp`,
      media: `(max-width: ${width}px)`,
      type: 'image/webp'
    });
    
    sources.jpeg.push({
      srcSet: `${baseName}${suffix}.jpg`,
      media: `(max-width: ${width}px)`,
      type: 'image/jpeg'
    });
  });
  
  return sources;
}

/**
 * Preload critical images with format selection
 * @param {Array} imageUrls - Array of image URLs to preload
 * @param {Object} options - Preload options
 */
export async function preloadImages(imageUrls, options = {}) {
  const { format = 'auto', priority = false } = options;
  
  const bestFormat = format === 'auto' ? await getBestImageFormat() : format;
  
  imageUrls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = priority ? 'preload' : 'prefetch';
    link.as = 'image';
    link.href = getOptimizedImageUrl(url, { format: bestFormat });
    
    // Add to document head
    document.head.appendChild(link);
  });
}

/**
 * Image compression utility for client-side compression
 * @param {File} file - Image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<Blob>} - Compressed image blob
 */
export function compressImage(file, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.8,
      format = 'jpeg'
    } = options;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to compress image'));
        }
      }, `image/${format}`, quality);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate blur placeholder for images
 * @param {string} imageUrl - Image URL
 * @param {number} size - Placeholder size (default: 10)
 * @returns {Promise<string>} - Base64 encoded blur placeholder
 */
export function generateBlurPlaceholder(imageUrl, size = 10) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = size;
    canvas.height = size;
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      
      // Apply blur effect
      ctx.filter = 'blur(2px)';
      ctx.drawImage(canvas, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.1);
      resolve(dataUrl);
    };
    
    img.onerror = () => {
      // Return a default blur placeholder
      resolve('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==');
    };
    
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
  });
}