import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, TaskData, Priority, TaskColor, SortOption, UIState, TaskComment, User, Recurrence } from '@/types/task';
import { v4 as uuidv4 } from 'uuid';

const API_URL = '/api';
const UI_STATE_KEY_PREFIX = 'todo-ui-state';
const CURRENT_USER_KEY = 'todo-current-user-id';

// Get the UI state key for a specific user
function getUIStateKey(userId?: number | null): string {
  if (userId) {
    return `${UI_STATE_KEY_PREFIX}-${userId}`;
  }
  return UI_STATE_KEY_PREFIX;
}

// Default UI state
const DEFAULT_UI_STATE: UIState = {
  searchQuery: '',
  groupFilter: null,
  priorityFilter: null,
  colorFilter: null,
  sortBy: 'order',
  sortAscending: true,
  activeTab: 'active',
};

// Load UI state from localStorage (optionally for a specific user)
export function loadUIState(userId?: number | null): UIState {
  try {
    const key = getUIStateKey(userId);
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load UI state:', e);
  }
  return { ...DEFAULT_UI_STATE };
}

// Save UI state to localStorage (optionally for a specific user)
export function saveUIState(state: UIState, userId?: number | null): void {
  try {
    const key = getUIStateKey(userId);
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save UI state:', e);
  }
}

// Action types for loading states
export type ActionType = 'add' | 'update' | 'delete' | 'toggle' | 'restore' | 'reorder' | 'comment' | null;

// Sync state type
export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

// Type for save queue operations
type SaveOperation = {
  tasks: Task[];
  groups: string[];
  actionType: ActionType;
  resolve: (success: boolean) => void;
};

// Type for undo stack
type UndoEntry = {
  id: string;
  label: string;
  tasks: Task[];
  groups: string[];
  timestamp: Date;
};

const MAX_UNDO_STACK = 10;
const UNDO_TIMEOUT_MS = 10000; // 10 seconds to undo

// Actions that should be debounced (rapid successive calls)
const DEBOUNCED_ACTIONS: ActionType[] = ['reorder', 'update', 'comment'];
const DEBOUNCE_DELAY = 300; // ms

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

  // Load current user ID from localStorage
  function loadCurrentUserId(): number | null {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      return saved ? parseInt(saved, 10) : null;
    } catch (e) {
      return null;
    }
  }

// Save current user ID to localStorage
function saveCurrentUserId(userId: number): void {
  try {
    localStorage.setItem(CURRENT_USER_KEY, String(userId));
  } catch (e) {
    console.error('Failed to save current user ID:', e);
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groups, setGroups] = useState<string[]>(['Work', 'Personal', 'Shopping', 'Health']);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<ActionType>(null);
  
  // Sync state tracking
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Undo stack
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [undoLabel, setUndoLabel] = useState<string | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs to always have access to latest state (avoids stale closures)
  const tasksRef = useRef<Task[]>(tasks);
  const groupsRef = useRef<string[]>(groups);
  const currentUserRef = useRef<User | null>(currentUser);
  
  // Save queue for serializing API calls
  const saveQueueRef = useRef<SaveOperation[]>([]);
  const isProcessingRef = useRef(false);
  
  // Retry tracking
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Debounce refs
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDebouncedSaveRef = useRef<{
    resolve: (success: boolean) => void;
    actionType: ActionType;
  } | null>(null);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncState(prev => prev === 'offline' ? 'synced' : prev);
      // Retry any pending saves when coming back online
      if (saveQueueRef.current.length > 0) {
        processSaveQueue();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSyncState('offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Cleanup debounce, retry, and undo timers on unmount - flush pending saves
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        // On unmount, try to save the pending state synchronously
        // This helps prevent data loss on navigation
        const pending = pendingDebouncedSaveRef.current;
        if (pending && currentUserRef.current) {
          // Fire and forget - we can't wait for this in cleanup
          fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              tasks: tasksRef.current, 
              groups: groupsRef.current,
              userId: currentUserRef.current.id
            }),
          }).catch(console.error);
        }
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  // Fetch users and initialize current user on mount
  useEffect(() => {
    initializeUsers();
  }, []);

  const fetchUsers = async (): Promise<User[]> => {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    const data = await response.json();
    return data.users || [];
  };

  const initializeUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);
      
      if (fetchedUsers.length === 0) {
        setError('No users found');
        setLoading(false);
        return;
      }
      
      // Try to restore the last used user
      const lastUserId = loadCurrentUserId();
      if (lastUserId) {
        const lastUser = fetchedUsers.find(u => u.id === lastUserId);
        if (lastUser) {
          setCurrentUser(lastUser);
          currentUserRef.current = lastUser;
          await fetchTasksForUser(lastUser.id);
        }
      }
      
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize');
      setLoading(false);
    }
  };

  const fetchTasksForUser = async (userId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/tasks?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data: TaskData = await response.json();
      // Ensure all tasks have comments array and recurrence fields (migration for existing data)
      const tasksWithComments = (data.tasks || []).map(task => ({
        ...task,
        comments: task.comments || [],
        recurrence: task.recurrence || null,
        lastCompletedAt: task.lastCompletedAt || null,
      }));
      setTasks(tasksWithComments);
      setGroups(data.groups || ['Work', 'Personal', 'Shopping', 'Health']);
      tasksRef.current = tasksWithComments;
      groupsRef.current = data.groups || ['Work', 'Personal', 'Shopping', 'Health'];
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (currentUserRef.current) {
      await fetchTasksForUser(currentUserRef.current.id);
    }
  };

  // Process save queue sequentially with retry logic
  const processSaveQueue = async () => {
    if (isProcessingRef.current || saveQueueRef.current.length === 0) {
      return;
    }

    // Check if offline
    if (!navigator.onLine) {
      setSyncState('offline');
      return;
    }

    isProcessingRef.current = true;
    setSyncState('syncing');

    while (saveQueueRef.current.length > 0) {
      const operation = saveQueueRef.current[0];
      setActionLoading(operation.actionType);
      
      let success = false;
      let lastError: Error | null = null;

      // Retry loop with exponential backoff
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (!currentUserRef.current) {
            throw new Error('No user selected');
          }
          
          // Check if still online before each attempt
          if (!navigator.onLine) {
            setSyncState('offline');
            isProcessingRef.current = false;
            setActionLoading(null);
            return;
          }
          
          const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              tasks: operation.tasks, 
              groups: operation.groups,
              userId: currentUserRef.current.id
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to save changes');
          }
          
          success = true;
          setError(null);
          retryCountRef.current = 0;
          setLastSyncedAt(new Date());
          break;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Failed to save changes');
          
          // If we have more retries, wait with exponential backoff
          if (attempt < MAX_RETRIES) {
            const delay = Math.min(
              INITIAL_RETRY_DELAY * Math.pow(2, attempt),
              MAX_RETRY_DELAY
            );
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      if (success) {
        operation.resolve(true);
      } else {
        // All retries failed
        setError(lastError?.message || 'Failed to save changes');
        setSyncState('error');
        operation.resolve(false);
        // Refetch to sync with server state after error
        await fetchTasks();
      }

      // Remove processed operation
      saveQueueRef.current.shift();
    }

    // Update sync state if we processed everything successfully
    if (saveQueueRef.current.length === 0 && navigator.onLine) {
      setSyncState('synced');
    }
    
    setActionLoading(null);
    isProcessingRef.current = false;
  };

  // Manual retry function
  const retrySave = useCallback(() => {
    if (syncState === 'error' || syncState === 'offline') {
      setSyncState('syncing');
      setError(null);
      // Re-save current state
      queueSaveImmediate(tasksRef.current, groupsRef.current, 'update');
    }
  }, [syncState]);

  // Push to undo stack
  const pushUndo = useCallback((label: string) => {
    const entry: UndoEntry = {
      id: crypto.randomUUID(),
      label,
      tasks: [...tasksRef.current],
      groups: [...groupsRef.current],
      timestamp: new Date(),
    };
    
    setUndoStack(prev => {
      const newStack = [entry, ...prev].slice(0, MAX_UNDO_STACK);
      return newStack;
    });
    setCanUndo(true);
    setUndoLabel(label);
    
    // Clear undo after timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    undoTimeoutRef.current = setTimeout(() => {
      setCanUndo(false);
      setUndoLabel(null);
    }, UNDO_TIMEOUT_MS);
  }, []);

  // Undo last action
  const undo = useCallback(async () => {
    if (undoStack.length === 0) return false;
    
    const [lastAction, ...rest] = undoStack;
    
    // Restore the previous state
    setTasks(lastAction.tasks);
    setGroups(lastAction.groups);
    tasksRef.current = lastAction.tasks;
    groupsRef.current = lastAction.groups;
    
    // Remove from stack
    setUndoStack(rest);
    setCanUndo(rest.length > 0);
    setUndoLabel(rest.length > 0 ? rest[0].label : null);
    
    // Clear timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    
    // Save the restored state
    await queueSave(lastAction.tasks, lastAction.groups, 'update');
    return true;
  }, [undoStack]);

  // Clear undo stack (e.g., when switching users)
  const clearUndo = useCallback(() => {
    setUndoStack([]);
    setCanUndo(false);
    setUndoLabel(null);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  }, []);

  // Dismiss undo toast (hide UI but keep stack for Cmd+Z)
  const dismissUndo = useCallback(() => {
    setCanUndo(false);
    setUndoLabel(null);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  }, []);

  // Queue a save operation (immediate, no debounce)
  const queueSaveImmediate = (tasks: Task[], groups: string[], actionType: ActionType): Promise<boolean> => {
    return new Promise((resolve) => {
      saveQueueRef.current.push({ tasks, groups, actionType, resolve });
      processSaveQueue();
    });
  };

  // Queue a save operation with optional debouncing
  // For debounced actions, only the last state is saved after the debounce delay
  const queueSave = (tasks: Task[], groups: string[], actionType: ActionType): Promise<boolean> => {
    // Non-debounced actions go straight to the queue
    if (!DEBOUNCED_ACTIONS.includes(actionType)) {
      return queueSaveImmediate(tasks, groups, actionType);
    }

    // For debounced actions, cancel any pending save and schedule a new one
    return new Promise((resolve) => {
      // Cancel previous debounced save timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        // Resolve the previous pending promise with the current success
        // (it will be superseded by the new save anyway)
        if (pendingDebouncedSaveRef.current) {
          pendingDebouncedSaveRef.current.resolve(true);
        }
      }

      // Store the new pending save
      pendingDebouncedSaveRef.current = { resolve, actionType };

      // Schedule the debounced save
      debounceTimerRef.current = setTimeout(async () => {
        debounceTimerRef.current = null;
        const pending = pendingDebouncedSaveRef.current;
        pendingDebouncedSaveRef.current = null;

        if (pending) {
          // Use the LATEST state from refs (not the captured state)
          const success = await queueSaveImmediate(
            tasksRef.current,
            groupsRef.current,
            pending.actionType
          );
          pending.resolve(success);
        }
      }, DEBOUNCE_DELAY);
    });
  };

  // Flush any pending debounced save immediately (useful before navigation)
  const flushPendingSave = async (): Promise<void> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;

      const pending = pendingDebouncedSaveRef.current;
      pendingDebouncedSaveRef.current = null;

      if (pending) {
        const success = await queueSaveImmediate(
          tasksRef.current,
          groupsRef.current,
          pending.actionType
        );
        pending.resolve(success);
      }
    }
  };

  const addTask = useCallback(async (
    name: string,
    priority: Priority,
    groupName: string,
    dueDate: string | null,
    color: TaskColor,
    recurrence: Recurrence | null = null
  ) => {
    // Use ref to get latest state
    const currentTasks = tasksRef.current;
    const currentGroups = groupsRef.current;
    
    const newTask: Task = {
      id: uuidv4(),
      name,
      createdAt: new Date().toISOString(),
      dueDate,
      priority,
      groupName,
      color,
      completed: false,
      archived: false,
      order: currentTasks.length,
      comments: [],
      recurrence,
      lastCompletedAt: null,
    };

    const newTasks = [...currentTasks, newTask];
    
    // Update state immediately (optimistic update)
    setTasks(newTasks);
    tasksRef.current = newTasks;
    
    // Queue the save operation
    const success = await queueSave(newTasks, currentGroups, 'add');
    return success ? newTask : null;
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    // Use functional update to ensure latest state
    setTasks(prev => {
      const newTasks = prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      );
      tasksRef.current = newTasks;
      return newTasks;
    });
    
    // The state update is asynchronous, but tasksRef.current is updated immediately
    await queueSave(tasksRef.current, groupsRef.current, 'update');
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    // Get the task name for undo label before deleting
    const taskToDelete = tasksRef.current.find(t => t.id === id);
    if (taskToDelete) {
      pushUndo(`Delete "${taskToDelete.name.slice(0, 30)}${taskToDelete.name.length > 30 ? '...' : ''}"`);
    }
    
    setTasks(prev => {
      const newTasks = prev.filter(task => task.id !== id);
      tasksRef.current = newTasks;
      return newTasks;
    });
    
    await queueSave(tasksRef.current, groupsRef.current, 'delete');
  }, [pushUndo]);

  const toggleComplete = useCallback(async (id: string) => {
    let taskFound = false;
    
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (!task) return prev;
      taskFound = true;
      
      const isBecomingComplete = !task.completed;
      const newTasks = prev.map(t => 
        t.id === id 
          ? { 
              ...t, 
              completed: !t.completed,
              // Track when the task was last completed (for recurring task reset logic)
              lastCompletedAt: isBecomingComplete ? new Date().toISOString() : t.lastCompletedAt,
            } 
          : t
      );
      tasksRef.current = newTasks;
      return newTasks;
    });
    
    if (!taskFound) return;
    
    await queueSave(tasksRef.current, groupsRef.current, 'toggle');
  }, []);

  const restoreTask = useCallback(async (id: string) => {
    setTasks(prev => {
      const newTasks = prev.map(task => 
        task.id === id 
          ? { ...task, completed: false, archived: false } 
          : task
      );
      tasksRef.current = newTasks;
      return newTasks;
    });
    
    await queueSave(tasksRef.current, groupsRef.current, 'restore');
  }, []);

  const reorderTasks = useCallback(async (activeId: string, overId: string) => {
    let validReorder = false;
    
    setTasks(prev => {
      // Work only with active (non-archived) tasks for reordering
      const currentActiveTasks = prev.filter(t => !t.archived);
      const archivedTasks = prev.filter(t => t.archived);
      
      const oldIndex = currentActiveTasks.findIndex(t => t.id === activeId);
      const newIndex = currentActiveTasks.findIndex(t => t.id === overId);
      
      if (oldIndex === -1 || newIndex === -1) return prev;
      validReorder = true;

      // Reorder within active tasks only
      const reorderedActive = [...currentActiveTasks];
      const [movedTask] = reorderedActive.splice(oldIndex, 1);
      reorderedActive.splice(newIndex, 0, movedTask);
      
      // Update order values only for active tasks
      const updatedActiveTasks = reorderedActive.map((task, index) => ({
        ...task,
        order: index,
      }));

      // Combine: active tasks first (with new order), then archived tasks (unchanged)
      const newTasks = [...updatedActiveTasks, ...archivedTasks];
      tasksRef.current = newTasks;
      return newTasks;
    });

    if (!validReorder) return;
    
    await queueSave(tasksRef.current, groupsRef.current, 'reorder');
  }, []);

  const addGroup = useCallback(async (name: string) => {
    const currentGroups = groupsRef.current;
    if (currentGroups.includes(name)) return;
    
    const newGroups = [...currentGroups, name];
    setGroups(newGroups);
    groupsRef.current = newGroups;
    
    await queueSave(tasksRef.current, newGroups, 'update');
  }, []);

  const renameGroup = useCallback(async (oldName: string, newName: string) => {
    const currentGroups = groupsRef.current;
    if (!oldName || !newName || oldName === newName) return;
    if (currentGroups.includes(newName)) return; // Prevent duplicate names
    
    // Update group list
    const newGroups = currentGroups.map(g => g === oldName ? newName : g);
    
    // Update tasks that belong to this group
    setTasks(prev => {
      const newTasks = prev.map(task =>
        task.groupName === oldName ? { ...task, groupName: newName } : task
      );
      tasksRef.current = newTasks;
      return newTasks;
    });
    
    setGroups(newGroups);
    groupsRef.current = newGroups;
    
    await queueSave(tasksRef.current, newGroups, 'update');
  }, []);

  const removeGroup = useCallback(async (name: string, reassignTo?: string) => {
    const currentGroups = groupsRef.current;
    // Don't remove the last group
    if (currentGroups.length <= 1) return;
    
    // Push undo before making changes
    pushUndo(`Delete group "${name}"`);
    
    const newGroups = currentGroups.filter(g => g !== name);
    
    // If reassignTo is provided, move tasks to that group
    // Otherwise, move to the first available group
    const targetGroup = reassignTo || newGroups[0];
    
    setTasks(prev => {
      const newTasks = prev.map(task =>
        task.groupName === name ? { ...task, groupName: targetGroup } : task
      );
      tasksRef.current = newTasks;
      return newTasks;
    });
    
    setGroups(newGroups);
    groupsRef.current = newGroups;
    
    await queueSave(tasksRef.current, newGroups, 'delete');
  }, [pushUndo]);

  const addComment = useCallback(async (taskId: string, text: string) => {
    const newComment: TaskComment = {
      id: uuidv4(),
      text,
      createdAt: new Date().toISOString(),
    };

    setTasks(prev => {
      const newTasks = prev.map(task =>
        task.id === taskId
          ? { ...task, comments: [...task.comments, newComment] }
          : task
      );
      tasksRef.current = newTasks;
      return newTasks;
    });
    
    const success = await queueSave(tasksRef.current, groupsRef.current, 'comment');
    return success ? newComment : null;
  }, []);

  const deleteComment = useCallback(async (taskId: string, commentId: string) => {
    setTasks(prev => {
      const newTasks = prev.map(task =>
        task.id === taskId
          ? { ...task, comments: task.comments.filter(c => c.id !== commentId) }
          : task
      );
      tasksRef.current = newTasks;
      return newTasks;
    });
    
    await queueSave(tasksRef.current, groupsRef.current, 'comment');
  }, []);

  // User management functions
  const switchUser = useCallback(async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Flush any pending saves for current user before switching
    await flushPendingSave();
    
    // Clear undo stack when switching users
    clearUndo();
    
    setCurrentUser(user);
    currentUserRef.current = user;
    saveCurrentUserId(user.id);
    
    // Fetch tasks for the new user
    await fetchTasksForUser(user.id);
  }, [users, clearUndo]);

  // Import tasks (replace or merge)
  const importTasks = useCallback(async (
    importedTasks: Task[],
    importedGroups: string[],
    mode: 'replace' | 'merge'
  ): Promise<boolean> => {
    // Push undo before import
    pushUndo(mode === 'replace' ? 'Replace all tasks' : 'Import tasks');
    
    let newTasks: Task[];
    let newGroups: string[];
    
    if (mode === 'replace') {
      newTasks = importedTasks.map((task, index) => ({
        ...task,
        order: index,
      }));
      newGroups = importedGroups;
    } else {
      // Merge: add imported tasks after existing ones
      const maxOrder = Math.max(0, ...tasksRef.current.map(t => t.order));
      const mergedTasks = importedTasks.map((task, index) => ({
        ...task,
        id: crypto.randomUUID(), // New IDs to avoid duplicates
        order: maxOrder + index + 1,
      }));
      newTasks = [...tasksRef.current, ...mergedTasks];
      newGroups = [...new Set([...groupsRef.current, ...importedGroups])];
    }
    
    setTasks(newTasks);
    setGroups(newGroups);
    tasksRef.current = newTasks;
    groupsRef.current = newGroups;
    
    return await queueSave(newTasks, newGroups, 'update');
  }, [pushUndo]);

  const createNewUser = useCallback(async (name: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create user');
      }
      
      const data = await response.json();
      const newUser = data.user;
      
      // Update users list
      setUsers(prev => [...prev, newUser]);
      
      return newUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
      return null;
    }
  }, []);

  const deleteExistingUser = useCallback(async (userId: number): Promise<boolean> => {
    try {
      // Don't allow deleting the current user
      if (currentUser?.id === userId) {
        setError('Cannot delete the currently active user');
        return false;
      }
      
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      // Update users list
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      return false;
    }
  }, [currentUser]);

  const updateExistingUser = useCallback(async (
    userId: number, 
    updates: { name?: string; profileImage?: string | null }
  ): Promise<User | null> => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      const data = await response.json();
      const updatedUser = data.user;
      
      // Update users list
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      
      // If this is the current user, update currentUser as well
      if (currentUser?.id === userId) {
        setCurrentUser(updatedUser);
        currentUserRef.current = updatedUser;
      }
      
      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      return null;
    }
  }, [currentUser]);

  // Derived data
  const activeTasks = tasks.filter(t => !t.archived);
  const archivedTasks = tasks.filter(t => t.archived);

  // Clear error after a timeout
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  return {
    tasks,
    activeTasks,
    archivedTasks,
    groups,
    users,
    currentUser,
    loading,
    error,
    actionLoading,
    // Sync state
    syncState,
    lastSyncedAt,
    isOnline,
    retrySave,
    // Undo
    canUndo,
    undoLabel,
    undo,
    dismissUndo,
    // Task operations
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    restoreTask,
    reorderTasks,
    addGroup,
    renameGroup,
    removeGroup,
    addComment,
    deleteComment,
    switchUser,
    createUser: createNewUser,
    updateUser: updateExistingUser,
    deleteUser: deleteExistingUser,
    importTasks,
    refetch: fetchTasks,
    clearError: () => setError(null),
    flushPendingSave, // Call before navigation to ensure data is saved
  };
}

export function sortTasks(tasks: Task[], sortBy: SortOption, ascending: boolean = true): Task[] {
  const sorted = [...tasks].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'dueDate':
        if (!a.dueDate && !b.dueDate) comparison = 0;
        else if (!a.dueDate) comparison = 1;
        else if (!b.dueDate) comparison = -1;
        else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'order':
        comparison = a.order - b.order;
        break;
    }
    
    return ascending ? comparison : -comparison;
  });
  
  return sorted;
}

export function filterTasks(
  tasks: Task[],
  searchQuery: string,
  groupFilter: string | null,
  priorityFilter: Priority | null,
  colorFilter: TaskColor | null = null
): Task[] {
  return tasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = !groupFilter || task.groupName === groupFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    const matchesColor = !colorFilter || task.color === colorFilter;
    
    return matchesSearch && matchesGroup && matchesPriority && matchesColor;
  });
}
