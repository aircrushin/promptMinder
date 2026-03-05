import { memo } from 'react';
import { cn } from '@/lib/utils';

function TagFilter({ allTags, selectedTags, onTagSelect, className = "" }) {
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onTagSelect(selectedTags.filter(t => t !== tag));
    } else {
      onTagSelect([...selectedTags, tag]);
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {allTags.map((tag) => (
        <button
          type="button"
          key={tag}
          aria-pressed={selectedTags.includes(tag)}
          onClick={() => toggleTag(tag)}
          className={cn(
            'inline-flex min-h-9 items-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-8 md:px-2 md:py-1 md:text-[11px]',
            selectedTags.includes(tag)
              ? 'border-transparent bg-primary text-primary-foreground shadow'
              : 'border-input bg-background text-foreground hover:bg-accent'
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

// Custom comparison function for TagFilter memoization
const arePropsEqual = (prevProps, nextProps) => {
  // Compare allTags array
  if (prevProps.allTags?.length !== nextProps.allTags?.length) {
    return false;
  }
  
  if (prevProps.allTags && nextProps.allTags) {
    for (let i = 0; i < prevProps.allTags.length; i++) {
      if (prevProps.allTags[i] !== nextProps.allTags[i]) {
        return false;
      }
    }
  }
  
  // Compare selectedTags array
  if (prevProps.selectedTags?.length !== nextProps.selectedTags?.length) {
    return false;
  }
  
  if (prevProps.selectedTags && nextProps.selectedTags) {
    for (let i = 0; i < prevProps.selectedTags.length; i++) {
      if (prevProps.selectedTags[i] !== nextProps.selectedTags[i]) {
        return false;
      }
    }
  }
  
  // Compare function reference (should be stable with useCallback)
  return prevProps.onTagSelect === nextProps.onTagSelect;
};

export default memo(TagFilter, arePropsEqual);
