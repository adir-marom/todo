export type Priority = 'low' | 'medium' | 'high';

export interface User {
  id: number;
  name: string;
  createdAt: string;
}

export type TaskColor = 
  | 'red' 
  | 'orange' 
  | 'yellow' 
  | 'green' 
  | 'blue' 
  | 'purple' 
  | 'pink' 
  | 'gray';

export interface TaskComment {
  id: string;
  text: string;
  createdAt: string;
}

export interface Task {
  id: string;
  name: string;
  createdAt: string;
  dueDate: string | null;
  priority: Priority;
  groupName: string;
  color: TaskColor;
  completed: boolean;
  archived: boolean;
  order: number;
  comments: TaskComment[];
}

export interface TaskData {
  tasks: Task[];
  groups: string[];
}

export interface UIState {
  searchQuery: string;
  groupFilter: string | null;
  priorityFilter: Priority | null;
  colorFilter: TaskColor | null;
  sortBy: SortOption;
  sortAscending: boolean;
  activeTab: 'active' | 'archived';
}

// Pastel color palette for task indicators
export const TASK_COLORS: { value: TaskColor; label: string; hex: string }[] = [
  { value: 'red', label: 'Coral', hex: '#F8A5A5' },
  { value: 'orange', label: 'Peach', hex: '#FECCA8' },
  { value: 'yellow', label: 'Lemon', hex: '#FEF3A5' },
  { value: 'green', label: 'Mint', hex: '#A8E6CF' },
  { value: 'blue', label: 'Sky', hex: '#A8D8EA' },
  { value: 'purple', label: 'Lavender', hex: '#C9B1FF' },
  { value: 'pink', label: 'Rose', hex: '#FFB7C5' },
  { value: 'gray', label: 'Silver', hex: '#C5C6C7' },
];

// Pastel priority colors with good contrast for text
export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; textColor: string; icon: 'high' | 'medium' | 'low' }> = {
  low: { label: 'Low', color: 'bg-[#A8E6CF] dark:bg-[#6BBF9E]', textColor: 'text-[#2D5A4A] dark:text-[#1A3D30]', icon: 'low' },
  medium: { label: 'Medium', color: 'bg-[#FEF3A5] dark:bg-[#E6D98F]', textColor: 'text-[#6B5C00] dark:text-[#4A4000]', icon: 'medium' },
  high: { label: 'High', color: 'bg-[#F8A5A5] dark:bg-[#E08080]', textColor: 'text-[#7A2828] dark:text-[#5A1A1A]', icon: 'high' },
};

export type SortOption = 'dueDate' | 'priority' | 'createdAt' | 'name' | 'order';
