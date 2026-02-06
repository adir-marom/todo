import { describe, it, expect } from 'vitest';
import { sortTasks, filterTasks } from './useTasks';
import { Task, Priority, TaskColor } from '@/types/task';

// Helper to create a task with defaults
const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: `task-${Math.random().toString(36).slice(2)}`,
  name: 'Test Task',
  createdAt: '2024-01-15T10:00:00.000Z',
  dueDate: null,
  priority: 'medium',
  groupName: 'Work',
  color: 'blue',
  completed: false,
  archived: false,
  order: 0,
  comments: [],
  recurrence: null,
  lastCompletedAt: null,
  ...overrides,
});

describe('sortTasks', () => {
  describe('sorting by order', () => {
    it('should sort tasks by order ascending', () => {
      const tasks = [
        createTask({ id: '1', order: 2 }),
        createTask({ id: '2', order: 0 }),
        createTask({ id: '3', order: 1 }),
      ];

      const sorted = sortTasks(tasks, 'order', true);

      expect(sorted.map(t => t.id)).toEqual(['2', '3', '1']);
    });

    it('should sort tasks by order descending', () => {
      const tasks = [
        createTask({ id: '1', order: 2 }),
        createTask({ id: '2', order: 0 }),
        createTask({ id: '3', order: 1 }),
      ];

      const sorted = sortTasks(tasks, 'order', false);

      expect(sorted.map(t => t.id)).toEqual(['1', '3', '2']);
    });
  });

  describe('sorting by name', () => {
    it('should sort tasks alphabetically by name ascending', () => {
      const tasks = [
        createTask({ id: '1', name: 'Zebra task' }),
        createTask({ id: '2', name: 'Apple task' }),
        createTask({ id: '3', name: 'Mango task' }),
      ];

      const sorted = sortTasks(tasks, 'name', true);

      expect(sorted.map(t => t.name)).toEqual(['Apple task', 'Mango task', 'Zebra task']);
    });

    it('should sort tasks alphabetically by name descending', () => {
      const tasks = [
        createTask({ id: '1', name: 'Zebra task' }),
        createTask({ id: '2', name: 'Apple task' }),
        createTask({ id: '3', name: 'Mango task' }),
      ];

      const sorted = sortTasks(tasks, 'name', false);

      expect(sorted.map(t => t.name)).toEqual(['Zebra task', 'Mango task', 'Apple task']);
    });

    it('should handle case-insensitive sorting via localeCompare', () => {
      const tasks = [
        createTask({ id: '1', name: 'banana' }),
        createTask({ id: '2', name: 'Apple' }),
        createTask({ id: '3', name: 'CHERRY' }),
      ];

      const sorted = sortTasks(tasks, 'name', true);

      // localeCompare handles case-insensitive sorting
      expect(sorted.map(t => t.name)).toEqual(['Apple', 'banana', 'CHERRY']);
    });
  });

  describe('sorting by priority', () => {
    it('should sort tasks by priority ascending (high first)', () => {
      const tasks = [
        createTask({ id: '1', priority: 'low' }),
        createTask({ id: '2', priority: 'high' }),
        createTask({ id: '3', priority: 'medium' }),
      ];

      const sorted = sortTasks(tasks, 'priority', true);

      expect(sorted.map(t => t.priority)).toEqual(['high', 'medium', 'low']);
    });

    it('should sort tasks by priority descending (low first)', () => {
      const tasks = [
        createTask({ id: '1', priority: 'low' }),
        createTask({ id: '2', priority: 'high' }),
        createTask({ id: '3', priority: 'medium' }),
      ];

      const sorted = sortTasks(tasks, 'priority', false);

      expect(sorted.map(t => t.priority)).toEqual(['low', 'medium', 'high']);
    });
  });

  describe('sorting by dueDate', () => {
    it('should sort tasks by due date ascending (earliest first)', () => {
      const tasks = [
        createTask({ id: '1', dueDate: '2024-03-15T00:00:00.000Z' }),
        createTask({ id: '2', dueDate: '2024-01-15T00:00:00.000Z' }),
        createTask({ id: '3', dueDate: '2024-02-15T00:00:00.000Z' }),
      ];

      const sorted = sortTasks(tasks, 'dueDate', true);

      expect(sorted.map(t => t.id)).toEqual(['2', '3', '1']);
    });

    it('should sort tasks by due date descending (latest first)', () => {
      const tasks = [
        createTask({ id: '1', dueDate: '2024-03-15T00:00:00.000Z' }),
        createTask({ id: '2', dueDate: '2024-01-15T00:00:00.000Z' }),
        createTask({ id: '3', dueDate: '2024-02-15T00:00:00.000Z' }),
      ];

      const sorted = sortTasks(tasks, 'dueDate', false);

      expect(sorted.map(t => t.id)).toEqual(['1', '3', '2']);
    });

    it('should place tasks without due dates at the end when ascending', () => {
      const tasks = [
        createTask({ id: '1', dueDate: null }),
        createTask({ id: '2', dueDate: '2024-01-15T00:00:00.000Z' }),
        createTask({ id: '3', dueDate: null }),
        createTask({ id: '4', dueDate: '2024-02-15T00:00:00.000Z' }),
      ];

      const sorted = sortTasks(tasks, 'dueDate', true);

      // Tasks with dates come first, null dates at the end
      expect(sorted.map(t => t.id)).toEqual(['2', '4', '1', '3']);
    });

    it('should place tasks without due dates at the start when descending', () => {
      const tasks = [
        createTask({ id: '1', dueDate: null }),
        createTask({ id: '2', dueDate: '2024-01-15T00:00:00.000Z' }),
        createTask({ id: '3', dueDate: null }),
        createTask({ id: '4', dueDate: '2024-02-15T00:00:00.000Z' }),
      ];

      const sorted = sortTasks(tasks, 'dueDate', false);

      // Descending: later dates first, then nulls at the end (reversed from ascending)
      expect(sorted.map(t => t.id)).toEqual(['1', '3', '4', '2']);
    });

    it('should handle all tasks without due dates', () => {
      const tasks = [
        createTask({ id: '1', dueDate: null }),
        createTask({ id: '2', dueDate: null }),
        createTask({ id: '3', dueDate: null }),
      ];

      const sorted = sortTasks(tasks, 'dueDate', true);

      // Order should be preserved when all have null dates
      expect(sorted).toHaveLength(3);
    });
  });

  describe('sorting by createdAt', () => {
    it('should sort tasks by creation date ascending (oldest first)', () => {
      const tasks = [
        createTask({ id: '1', createdAt: '2024-03-15T10:00:00.000Z' }),
        createTask({ id: '2', createdAt: '2024-01-15T10:00:00.000Z' }),
        createTask({ id: '3', createdAt: '2024-02-15T10:00:00.000Z' }),
      ];

      const sorted = sortTasks(tasks, 'createdAt', true);

      expect(sorted.map(t => t.id)).toEqual(['2', '3', '1']);
    });

    it('should sort tasks by creation date descending (newest first)', () => {
      const tasks = [
        createTask({ id: '1', createdAt: '2024-03-15T10:00:00.000Z' }),
        createTask({ id: '2', createdAt: '2024-01-15T10:00:00.000Z' }),
        createTask({ id: '3', createdAt: '2024-02-15T10:00:00.000Z' }),
      ];

      const sorted = sortTasks(tasks, 'createdAt', false);

      expect(sorted.map(t => t.id)).toEqual(['1', '3', '2']);
    });
  });

  describe('edge cases', () => {
    it('should return empty array when given empty array', () => {
      const sorted = sortTasks([], 'order', true);
      expect(sorted).toEqual([]);
    });

    it('should return single task when given single task', () => {
      const task = createTask({ id: '1' });
      const sorted = sortTasks([task], 'order', true);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].id).toBe('1');
    });

    it('should not mutate the original array', () => {
      const tasks = [
        createTask({ id: '1', order: 2 }),
        createTask({ id: '2', order: 0 }),
      ];
      const originalFirstId = tasks[0].id;

      sortTasks(tasks, 'order', true);

      expect(tasks[0].id).toBe(originalFirstId);
    });

    it('should use ascending by default when ascending parameter is not provided', () => {
      const tasks = [
        createTask({ id: '1', order: 2 }),
        createTask({ id: '2', order: 0 }),
      ];

      const sorted = sortTasks(tasks, 'order');

      expect(sorted.map(t => t.id)).toEqual(['2', '1']);
    });
  });
});

describe('filterTasks', () => {
  const testTasks: Task[] = [
    createTask({ id: '1', name: 'Buy groceries', groupName: 'Shopping', priority: 'high', color: 'red' }),
    createTask({ id: '2', name: 'Finish report', groupName: 'Work', priority: 'medium', color: 'blue' }),
    createTask({ id: '3', name: 'Call mom', groupName: 'Personal', priority: 'low', color: 'green' }),
    createTask({ id: '4', name: 'Buy birthday gift', groupName: 'Shopping', priority: 'medium', color: 'purple' }),
    createTask({ id: '5', name: 'Review code', groupName: 'Work', priority: 'high', color: 'blue' }),
  ];

  describe('search filtering', () => {
    it('should filter tasks by search query (case-insensitive)', () => {
      const filtered = filterTasks(testTasks, 'buy', null, null, null);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(t => t.id)).toEqual(['1', '4']);
    });

    it('should handle uppercase search query', () => {
      const filtered = filterTasks(testTasks, 'BUY', null, null, null);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(t => t.id)).toEqual(['1', '4']);
    });

    it('should handle mixed case search query', () => {
      const filtered = filterTasks(testTasks, 'BuY', null, null, null);

      expect(filtered).toHaveLength(2);
    });

    it('should return all tasks when search query is empty', () => {
      const filtered = filterTasks(testTasks, '', null, null, null);

      expect(filtered).toHaveLength(5);
    });

    it('should return no tasks when search query matches nothing', () => {
      const filtered = filterTasks(testTasks, 'xyz123', null, null, null);

      expect(filtered).toHaveLength(0);
    });

    it('should handle partial matches', () => {
      const filtered = filterTasks(testTasks, 'rep', null, null, null);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Finish report');
    });
  });

  describe('group filtering', () => {
    it('should filter tasks by group', () => {
      const filtered = filterTasks(testTasks, '', 'Shopping', null, null);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(t => t.groupName === 'Shopping')).toBe(true);
    });

    it('should return all tasks when group filter is null', () => {
      const filtered = filterTasks(testTasks, '', null, null, null);

      expect(filtered).toHaveLength(5);
    });

    it('should return no tasks when group does not exist', () => {
      const filtered = filterTasks(testTasks, '', 'NonExistentGroup', null, null);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('priority filtering', () => {
    it('should filter tasks by priority', () => {
      const filtered = filterTasks(testTasks, '', null, 'high', null);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(t => t.priority === 'high')).toBe(true);
    });

    it('should return all tasks when priority filter is null', () => {
      const filtered = filterTasks(testTasks, '', null, null, null);

      expect(filtered).toHaveLength(5);
    });

    it('should filter low priority tasks', () => {
      const filtered = filterTasks(testTasks, '', null, 'low', null);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].priority).toBe('low');
    });
  });

  describe('color filtering', () => {
    it('should filter tasks by color', () => {
      const filtered = filterTasks(testTasks, '', null, null, 'blue');

      expect(filtered).toHaveLength(2);
      expect(filtered.every(t => t.color === 'blue')).toBe(true);
    });

    it('should return all tasks when color filter is null', () => {
      const filtered = filterTasks(testTasks, '', null, null, null);

      expect(filtered).toHaveLength(5);
    });

    it('should return no tasks when color does not match any task', () => {
      const filtered = filterTasks(testTasks, '', null, null, 'pink');

      expect(filtered).toHaveLength(0);
    });
  });

  describe('combined filtering', () => {
    it('should combine search and group filters', () => {
      const filtered = filterTasks(testTasks, 'buy', 'Shopping', null, null);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(t => t.groupName === 'Shopping')).toBe(true);
      expect(filtered.every(t => t.name.toLowerCase().includes('buy'))).toBe(true);
    });

    it('should combine search and priority filters', () => {
      const filtered = filterTasks(testTasks, 'code', null, 'high', null);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Review code');
    });

    it('should combine group and priority filters', () => {
      const filtered = filterTasks(testTasks, '', 'Work', 'high', null);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Review code');
    });

    it('should combine all filters', () => {
      const filtered = filterTasks(testTasks, 'report', 'Work', 'medium', 'blue');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Finish report');
    });

    it('should return empty when combined filters have no match', () => {
      const filtered = filterTasks(testTasks, 'buy', 'Work', 'high', 'red');

      expect(filtered).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should return empty array when given empty array', () => {
      const filtered = filterTasks([], 'test', 'Work', 'high', 'blue');
      expect(filtered).toEqual([]);
    });

    it('should not mutate the original array', () => {
      const originalLength = testTasks.length;

      filterTasks(testTasks, 'buy', null, null, null);

      expect(testTasks).toHaveLength(originalLength);
    });

    it('should handle special characters in search query', () => {
      const tasksWithSpecialChars = [
        createTask({ id: '1', name: 'Task (important)' }),
        createTask({ id: '2', name: 'Task [urgent]' }),
        createTask({ id: '3', name: 'Task with $money' }),
      ];

      const filtered = filterTasks(tasksWithSpecialChars, '(important)', null, null, null);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should handle whitespace in search query', () => {
      const filtered = filterTasks(testTasks, '  buy  ', null, null, null);

      // Note: current implementation doesn't trim, so this tests actual behavior
      expect(filtered).toHaveLength(0);
    });

    it('should handle tasks with empty names', () => {
      const tasksWithEmptyName = [
        createTask({ id: '1', name: '' }),
        createTask({ id: '2', name: 'Valid task' }),
      ];

      const filtered = filterTasks(tasksWithEmptyName, '', null, null, null);

      expect(filtered).toHaveLength(2);
    });
  });
});
