import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Archive, ListTodo, ChevronDown, ChevronUp, X, Minimize2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { FilterBar } from '@/components/FilterBar';
import { QuickAdd } from '@/components/QuickAdd';
import { ProgressBar } from '@/components/ProgressBar';
import { MinimalView } from '@/components/MinimalView';
import { MobileBottomBar } from '@/components/MobileBottomBar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GroupManagementDialog } from '@/components/GroupManagementDialog';
import { UserSwitcher, getUserColor } from '@/components/UserSwitcher';
import { SyncStatus, SyncStatusCompact } from '@/components/SyncStatus';
import { ExportImportDialog } from '@/components/ExportImportDialog';
import { UndoToast } from '@/components/UndoToast';
import { useTasks, sortTasks, filterTasks, loadUIState, saveUIState } from '@/hooks/useTasks';
import { Priority, SortOption, TaskColor } from '@/types/task';
import { cn } from '@/lib/utils';
import { viewTransitionVariants } from '@/lib/motion';

const MINIMAL_VIEW_KEY = 'todo-minimal-view';

function App() {
  const {
    tasks,
    activeTasks,
    archivedTasks,
    groups,
    users,
    currentUser,
    loading,
    error,
    // Sync state
    syncState,
    lastSyncedAt,
    retrySave,
    refetch,
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
    updateUser,
    importTasks,
    clearError,
  } = useTasks();

  // Handle undo dismiss (hides the toast but keeps stack for Cmd+Z)
  const handleUndoDismiss = () => {
    dismissUndo();
  };

  // Filter & Sort state (will be loaded per-user)
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);
  const [colorFilter, setColorFilter] = useState<TaskColor | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('order');
  const [sortAscending, setSortAscending] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('active');

  // Load UI state when user changes
  useEffect(() => {
    if (currentUser?.id) {
      const savedUIState = loadUIState(currentUser.id);
      setSearchQuery(savedUIState.searchQuery);
      setGroupFilter(savedUIState.groupFilter);
      setPriorityFilter(savedUIState.priorityFilter);
      setColorFilter(savedUIState.colorFilter || null);
      setSortBy(savedUIState.sortBy);
      setSortAscending(savedUIState.sortAscending);
      setActiveTab(savedUIState.activeTab);
    }
  }, [currentUser?.id]);
  const [showFullForm, setShowFullForm] = useState(false);
  const [isMinimalView, setIsMinimalView] = useState(() => {
    // Check URL parameter first (for direct links)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'minimal') {
      return true;
    }
    // Fall back to localStorage preference
    try {
      return localStorage.getItem(MINIMAL_VIEW_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Quick add handler - adds task with default values
  const handleQuickAdd = (name: string) => {
    addTask(name, 'medium', groups[0] || 'Personal', null, 'blue');
  };

  // Toggle minimal view and persist preference
  const toggleMinimalView = useCallback(() => {
    setIsMinimalView(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem(MINIMAL_VIEW_KEY, String(newValue));
        // Update URL without page reload
        const url = new URL(window.location.href);
        if (newValue) {
          url.searchParams.set('view', 'minimal');
        } else {
          url.searchParams.delete('view');
        }
        window.history.replaceState({}, '', url.toString());
      } catch {
        // Ignore errors
      }
      return newValue;
    });
  }, []);

  // Keyboard shortcut: M to toggle minimal view, Cmd+Z to undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Z or Ctrl+Z to undo
      if (
        e.key === 'z' &&
        (e.metaKey || e.ctrlKey) &&
        !e.shiftKey &&
        canUndo
      ) {
        e.preventDefault();
        undo();
        return;
      }
      
      // M to toggle minimal view (only if not typing in an input)
      if (
        e.key.toLowerCase() === 'm' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        toggleMinimalView();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleMinimalView, canUndo, undo]);

  // Save UI state whenever it changes (per-user)
  useEffect(() => {
    if (currentUser?.id) {
      saveUIState({
        searchQuery,
        groupFilter,
        priorityFilter,
        colorFilter,
        sortBy,
        sortAscending,
        activeTab: activeTab as 'active' | 'archived',
      }, currentUser.id);
    }
  }, [searchQuery, groupFilter, priorityFilter, colorFilter, sortBy, sortAscending, activeTab, currentUser?.id]);

  // Apply filters and sorting to active tasks
  const filteredActiveTasks = useMemo(() => {
    const filtered = filterTasks(activeTasks, searchQuery, groupFilter, priorityFilter, colorFilter);
    return sortTasks(filtered, sortBy, sortAscending);
  }, [activeTasks, searchQuery, groupFilter, priorityFilter, colorFilter, sortBy, sortAscending]);

  // Apply filters and sorting to archived tasks
  const filteredArchivedTasks = useMemo(() => {
    const filtered = filterTasks(archivedTasks, searchQuery, groupFilter, priorityFilter, colorFilter);
    return sortTasks(filtered, sortBy, sortAscending);
  }, [archivedTasks, searchQuery, groupFilter, priorityFilter, colorFilter, sortBy, sortAscending]);

  // Check if any filters are active
  const hasActiveFilters = Boolean(searchQuery || groupFilter || priorityFilter || colorFilter);

  // Function to clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setGroupFilter(null);
    setPriorityFilter(null);
    setColorFilter(null);
  };

  // Compute task counts by group (for GroupManagementDialog)
  const taskCountByGroup = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of groups) {
      counts[group] = tasks.filter(t => t.groupName === group).length;
    }
    return counts;
  }, [tasks, groups]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="rounded-full h-8 w-8 border-b-2 border-primary mx-auto"
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-muted-foreground"
          >
            Loading tasks...
          </motion.p>
        </div>
      </motion.div>
    );
  }

  // Minimal view for floating windows
  if (isMinimalView) {
    return (
      <MinimalView
        tasks={tasks}
        onToggleComplete={toggleComplete}
        onRestore={restoreTask}
        onQuickAdd={handleQuickAdd}
        onExpandView={toggleMinimalView}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="container mx-auto py-3 sm:py-6 md:py-8 px-2 sm:px-4 lg:px-6 max-w-4xl">
        {/* Header - Compact on mobile */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Todo List</h1>
              {/* Current user badge - highly visible */}
              {currentUser && (
                <span className={cn(
                  "text-xs sm:text-sm font-semibold px-2 py-0.5 rounded-full",
                  getUserColor(currentUser.name).bg,
                  getUserColor(currentUser.name).text
                )}>
                  {currentUser.name}'s Tasks
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
            {/* Compact sync status indicator */}
            <SyncStatusCompact state={syncState} />
            <UserSwitcher
              users={users}
              currentUser={currentUser}
              onSwitchUser={switchUser}
              onUpdateUser={updateUser}
            />
            <ExportImportDialog
              tasks={tasks}
              groups={groups}
              currentUser={currentUser}
              onImport={importTasks}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMinimalView}
              aria-label="Switch to minimal view"
              title="Minimal view (M)"
              className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <GroupManagementDialog
              groups={groups}
              taskCountByGroup={taskCountByGroup}
              onAddGroup={addGroup}
              onRenameGroup={renameGroup}
              onDeleteGroup={removeGroup}
            />
            <ThemeToggle />
          </div>
        </div>

        {/* Sync Status Bar - Show when syncing, error, or offline */}
        {(syncState === 'error' || syncState === 'offline') && (
          <div className="mb-3 sm:mb-4">
            <SyncStatus
              state={syncState}
              lastSyncedAt={lastSyncedAt}
              errorMessage={error}
              onRetry={retrySave}
              onRefresh={refetch}
              className="w-full justify-center py-2"
            />
          </div>
        )}

        {/* Error Message (for non-sync errors) */}
        {error && syncState !== 'error' && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center justify-between text-sm sm:text-base">
            <span className="flex-1 mr-2">{error}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive flex-shrink-0"
              onClick={clearError}
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Progress Bar */}
        {activeTasks.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <ProgressBar 
              completed={activeTasks.filter(t => t.completed).length} 
              total={activeTasks.length} 
            />
          </div>
        )}

        {/* Quick Add - Hidden on mobile (shown in bottom bar instead) */}
        <div className="mb-3 sm:mb-4 hidden md:block">
          <QuickAdd onAdd={handleQuickAdd} />
        </div>

        {/* Full Task Form (Collapsible) */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <Button
            variant="ghost"
            onClick={() => setShowFullForm(!showFullForm)}
            className="w-full justify-between mb-2 text-muted-foreground hover:text-foreground text-sm sm:text-base h-9 sm:h-10"
            aria-expanded={showFullForm}
            aria-controls="full-task-form"
          >
            <span className="flex items-center gap-2">
              {showFullForm ? 'Hide' : 'Show'} full task form
            </span>
            <motion.span
              animate={{ rotate: showFullForm ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </Button>
          <AnimatePresence>
            {showFullForm && (
              <motion.div
                id="full-task-form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <TaskForm 
                  groups={groups} 
                  onSubmit={addTask} 
                  onAddGroup={addGroup} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tabs for Active/Archived */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-10 sm:h-11">
            <TabsTrigger value="active" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <ListTodo className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Active</span> ({activeTasks.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Archive className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Archived</span> ({archivedTasks.length})
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="active" className="space-y-3 sm:space-y-4" asChild>
              <motion.div
                key="active"
                variants={viewTransitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Card>
                  <CardHeader className="py-3 px-3 sm:py-4 sm:px-6">
                    <CardTitle className="text-base sm:text-lg">Filter & Sort</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
                    <FilterBar
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      groupFilter={groupFilter}
                      onGroupFilterChange={setGroupFilter}
                      priorityFilter={priorityFilter}
                      onPriorityFilterChange={setPriorityFilter}
                      colorFilter={colorFilter}
                      onColorFilterChange={setColorFilter}
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                      sortAscending={sortAscending}
                      onSortDirectionChange={setSortAscending}
                      groups={groups}
                    />
                  </CardContent>
                </Card>

                <TaskList
                  tasks={filteredActiveTasks}
                  groups={groups}
                  totalCount={activeTasks.length}
                  hasActiveFilters={hasActiveFilters}
                  isArchiveView={false}
                  userName={currentUser?.name}
                  onToggleComplete={toggleComplete}
                  onDelete={deleteTask}
                  onUpdate={updateTask}
                  onReorder={reorderTasks}
                  onAddComment={addComment}
                  onDeleteComment={deleteComment}
                  onClearFilters={clearFilters}
                  onShowFullForm={() => setShowFullForm(true)}
                  isDraggable={sortBy === 'order'}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="archived" className="space-y-3 sm:space-y-4" asChild>
              <motion.div
                key="archived"
                variants={viewTransitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Card>
                  <CardHeader className="py-3 px-3 sm:py-4 sm:px-6">
                    <CardTitle className="text-base sm:text-lg">Archived Tasks</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      Completed tasks are moved here. You can restore them to active tasks.
                    </p>
                    <FilterBar
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      groupFilter={groupFilter}
                      onGroupFilterChange={setGroupFilter}
                      priorityFilter={priorityFilter}
                      onPriorityFilterChange={setPriorityFilter}
                      colorFilter={colorFilter}
                      onColorFilterChange={setColorFilter}
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                      sortAscending={sortAscending}
                      onSortDirectionChange={setSortAscending}
                      groups={groups}
                    />
                  </CardContent>
                </Card>

                <TaskList
                  tasks={filteredArchivedTasks}
                  groups={groups}
                  totalCount={archivedTasks.length}
                  hasActiveFilters={hasActiveFilters}
                  isArchiveView={true}
                  onToggleComplete={toggleComplete}
                  onDelete={deleteTask}
                  onUpdate={updateTask}
                  onReorder={reorderTasks}
                  onRestore={restoreTask}
                  onAddComment={addComment}
                  onDeleteComment={deleteComment}
                  onClearFilters={clearFilters}
                  isDraggable={false}
                />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
      
      {/* Mobile Bottom Action Bar */}
      <MobileBottomBar onAdd={handleQuickAdd} />
      
      {/* Undo Toast */}
      {canUndo && undoLabel && (
        <UndoToast
          label={undoLabel}
          onUndo={undo}
          onDismiss={handleUndoDismiss}
        />
      )}
    </div>
  );
}

export default App;
