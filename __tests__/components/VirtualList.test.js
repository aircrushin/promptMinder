import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VirtualList, VirtualGrid, VariableHeightVirtualList } from '@/components/ui/virtual-list';

describe('Virtual List Components', () => {
  describe('VirtualList', () => {
    const mockItems = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      content: `Content for item ${i}`
    }));

    const mockRenderItem = jest.fn((item, index) => (
      <div data-testid={`item-${index}`} key={index}>
        {item.name}
      </div>
    ));

    beforeEach(() => {
      mockRenderItem.mockClear();
    });

    it('should render only visible items', () => {
      render(
        <VirtualList
          items={mockItems}
          itemHeight={50}
          containerHeight={200}
          renderItem={mockRenderItem}
        />
      );

      // Should render approximately 4 visible items + overscan (5 by default)
      // With containerHeight=200 and itemHeight=50, we can see 4 items
      // Plus overscan of 5 on each side = ~10-14 items total
      expect(mockRenderItem.mock.calls.length).toBeGreaterThan(8);
      expect(mockRenderItem.mock.calls.length).toBeLessThan(16);
      
      // Check that first few items are rendered
      expect(screen.getByTestId('item-0')).toBeInTheDocument();
      expect(screen.getByTestId('item-1')).toBeInTheDocument();
      
      // Check that items far down the list are not rendered initially
      expect(screen.queryByTestId('item-50')).not.toBeInTheDocument();
    });

    it('should render more items when scrolled', () => {
      const { container } = render(
        <VirtualList
          items={mockItems}
          itemHeight={50}
          containerHeight={200}
          renderItem={mockRenderItem}
        />
      );

      const scrollContainer = container.firstChild;
      
      // Scroll down
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 500 } });

      // Should render items around the new scroll position
      // At scrollTop=500 with itemHeight=50, we're at item 10
      expect(screen.getByTestId('item-10')).toBeInTheDocument();
    });

    it('should handle empty items array', () => {
      render(
        <VirtualList
          items={[]}
          itemHeight={50}
          containerHeight={200}
          renderItem={mockRenderItem}
        />
      );

      expect(mockRenderItem).not.toHaveBeenCalled();
    });

    it('should apply custom className and props', () => {
      const { container } = render(
        <VirtualList
          items={mockItems.slice(0, 5)}
          itemHeight={50}
          containerHeight={200}
          renderItem={mockRenderItem}
          className="custom-class"
          data-testid="virtual-list"
        />
      );

      const virtualList = container.firstChild;
      expect(virtualList).toHaveClass('custom-class');
      expect(virtualList).toHaveAttribute('data-testid', 'virtual-list');
    });

    it('should call onScroll callback when scrolled', () => {
      const onScrollMock = jest.fn();
      const { container } = render(
        <VirtualList
          items={mockItems}
          itemHeight={50}
          containerHeight={200}
          renderItem={mockRenderItem}
          onScroll={onScrollMock}
        />
      );

      const scrollContainer = container.firstChild;
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 100 } });

      expect(onScrollMock).toHaveBeenCalled();
    });
  });

  describe('VirtualGrid', () => {
    const mockItems = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      name: `Item ${i}`
    }));

    const mockRenderItem = jest.fn((item, index) => (
      <div data-testid={`grid-item-${index}`} key={index}>
        {item.name}
      </div>
    ));

    beforeEach(() => {
      mockRenderItem.mockClear();
    });

    it('should render items in grid layout', () => {
      render(
        <VirtualGrid
          items={mockItems}
          itemHeight={100}
          itemsPerRow={3}
          containerHeight={300}
          renderItem={mockRenderItem}
        />
      );

      // With 3 items per row and containerHeight=300, itemHeight=100
      // We can see 3 rows + overscan = ~9 rows * 3 items = ~27 items
      expect(mockRenderItem).toHaveBeenCalled();
      
      // Check that first few items are rendered
      expect(screen.getByTestId('grid-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('grid-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('grid-item-2')).toBeInTheDocument();
    });

    it('should handle different itemsPerRow values', () => {
      render(
        <VirtualGrid
          items={mockItems.slice(0, 10)}
          itemHeight={100}
          itemsPerRow={2}
          containerHeight={300}
          renderItem={mockRenderItem}
        />
      );

      // Should render items in pairs
      expect(mockRenderItem).toHaveBeenCalled();
      expect(screen.getByTestId('grid-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('grid-item-1')).toBeInTheDocument();
    });

    it('should apply gap between items', () => {
      const { container } = render(
        <VirtualGrid
          items={mockItems.slice(0, 6)}
          itemHeight={100}
          itemsPerRow={3}
          containerHeight={300}
          renderItem={mockRenderItem}
          gap={10}
        />
      );

      // Check that gap is applied in styles
      const rowElements = container.querySelectorAll('[style*="gap"]');
      expect(rowElements.length).toBeGreaterThan(0);
    });
  });

  describe('VariableHeightVirtualList', () => {
    const mockItems = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      content: `Content for item ${i}`
    }));

    const mockRenderItem = jest.fn((item, index) => (
      <div 
        data-testid={`variable-item-${index}`} 
        key={index}
      >
        {item.name}: {item.content}
      </div>
    ));

    beforeEach(() => {
      mockRenderItem.mockClear();
    });

    it('should handle empty items array', () => {
      render(
        <VariableHeightVirtualList
          items={[]}
          estimatedItemHeight={60}
          containerHeight={300}
          renderItem={mockRenderItem}
        />
      );

      expect(mockRenderItem).not.toHaveBeenCalled();
    });

    it('should render with estimated heights', () => {
      const { container } = render(
        <VariableHeightVirtualList
          items={mockItems}
          estimatedItemHeight={80}
          containerHeight={300}
          renderItem={mockRenderItem}
        />
      );

      // The component should render with estimated heights initially
      expect(container.firstChild).toBeInTheDocument();
      expect(mockRenderItem).toHaveBeenCalled();
    });
  });

  describe('Performance characteristics', () => {
    it('should not render all items for large datasets', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`
      }));

      const renderSpy = jest.fn((item, index) => (
        <div key={index}>{item.name}</div>
      ));

      render(
        <VirtualList
          items={largeDataset}
          itemHeight={50}
          containerHeight={400}
          renderItem={renderSpy}
        />
      );

      // Should render much fewer than 10000 items
      expect(renderSpy.mock.calls.length).toBeLessThan(20);
      expect(renderSpy.mock.calls.length).toBeGreaterThan(10);
    });

    it('should maintain performance with frequent scrolling', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      const renderSpy = jest.fn((item, index) => <div key={index}>{item.name}</div>);

      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={50}
          containerHeight={200}
          renderItem={renderSpy}
        />
      );

      const scrollContainer = container.firstChild;
      const initialRenderCount = renderSpy.mock.calls.length;

      // Simulate scrolling to different positions
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 500 } });
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 1000 } });
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 0 } });

      // Should not have dramatically increased render calls
      const finalRenderCount = renderSpy.mock.calls.length;
      expect(finalRenderCount).toBeLessThan(100); // Reasonable upper bound
    });
  });

  describe('Edge cases', () => {
    it('should handle items with zero height', () => {
      const items = [{ id: 1, name: 'Item 1' }];
      const renderItem = (item, index) => <div key={index}>{item.name}</div>;

      render(
        <VirtualList
          items={items}
          itemHeight={0}
          containerHeight={200}
          renderItem={renderItem}
        />
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should handle container with zero height', () => {
      const items = [{ id: 1, name: 'Item 1' }];
      const renderItem = (item, index) => <div key={index}>{item.name}</div>;

      render(
        <VirtualList
          items={items}
          itemHeight={50}
          containerHeight={0}
          renderItem={renderItem}
        />
      );

      // Should still render at least the overscan items
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should handle negative scroll positions', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      const renderItem = (item, index) => <div key={index}>{item.name}</div>;

      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={50}
          containerHeight={200}
          renderItem={renderItem}
        />
      );

      const scrollContainer = container.firstChild;
      
      // Try to scroll to negative position
      fireEvent.scroll(scrollContainer, { target: { scrollTop: -100 } });

      // Should handle gracefully and still render first items
      expect(screen.getByText('Item 0')).toBeInTheDocument();
    });
  });
});