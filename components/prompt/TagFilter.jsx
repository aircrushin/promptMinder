import { memo } from 'react';
import { Badge } from "@/components/ui/badge"

function TagFilter({ allTags, selectedTags, onTagSelect, className = "" }) {
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onTagSelect(selectedTags.filter(t => t !== tag));
    } else {
      onTagSelect([...selectedTags, tag]);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {allTags.map((tag) => (
        <Badge
          key={tag}
          variant={selectedTags.includes(tag) ? "default" : "outline"}
          className={`cursor-pointer px-2.5 py-1 text-xs font-medium transition-all hover:opacity-80 ${
            selectedTags.includes(tag) ? "" : "bg-background"
          }`}
          onClick={() => toggleTag(tag)}
        >
          {tag}
        </Badge>
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
