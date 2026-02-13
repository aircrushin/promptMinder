'use client';

import { forwardRef } from 'react';
import { OptimizedImage } from './optimized-image';
import { useLazyImage } from '@/hooks/use-lazy-loading';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  fallbackSrc?: string;
  placeholder?: 'blur' | 'empty';
  rootMargin?: string;
  threshold?: number;
  onLoad?: (event: any) => void;
  onError?: (event: any) => void;
  [key: string]: any;
}

const LazyImage = forwardRef<HTMLDivElement, LazyImageProps>(({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  fallbackSrc = '/default-cover.jpg',
  placeholder = 'blur',
  rootMargin = '50px',
  threshold = 0.1,
  onLoad,
  onError,
  ...props
}, forwardedRef) => {
  const { ref, isLoaded, hasError } = useLazyImage(src, {
    rootMargin,
    threshold,
    triggerOnce: true,
  });

  const handleLoad = (event: any) => {
    onLoad?.(event);
  };

  const handleError = (event: any) => {
    onError?.(event);
  };

  return (
    <div
      ref={(node) => {
        ref(node);
        if (forwardedRef) {
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else {
            (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
        }
      }}
      className={cn('relative overflow-hidden', className)}
    >
      {isLoaded ? (
        <OptimizedImage
          src={hasError ? fallbackSrc : src}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          placeholder={placeholder}
          onLoad={handleLoad}
          onError={handleError}
          className="w-full h-full"
          {...props}
        />
      ) : (
        <div className={cn(
          'w-full h-full bg-muted animate-pulse flex items-center justify-center',
          fill && 'absolute inset-0'
        )}>
          <div className="text-muted-foreground text-sm">
            Loading...
          </div>
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export { LazyImage };
