import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Archive, ListTodo, ChevronDown, X, Minimize2 } from 'lucide-react';
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
import { UserSelection } from '@/components/UserSelection';
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
    syncState,
    lastSyncedAt,
    retrySave,
    refetch,
    canUndo,
    undoLabel,
    undo,
    dismissUndo,
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

  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);
  const [colorFilter, setColorFilter] = useState<TaskColor | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('order');
  const [sortAscending, setSortAscending] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('active');
  const [isUserSelected, setIsUserSelected] = useState(false);

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
      setIsUserSelected(true);
    }
  }, [currentUser?.id]);

  const handleSelectUser = (userId: number) => {
    switchUser(userId);
    setIsUserSelected(true);
  };

  const [showFullForm, setShowFullForm] = useState(false);
  const [isMinimalView, setIsMinimalView] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'minimal') return true;
    try {
      return localStorage.getItem(MINIMAL_VIEW_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleQuickAdd = (name: string) => {
    addTask(name, 'medium', groups[0] || 'Personal', null, 'blue');
  };

  const toggleMinimalView = useCallback(() => {
    setIsMinimalView(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem(MINIMAL_VIEW_KEY, String(newValue));
        const url = new URL(window.location.href);
        if (newValue) url.searchParams.set('view', 'minimal');
        else url.searchParams.delete('view');
        window.history.replaceState({}, '', url.toString());
      } catch {}
      return newValue;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey && canUndo) {
        e.preventDefault();
        undo();
        return;
      }
      if (e.key.toLowerCase() === 'm' && !e.metaKey && !e.ctrlKey && !e.altKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        toggleMinimalView();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleMinimalView, canUndo, undo]);

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

  const filteredActiveTasks = useMemo(() => {
    const filtered = filterTasks(activeTasks, searchQuery, groupFilter, priorityFilter, colorFilter);
    return sortTasks(filtered, sortBy, sortAscending);
  }, [activeTasks, searchQuery, groupFilter, priorityFilter, colorFilter, sortBy, sortAscending]);

  const filteredArchivedTasks = useMemo(() => {
    const filtered = filterTasks(archivedTasks, searchQuery, groupFilter, priorityFilter, colorFilter);
    return sortTasks(filtered, sortBy, sortAscending);
  }, [archivedTasks, searchQuery, groupFilter, priorityFilter, colorFilter, sortBy, sortAscending]);

  const hasActiveFilters = Boolean(searchQuery || groupFilter || priorityFilter || colorFilter);

  const clearFilters = () => {
    setSearchQuery('');
    setGroupFilter(null);
    setPriorityFilter(null);
    setColorFilter(null);
  };

  const taskCountByGroup = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of groups) {
      counts[group] = tasks.filter(t => t.groupName === group).length;
    }
    return counts;
  }, [tasks, groups]);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-2 text-muted-foreground">Loading tasks...</motion.p>
        </div>
      </motion.div>
    );
  }

  // If no user is selected, show the selection screen
  if (!isUserSelected && users.length > 0 && !currentUser) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="user-selection"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.1,
            filter: "blur(20px)",
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
          }}
        >
          <UserSelection 
            users={users} 
            onSelectUser={handleSelectUser} 
            onUpdateUser={updateUser}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (isMinimalView) {
    return <MinimalView tasks={tasks} onToggleComplete={toggleComplete} onRestore={restoreTask} onQuickAdd={handleQuickAdd} onExpandView={toggleMinimalView} />;
  }

  return (
    <AnimatePresence mode="wait">
      {!isUserSelected && users.length > 0 && !currentUser ? (
        <motion.div
          key="user-selection"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.1,
            filter: "blur(20px)",
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
          }}
        >
          <UserSelection users={users} onSelectUser={handleSelectUser} onUpdateUser={updateUser} />
        </motion.div>
      ) : (
        <motion.div
          key="app-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="min-h-screen bg-background pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0"
        >
          <div className="container mx-auto py-2 sm:py-6 md:py-8 px-3 sm:px-4 lg:px-6 max-w-4xl">
            <div className="flex items-center justify-between mb-3 sm:mb-6 md:mb-8 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-bold truncate">Todo List</h1>
                  {currentUser && (
                    <span className={cn("text-[10px] sm:text-sm font-semibold px-1.5 sm:px-2 py-0.5 rounded-full w-fit", getUserColor(currentUser.name).bg, getUserColor(currentUser.name).text)}>
                      {currentUser.name}'s Tasks
                    </span>
                  )}
                </div>
              </div>
            <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 flex-shrink-0">
                <SyncStatusCompact state={syncState} />
                <UserSwitcher users={users} currentUser={currentUser} onSwitchUser={switchUser} onUpdateUser={updateUser} />
                <ExportImportDialog tasks={tasks} groups={groups} currentUser={currentUser} onImport={importTasks} />
                <Button variant="ghost" size="icon" onClick={toggleMinimalView} aria-label="Switch to minimal view" title="Minimal view (M)" className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <GroupManagementDialog groups={groups} taskCountByGroup={taskCountByGroup} onAddGroup={addGroup} onRenameGroup={renameGroup} onDeleteGroup={removeGroup} />
                <ThemeToggle />
              </div>
            </div>

            {(syncState === 'error' || syncState === 'offline') && (
              <div className="mb-2 sm:mb-4">
                <SyncStatus state={syncState} lastSyncedAt={lastSyncedAt} errorMessage={error} onRetry={retrySave} onRefresh={refetch} className="w-full justify-center py-2" />
              </div>
            )}

            {error && syncState !== 'error' && (
              <div className="mb-2 sm:mb-4 p-2 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center justify-between text-xs sm:text-base">
                <span className="flex-1 mr-2">{error}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive flex-shrink-0" onClick={clearError} aria-label="Dismiss error">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {activeTasks.length > 0 && (
              <div className="mb-3 sm:mb-6">
                <ProgressBar completed={activeTasks.filter(t => t.completed).length} total={activeTasks.length} />
              </div>
            )}

            <div className="mb-2 sm:mb-4 hidden md:block">
              <QuickAdd onAdd={handleQuickAdd} />
            </div>

            <div className="mb-3 sm:mb-6 md:mb-8">
              <Button variant="ghost" onClick={() => setShowFullForm(!showFullForm)} className="w-full justify-between mb-1.5 sm:mb-2 text-muted-foreground hover:text-foreground text-xs sm:text-base h-8 sm:h-10" aria-expanded={showFullForm} aria-controls="full-task-form">
                <span className="flex items-center gap-2">{showFullForm ? 'Hide' : 'Show'} full task form</span>
                <motion.span animate={{ rotate: showFullForm ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="h-4 w-4" /></motion.span>
              </Button>
              <AnimatePresence>
                {showFullForm && (
                  <motion.div id="full-task-form" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="overflow-hidden">
                    <TaskForm groups={groups} onSubmit={addTask} onAddGroup={addGroup} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2 sm:space-y-4">
              <TabsList className="grid w-full grid-cols-2 h-9 sm:h-11">
                <TabsTrigger value="active" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <ListTodo className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Active ({activeTasks.length})
                </TabsTrigger>
                <TabsTrigger value="archived" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Archive className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Archived ({archivedTasks.length})
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="active" className="space-y-2 sm:space-y-4 mt-0" asChild>
                  <motion.div key="active" variants={viewTransitionVariants} initial="initial" animate="animate" exit="exit">
                    <Card>
                      <CardHeader className="py-2 px-3 sm:py-4 sm:px-6"><CardTitle className="text-sm sm:text-lg">Filter & Sort</CardTitle></CardHeader>
                      <CardContent className="px-3 pb-2 sm:px-6 sm:pb-6 pt-0">
                        <FilterBar searchQuery={searchQuery} onSearchChange={setSearchQuery} groupFilter={groupFilter} onGroupFilterChange={setGroupFilter} priorityFilter={priorityFilter} onPriorityFilterChange={setPriorityFilter} colorFilter={colorFilter} onColorFilterChange={setColorFilter} sortBy={sortBy} onSortChange={setSortBy} sortAscending={sortAscending} onSortDirectionChange={setSortAscending} groups={groups} />
                      </CardContent>
                    </Card>
                    <TaskList tasks={filteredActiveTasks} groups={groups} totalCount={activeTasks.length} hasActiveFilters={hasActiveFilters} isArchiveView={false} userName={currentUser?.name} onToggleComplete={toggleComplete} onDelete={deleteTask} onUpdate={updateTask} onReorder={reorderTasks} onAddComment={addComment} onDeleteComment={deleteComment} onClearFilters={clearFilters} onShowFullForm={() => setShowFullForm(true)} isDraggable={sortBy === 'order'} />
                  </motion.div>
                </TabsContent>

                <TabsContent value="archived" className="space-y-2 sm:space-y-4 mt-0" asChild>
                  <motion.div key="archived" variants={viewTransitionVariants} initial="initial" animate="animate" exit="exit">
                    <Card>
                      <CardHeader className="py-2 px-3 sm:py-4 sm:px-6"><CardTitle className="text-sm sm:text-lg">Archived Tasks</CardTitle></CardHeader>
                      <CardContent className="px-3 pb-2 sm:px-6 sm:pb-6 pt-0">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">Completed tasks are moved here. You can restore them to active tasks.</p>
                        <FilterBar searchQuery={searchQuery} onSearchChange={setSearchQuery} groupFilter={groupFilter} onGroupFilterChange={setGroupFilter} priorityFilter={priorityFilter} onPriorityFilterChange={setPriorityFilter} colorFilter={colorFilter} onColorFilterChange={setColorFilter} sortBy={sortBy} onSortChange={setSortBy} sortAscending={sortAscending} onSortDirectionChange={setSortAscending} groups={groups} />
                      </CardContent>
                    </Card>
                    <TaskList tasks={filteredArchivedTasks} groups={groups} totalCount={archivedTasks.length} hasActiveFilters={hasActiveFilters} isArchiveView={true} onToggleComplete={toggleComplete} onDelete={deleteTask} onUpdate={updateTask} onReorder={reorderTasks} onRestore={restoreTask} onAddComment={addComment} onDeleteComment={deleteComment} onClearFilters={clearFilters} isDraggable={false} />
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </div>
          <MobileBottomBar onAdd={handleQuickAdd} />
          {canUndo && undoLabel && <UndoToast label={undoLabel} onUndo={undo} onDismiss={dismissUndo} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
