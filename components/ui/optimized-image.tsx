// @ts-nocheck
'use client';

import Image from 'next/image';
import { useState, useEffect, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { getBestImageFormat, generateResponsiveSources } from '@/lib/image-optimization';

const OptimizedImage = forwardRef(({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  className,
  fallbackSrc = '/default-cover.jpg',
  autoFormat = true,
  webpSrc,
  avifSrc,
  onLoad,
  onError,
  ...props
}, ref) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [bestFormat, setBestFormat] = useState(null);

  // Generate a simple blur data URL if not provided
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

  // Detect best image format on mount
  useEffect(() => {
    if (autoFormat && typeof window !== 'undefined') {
      getBestImageFormat().then(setBestFormat);
    }
  }, [autoFormat]);

  // Select the best source based on format support
  const getOptimalSrc = () => {
    if (!autoFormat) return imgSrc;
    
    if (bestFormat === 'avif' && avifSrc) return avifSrc;
    if (bestFormat === 'webp' && webpSrc) return webpSrc;
    
    return imgSrc;
  };

  const handleLoad = (event) => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.(event);
  };

  const handleError = (event) => {
    setIsLoading(false);
    setHasError(true);
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
    onError?.(event);
  };

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || (
    fill 
      ? '100vw'
      : width && height
        ? `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, ${width}px`
        : '100vw'
  );

  // Use picture element for better format support when multiple sources are available
  if ((webpSrc || avifSrc) && !fill) {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        <picture>
          {avifSrc && (
            <source srcSet={avifSrc} type="image/avif" />
          )}
          {webpSrc && (
            <source srcSet={webpSrc} type="image/webp" />
          )}
          <Image
            ref={ref}
            src={getOptimalSrc()}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            quality={quality}
            placeholder={placeholder}
            blurDataURL={blurDataURL || defaultBlurDataURL}
            sizes={responsiveSizes}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'transition-opacity duration-300',
              isLoading && 'opacity-0',
              !isLoading && 'opacity-100',
              hasError && 'opacity-75'
            )}
            {...props}
          />
        </picture>
        
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        
        {/* Error indicator */}
        {hasError && (
          <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
            <div className="text-muted-foreground text-sm">
              Image unavailable
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        ref={ref}
        src={getOptimalSrc()}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL || defaultBlurDataURL}
        sizes={responsiveSizes}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading && 'opacity-0',
          !isLoading && 'opacity-100',
          hasError && 'opacity-75'
        )}
        {...props}
      />
      
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {/* Error indicator */}
      {hasError && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">
            Image unavailable
          </div>
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export { OptimizedImage };