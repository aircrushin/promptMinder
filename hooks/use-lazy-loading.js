'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for lazy loading using Intersection Observer
 * @param {Object} options - Configuration options
 * @param {string} options.rootMargin - Root margin for intersection observer
 * @param {number} options.threshold - Threshold for intersection observer
 * @param {boolean} options.triggerOnce - Whether to trigger only once
 * @returns {Object} - { ref, isIntersecting, isLoaded }
 */
export function useLazyLoading(options = {}) {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    triggerOnce = true,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  const setRef = useCallback((node) => {
    if (elementRef.current) {
      // Cleanup previous observer
      if (observerRef.current) {
        observerRef.current.unobserve(elementRef.current);
      }
    }

    elementRef.current = node;

    if (node) {
      // Create new observer
      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          ([entry]) => {
            const isVisible = entry.isIntersecting;
            setIsIntersecting(isVisible);
            
            if (isVisible) {
              setIsLoaded(true);
              if (triggerOnce && observerRef.current) {
                observerRef.current.unobserve(node);
              }
            }
          },
          {
            rootMargin,
            threshold,
          }
        );
      }

      observerRef.current.observe(node);
    }
  }, [rootMargin, threshold, triggerOnce]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    ref: setRef,
    isIntersecting,
    isLoaded,
  };
}

/**
 * Hook for lazy loading images with preloading
 * @param {string} src - Image source URL
 * @param {Object} options - Lazy loading options
 * @returns {Object} - { ref, isLoaded, hasError, load }
 */
export function useLazyImage(src, options = {}) {
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { ref, isLoaded } = useLazyLoading(options);

  const load = useCallback(() => {
    if (!src || imageLoaded) return;

    const img = new Image();
    
    img.onload = () => {
      setImageLoaded(true);
      setHasError(false);
    };
    
    img.onerror = () => {
      setHasError(true);
      setImageLoaded(false);
    };
    
    img.src = src;
  }, [src, imageLoaded]);

  useEffect(() => {
    if (isLoaded && src) {
      load();
    }
  }, [isLoaded, src, load]);

  return {
    ref,
    isLoaded: imageLoaded,
    hasError,
    load,
  };
}

/**
 * Hook for lazy loading components
 * @param {Function} importFn - Dynamic import function
 * @param {Object} options - Lazy loading options
 * @returns {Object} - { ref, Component, isLoading, error }
 */
export function useLazyComponent(importFn, options = {}) {
  const [Component, setComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { ref, isLoaded } = useLazyLoading(options);

  useEffect(() => {
    if (isLoaded && !Component && !isLoading) {
      setIsLoading(true);
      setError(null);

      importFn()
        .then((module) => {
          setComponent(() => module.default || module);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err);
          setIsLoading(false);
        });
    }
  }, [isLoaded, Component, isLoading, importFn]);

  return {
    ref,
    Component,
    isLoading,
    error,
  };
}