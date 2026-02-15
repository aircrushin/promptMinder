'use client';

import { forwardRef, Suspense } from 'react';
import { useLazyComponent } from '@/hooks/use-lazy-loading';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface LazyComponentProps {
  importFn: () => Promise<any>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  className?: string;
  rootMargin?: string;
  threshold?: number;
  [key: string]: any;
}

const LazyComponent = forwardRef<HTMLDivElement, LazyComponentProps>(({
  importFn,
  fallback,
  errorFallback,
  className,
  rootMargin = '100px',
  threshold = 0.1,
  ...props
}, forwardedRef) => {
  const { ref, Component, error } = useLazyComponent(importFn, {
    rootMargin,
    threshold,
    triggerOnce: true,
  });

  const defaultFallback = (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );

  const defaultErrorFallback = (
    <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
      <p className="text-sm text-destructive">
        Failed to load component. Please try refreshing the page.
      </p>
    </div>
  );

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
      className={cn('w-full', className)}
    >
      {error ? (
        errorFallback || defaultErrorFallback
      ) : Component ? (
        <Suspense fallback={fallback || defaultFallback}>
          <Component {...props} />
        </Suspense>
      ) : (
        fallback || defaultFallback
      )}
    </div>
  );
});

LazyComponent.displayName = 'LazyComponent';

export { LazyComponent };
