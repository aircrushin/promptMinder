import React, { memo } from 'react';
import { render, screen } from '@testing-library/react';

// Mock dependencies
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() })
}));

jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: {
      publicPage: {
        copySuccess: '已复制',
        copyError: '复制失败',
        importTooltip: '导入到我的提示词',
        copyTooltip: '复制提示词',
        copiedTooltip: '已复制',
        importSuccessTitle: '导入成功',
        importSuccessDescription: '提示词已成功导入到您的收藏',
        importErrorTitle: '导入失败',
      }
    }
  })
}));

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    copyPrompt: jest.fn(),
    sharePrompt: jest.fn()
  }
}));

jest.mock('@/lib/clipboard', () => ({
  useClipboard: () => ({ copy: jest.fn(), copied: false })
}));



describe('Component Memoization Tests', () => {
  describe('React.memo functionality', () => {
    it('should prevent re-renders when props are the same', () => {
      const renderSpy = jest.fn();
      
      // Create a simple memoized component for testing
      const TestComponent = memo(({ value }) => {
        renderSpy();
        return <div>{value}</div>;
      });

      const { rerender } = render(<TestComponent value="test" />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with the same props
      rerender(<TestComponent value="test" />);
      
      // Should still only be called once due to memoization
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should re-render when props change', () => {
      const renderSpy = jest.fn();
      
      const TestComponent = memo(({ value }) => {
        renderSpy();
        return <div>{value}</div>;
      });

      const { rerender } = render(<TestComponent value="test" />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with different props
      rerender(<TestComponent value="updated" />);
      
      // Should re-render due to prop change
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should use custom comparison function', () => {
      const renderSpy = jest.fn();
      
      // Custom comparison that only checks the 'important' property
      const areEqual = (prevProps, nextProps) => {
        return prevProps.important === nextProps.important;
      };
      
      const TestComponent = memo(({ important, unimportant }) => {
        renderSpy();
        return <div>{important} - {unimportant}</div>;
      }, areEqual);

      const { rerender } = render(<TestComponent important="same" unimportant="value1" />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same important prop but different unimportant prop
      rerender(<TestComponent important="same" unimportant="value2" />);
      
      // Should not re-render due to custom comparison
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with different important prop
      rerender(<TestComponent important="different" unimportant="value2" />);
      
      // Should re-render due to important prop change
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Array comparison memoization', () => {
    it('should handle array prop changes correctly', () => {
      const renderSpy = jest.fn();
      
      // Custom comparison for array props
      const areEqual = (prevProps, nextProps) => {
        if (prevProps.items?.length !== nextProps.items?.length) {
          return false;
        }
        
        if (prevProps.items && nextProps.items) {
          for (let i = 0; i < prevProps.items.length; i++) {
            if (prevProps.items[i] !== nextProps.items[i]) {
              return false;
            }
          }
        }
        
        return true;
      };
      
      const TestComponent = memo(({ items }) => {
        renderSpy();
        return <div>{items?.join(', ')}</div>;
      }, areEqual);

      const initialItems = ['a', 'b', 'c'];
      const { rerender } = render(<TestComponent items={initialItems} />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same array content but different reference
      rerender(<TestComponent items={['a', 'b', 'c']} />);
      
      // Should not re-render due to custom comparison
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with different array content
      rerender(<TestComponent items={['a', 'b', 'c', 'd']} />);
      
      // Should re-render due to content change
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle object prop changes correctly', () => {
      const renderSpy = jest.fn();
      
      // Custom comparison for object props
      const areEqual = (prevProps, nextProps) => {
        const prevObj = prevProps.data;
        const nextObj = nextProps.data;
        
        if (!prevObj && !nextObj) return true;
        if (!prevObj || !nextObj) return false;
        
        return (
          prevObj.id === nextObj.id &&
          prevObj.name === nextObj.name &&
          prevObj.value === nextObj.value
        );
      };
      
      const TestComponent = memo(({ data }) => {
        renderSpy();
        return <div>{data?.name}: {data?.value}</div>;
      }, areEqual);

      const initialData = { id: 1, name: 'test', value: 'initial' };
      const { rerender } = render(<TestComponent data={initialData} />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same content but different reference
      rerender(<TestComponent data={{ id: 1, name: 'test', value: 'initial' }} />);
      
      // Should not re-render due to custom comparison
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with different content
      rerender(<TestComponent data={{ id: 1, name: 'test', value: 'updated' }} />);
      
      // Should re-render due to content change
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });
});