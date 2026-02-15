import { memo, type ReactNode } from 'react';
import { Badge } from "@/components/ui/badge";

// 1. 定义 Props 的类型接口
interface TagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onTagSelect: (tags: string[]) => void;
  className?: string;
}

// 2. 在函数参数中使用这个接口
function TagFilter({ allTags, selectedTags, onTagSelect, className = "" }: TagFilterProps): ReactNode {
  const toggleTag = (tag: string) => {
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

// 3. 这里的类型也会自动推断，不需要额外修改
const arePropsEqual = (prevProps: TagFilterProps, nextProps: TagFilterProps) => {
  if (prevProps.allTags?.length !== nextProps.allTags?.length) return false;

  if (prevProps.allTags && nextProps.allTags) {
    for (let i = 0; i < prevProps.allTags.length; i++) {
      if (prevProps.allTags[i] !== nextProps.allTags[i]) return false;
    }
  }

  if (prevProps.selectedTags?.length !== nextProps.selectedTags?.length) return false;

  if (prevProps.selectedTags && nextProps.selectedTags) {
    for (let i = 0; i < prevProps.selectedTags.length; i++) {
      if (prevProps.selectedTags[i] !== nextProps.selectedTags[i]) return false;
    }
  }

  return prevProps.onTagSelect === nextProps.onTagSelect;
};

const MemoizedTagFilter = memo(TagFilter, arePropsEqual);
export default MemoizedTagFilter;
export { type TagFilterProps };