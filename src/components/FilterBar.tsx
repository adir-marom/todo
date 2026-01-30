import { Search, X, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Priority, SortOption, TaskColor, TASK_COLORS } from '@/types/task';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  groupFilter: string | null;
  onGroupFilterChange: (group: string | null) => void;
  priorityFilter: Priority | null;
  onPriorityFilterChange: (priority: Priority | null) => void;
  colorFilter: TaskColor | null;
  onColorFilterChange: (color: TaskColor | null) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  sortAscending: boolean;
  onSortDirectionChange: (ascending: boolean) => void;
  groups: string[];
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  groupFilter,
  onGroupFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  colorFilter,
  onColorFilterChange,
  sortBy,
  onSortChange,
  sortAscending,
  onSortDirectionChange,
  groups,
}: FilterBarProps) {
  const hasActiveFilters = searchQuery || groupFilter || priorityFilter || colorFilter;
  const activeFilterCount = [searchQuery, groupFilter, priorityFilter, colorFilter].filter(Boolean).length;

  const clearFilters = () => {
    onSearchChange('');
    onGroupFilterChange(null);
    onPriorityFilterChange(null);
    onColorFilterChange(null);
  };

  return (
    <div className="space-y-1.5 sm:space-y-3">
      {/* Search Input - larger touch target on mobile */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-9 sm:h-9 text-sm"
          aria-label="Search tasks"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filters - Horizontal scroll on mobile, wrap on tablet+ */}
      <div className="overflow-x-auto pb-1 sm:pb-0 sm:overflow-visible scrollbar-none">
        <div className="flex gap-1 sm:gap-2 sm:flex-wrap min-w-max sm:min-w-0">
          <Select 
            value={groupFilter || 'all'} 
            onValueChange={(v) => onGroupFilterChange(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[85px] sm:w-[120px] md:w-[130px] h-8 sm:h-9 text-[11px] sm:text-sm" aria-label="Filter by group">
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={priorityFilter || 'all'} 
            onValueChange={(v) => onPriorityFilterChange(v === 'all' ? null : v as Priority)}
          >
            <SelectTrigger className="w-[85px] sm:w-[120px] md:w-[140px] h-8 sm:h-9 text-[11px] sm:text-sm" aria-label="Filter by priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#F8A5A5]" />
                  <ArrowUp className="h-3 w-3 text-[#7A2828]" />
                  High
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FEF3A5]" />
                  <Minus className="h-3 w-3 text-[#6B5C00]" />
                  Medium
                </div>
              </SelectItem>
              <SelectItem value="low">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#A8E6CF]" />
                  <ArrowDown className="h-3 w-3 text-[#2D5A4A]" />
                  Low
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={colorFilter || 'all'} 
            onValueChange={(v) => onColorFilterChange(v === 'all' ? null : v as TaskColor)}
          >
            <SelectTrigger className="w-[70px] sm:w-[100px] md:w-[120px] h-8 sm:h-9 text-[11px] sm:text-sm" aria-label="Filter by color">
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colors</SelectItem>
              {TASK_COLORS.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: color.hex }}
                      aria-hidden="true"
                    />
                    {color.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
            <SelectTrigger className="w-[80px] sm:w-[120px] md:w-[140px] h-8 sm:h-9 text-[11px] sm:text-sm" aria-label="Sort by">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="order">Manual</SelectItem>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="createdAt">Created</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onSortDirectionChange(!sortAscending)}
            className="px-2 sm:px-3 h-8 sm:h-9 text-[11px] sm:text-sm flex-shrink-0"
            aria-label={`Sort direction: ${sortAscending ? 'ascending' : 'descending'}. Click to toggle.`}
          >
            {sortAscending ? '↑' : '↓'}
            <span className="hidden sm:inline ml-1">{sortAscending ? 'Asc' : 'Desc'}</span>
          </Button>

          {hasActiveFilters && (
            <Button
              variant="secondary"
              size="sm"
              onClick={clearFilters}
              className="px-2 sm:px-3 h-8 sm:h-9 text-[11px] sm:text-sm flex-shrink-0"
              aria-label={`Clear ${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}`}
            >
              <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Clear</span>
              <span className="ml-0.5 sm:ml-0">({activeFilterCount})</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
