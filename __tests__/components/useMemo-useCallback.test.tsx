// @ts-nocheck
import React, { useState, useMemo, useCallback } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

describe('useMemo and useCallback Optimizations', () => {
  describe('useMemo for expensive computations', () => {
    it('should memoize expensive filtering operations', () => {
      const expensiveFilterSpy = jest.fn();
      
      const TestComponent = ({ items, filter }) => {
        const filteredItems = useMemo(() => {
          expensiveFilterSpy();
          return items.filter(item => item.includes(filter));
        }, [items, filter]);
        
        return (
          <div>
            {filteredItems.map((item, index) => (
              <div key={index}>{item}</div>
            ))}
          </div>
        );
      };

      const items = ['apple', 'banana', 'cherry', 'date'];
      const { rerender } = render(<TestComponent items={items} filter="a" />);
      
      expect(expensiveFilterSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props - should not recalculate
      rerender(<TestComponent items={items} filter="a" />);
      expect(expensiveFilterSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with different filter - should recalculate
      rerender(<TestComponent items={items} filter="b" />);
      expect(expensiveFilterSpy).toHaveBeenCalledTimes(2);
    });

    it('should memoize array transformations', () => {
      const transformSpy = jest.fn();
      
      const TestComponent = ({ data }) => {
        const transformedData = useMemo(() => {
          transformSpy();
          return data.map(item => ({ ...item, processed: true }));
        }, [data]);
        
        return (
          <div>
            {transformedData.map((item, index) => (
              <div key={index}>{item.name} - {item.processed ? 'processed' : 'raw'}</div>
            ))}
          </div>
        );
      };

      const data = [{ name: 'item1' }, { name: 'item2' }];
      const { rerender } = render(<TestComponent data={data} />);
      
      expect(transformSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same data - should not recalculate
      rerender(<TestComponent data={data} />);
      expect(transformSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with different data - should recalculate
      const newData = [{ name: 'item3' }];
      rerender(<TestComponent data={newData} />);
      expect(transformSpy).toHaveBeenCalledTimes(2);
    });

    it('should memoize object grouping operations', () => {
      const groupSpy = jest.fn();
      
      const TestComponent = ({ items }) => {
        const groupedItems = useMemo(() => {
          groupSpy();
          return items.reduce((acc, item) => {
            if (!acc[item.category]) {
              acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
          }, {});
        }, [items]);
        
        return (
          <div>
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category}>
                <h3>{category}</h3>
                {categoryItems.map((item, index) => (
                  <div key={index}>{item.name}</div>
                ))}
              </div>
            ))}
          </div>
        );
      };

      const items = [
        { name: 'apple', category: 'fruit' },
        { name: 'carrot', category: 'vegetable' },
        { name: 'banana', category: 'fruit' }
      ];
      
      const { rerender } = render(<TestComponent items={items} />);
      
      expect(groupSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same items - should not recalculate
      rerender(<TestComponent items={items} />);
      expect(groupSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with different items - should recalculate
      const newItems = [...items, { name: 'lettuce', category: 'vegetable' }];
      rerender(<TestComponent items={newItems} />);
      expect(groupSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('useCallback for event handlers', () => {
    it('should memoize event handlers to prevent child re-renders', () => {
      const childRenderSpy = jest.fn();
      
      const ChildComponent = React.memo(({ onClick }) => {
        childRenderSpy();
        return <button onClick={onClick}>Click me</button>;
      });
      
      const ParentComponent = () => {
        const [count, setCount] = useState(0);
        const [otherState, setOtherState] = useState('initial');
        
        const handleClick = useCallback(() => {
          setCount(prev => prev + 1);
        }, []);
        
        return (
          <div>
            <div>Count: {count}</div>
            <div>Other: {otherState}</div>
            <button onClick={() => setOtherState('updated')}>Update Other</button>
            <ChildComponent onClick={handleClick} />
          </div>
        );
      };

      render(<ParentComponent />);
      
      expect(childRenderSpy).toHaveBeenCalledTimes(1);
      
      // Update other state - child should not re-render due to memoized callback
      fireEvent.click(screen.getByText('Update Other'));
      expect(childRenderSpy).toHaveBeenCalledTimes(1);
      
      // Click the child button - child should still not re-render unnecessarily
      fireEvent.click(screen.getByText('Click me'));
      expect(childRenderSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle dependencies correctly in useCallback', () => {
      const TestComponent = () => {
        const [multiplier, setMultiplier] = useState(2);
        const [value, setValue] = useState(1);
        
        const handleCalculate = useCallback((input) => {
          return input * multiplier;
        }, [multiplier]);
        
        return (
          <div>
            <div>Multiplier: {multiplier}</div>
            <div>Value: {value}</div>
            <button onClick={() => setMultiplier(3)}>Change Multiplier</button>
            <button onClick={() => setValue(5)}>Change Value</button>
            <div data-testid="result">{handleCalculate(value)}</div>
          </div>
        );
      };

      render(<TestComponent />);
      
      expect(screen.getByTestId('result')).toHaveTextContent('2'); // 1 * 2
      
      // Change value - result should update
      fireEvent.click(screen.getByText('Change Value'));
      expect(screen.getByTestId('result')).toHaveTextContent('10'); // 5 * 2
      
      // Change multiplier - result should update
      fireEvent.click(screen.getByText('Change Multiplier'));
      expect(screen.getByTestId('result')).toHaveTextContent('15'); // 5 * 3
    });

    it('should optimize search debouncing with useCallback', () => {
      const searchSpy = jest.fn();
      
      const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      };
      
      const TestComponent = () => {
        const [query, setQuery] = useState('');
        
        const debouncedSearch = useCallback(
          debounce((value) => {
            searchSpy(value);
          }, 100),
          []
        );
        
        const handleInputChange = (e) => {
          const value = e.target.value;
          setQuery(value);
          debouncedSearch(value);
        };
        
        return (
          <div>
            <input 
              value={query}
              onChange={handleInputChange}
              placeholder="Search..."
            />
            <div>Query: {query}</div>
          </div>
        );
      };

      render(<TestComponent />);
      
      const input = screen.getByPlaceholderText('Search...');
      
      // Type quickly - should debounce
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.change(input, { target: { value: 'abc' } });
      
      // Should not have called search yet
      expect(searchSpy).not.toHaveBeenCalled();
      
      // Wait for debounce
      setTimeout(() => {
        expect(searchSpy).toHaveBeenCalledWith('abc');
        expect(searchSpy).toHaveBeenCalledTimes(1);
      }, 150);
    });
  });

  describe('Combined useMemo and useCallback optimizations', () => {
    it('should work together for complex filtering scenarios', () => {
      const filterSpy = jest.fn();
      const handlerSpy = jest.fn();
      
      const TestComponent = () => {
        const [items] = useState([
          { id: 1, name: 'Apple', category: 'fruit', price: 1.5 },
          { id: 2, name: 'Banana', category: 'fruit', price: 0.8 },
          { id: 3, name: 'Carrot', category: 'vegetable', price: 1.2 }
        ]);
        const [selectedCategory, setSelectedCategory] = useState('');
        const [maxPrice, setMaxPrice] = useState(2.0);
        
        // Memoize expensive filtering
        const filteredItems = useMemo(() => {
          filterSpy();
          return items.filter(item => {
            const matchesCategory = !selectedCategory || item.category === selectedCategory;
            const matchesPrice = item.price <= maxPrice;
            return matchesCategory && matchesPrice;
          });
        }, [items, selectedCategory, maxPrice]);
        
        // Memoize event handlers
        const handleCategoryChange = useCallback((category) => {
          handlerSpy('category', category);
          setSelectedCategory(category);
        }, []);
        
        const handlePriceChange = useCallback((price) => {
          handlerSpy('price', price);
          setMaxPrice(price);
        }, []);
        
        return (
          <div>
            <button onClick={() => handleCategoryChange('fruit')}>Filter Fruits</button>
            <button onClick={() => handlePriceChange(1.0)}>Max $1.00</button>
            <div data-testid="filtered-count">{filteredItems.length}</div>
            {filteredItems.map(item => (
              <div key={item.id}>{item.name} - ${item.price}</div>
            ))}
          </div>
        );
      };

      render(<TestComponent />);
      
      expect(filterSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('filtered-count')).toHaveTextContent('3');
      
      // Filter by category
      fireEvent.click(screen.getByText('Filter Fruits'));
      expect(filterSpy).toHaveBeenCalledTimes(2);
      expect(handlerSpy).toHaveBeenCalledWith('category', 'fruit');
      expect(screen.getByTestId('filtered-count')).toHaveTextContent('2');
      
      // Filter by price
      fireEvent.click(screen.getByText('Max $1.00'));
      expect(filterSpy).toHaveBeenCalledTimes(3);
      expect(handlerSpy).toHaveBeenCalledWith('price', 1.0);
      expect(screen.getByTestId('filtered-count')).toHaveTextContent('1');
    });
  });
});