// @ts-nocheck
import { renderHook, act } from '@testing-library/react';
import { useLazyLoading, useLazyImage, useLazyComponent } from '@/hooks/use-lazy-loading';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock Image constructor
global.Image = class {
  constructor() {
    setTimeout(() => {
      this.onload && this.onload();
    }, 100);
  }
};

describe('useLazyLoading', () => {
  beforeEach(() => {
    mockIntersectionObserver.mockClear();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useLazyLoading());
    
    expect(result.current.isIntersecting).toBe(false);
    expect(result.current.isLoaded).toBe(false);
    expect(typeof result.current.ref).toBe('function');
  });

  it('should create IntersectionObserver when ref is set', () => {
    const { result } = renderHook(() => useLazyLoading());
    const mockElement = document.createElement('div');
    
    act(() => {
      result.current.ref(mockElement);
    });
    
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );
  });

  it('should use custom options', () => {
    const options = {
      rootMargin: '100px',
      threshold: 0.5,
      triggerOnce: false,
    };
    
    const { result } = renderHook(() => useLazyLoading(options));
    const mockElement = document.createElement('div');
    
    act(() => {
      result.current.ref(mockElement);
    });
    
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        rootMargin: '100px',
        threshold: 0.5,
      }
    );
  });
});

describe('useLazyImage', () => {
  beforeEach(() => {
    mockIntersectionObserver.mockClear();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useLazyImage('/test-image.jpg'));
    
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(typeof result.current.ref).toBe('function');
    expect(typeof result.current.load).toBe('function');
  });

  it('should load image when intersection occurs', async () => {
    const { result } = renderHook(() => useLazyImage('/test-image.jpg'));
    const mockElement = document.createElement('div');
    
    act(() => {
      result.current.ref(mockElement);
    });
    
    // Simulate intersection
    if (mockIntersectionObserver.mock.calls.length > 0) {
      const callback = mockIntersectionObserver.mock.calls[0][0];
      
      act(() => {
        callback([{ isIntersecting: true }]);
      });
      
      // Wait for image to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });
      
      expect(result.current.isLoaded).toBe(true);
    }
  });
});

describe('useLazyComponent', () => {
  beforeEach(() => {
    mockIntersectionObserver.mockClear();
  });

  it('should initialize with correct default values', () => {
    const mockImport = jest.fn(() => Promise.resolve({ default: () => null }));
    const { result } = renderHook(() => useLazyComponent(mockImport));
    
    expect(result.current.Component).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.ref).toBe('function');
  });

  it('should load component when intersection occurs', async () => {
    const MockComponent = () => <div>Mock Component</div>;
    const mockImport = jest.fn(() => Promise.resolve({ default: MockComponent }));
    
    const { result } = renderHook(() => useLazyComponent(mockImport));
    const mockElement = document.createElement('div');
    
    act(() => {
      result.current.ref(mockElement);
    });
    
    // Simulate intersection
    if (mockIntersectionObserver.mock.calls.length > 0) {
      const callback = mockIntersectionObserver.mock.calls[0][0];
      
      act(() => {
        callback([{ isIntersecting: true }]);
      });
      
      // Wait for component to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(mockImport).toHaveBeenCalled();
      expect(result.current.Component).toBe(MockComponent);
      expect(result.current.isLoading).toBe(false);
    }
  });

  it('should handle import errors', async () => {
    const mockError = new Error('Import failed');
    const mockImport = jest.fn(() => Promise.reject(mockError));
    
    const { result } = renderHook(() => useLazyComponent(mockImport));
    const mockElement = document.createElement('div');
    
    act(() => {
      result.current.ref(mockElement);
    });
    
    // Simulate intersection
    if (mockIntersectionObserver.mock.calls.length > 0) {
      const callback = mockIntersectionObserver.mock.calls[0][0];
      
      act(() => {
        callback([{ isIntersecting: true }]);
      });
      
      // Wait for error to occur
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.Component).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(mockError);
    }
  });
});