import { useState, useRef } from 'react';
import { Download, Upload, FileJson, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Task, User } from '@/types/task';

interface ExportImportDialogProps {
  tasks: Task[];
  groups: string[];
  currentUser: User | null;
  onImport: (tasks: Task[], groups: string[], mode: 'replace' | 'merge') => Promise<boolean>;
}

export function ExportImportDialog({
  tasks,
  groups,
  currentUser,
  onImport,
}: ExportImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<{ tasks: Task[]; groups: string[] } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userName = currentUser?.name || 'User';

  // Export as JSON
  const handleExportJSON = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: userName,
      tasks,
      groups,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${userName.toLowerCase()}-tasks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export as CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Priority', 'Group', 'Due Date', 'Color', 'Completed', 'Archived', 'Created At', 'Comments Count'];
    const rows = tasks.map(task => [
      `"${task.name.replace(/"/g, '""')}"`,
      task.priority,
      task.groupName,
      task.dueDate || '',
      task.color,
      task.completed ? 'Yes' : 'No',
      task.archived ? 'Yes' : 'No',
      task.createdAt,
      task.comments.length.toString(),
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${userName.toLowerCase()}-tasks-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle file selection for import
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate the import data
        if (!Array.isArray(data.tasks)) {
          throw new Error('Invalid file format: missing tasks array');
        }
        
        // Basic validation of tasks
        const validatedTasks: Task[] = data.tasks.map((task: Partial<Task>, index: number) => {
          if (!task.name || typeof task.name !== 'string') {
            throw new Error(`Task ${index + 1}: missing or invalid name`);
          }
          
          return {
            id: task.id || crypto.randomUUID(),
            name: task.name,
            createdAt: task.createdAt || new Date().toISOString(),
            dueDate: task.dueDate || null,
            priority: ['low', 'medium', 'high'].includes(task.priority || '') ? task.priority : 'medium',
            groupName: task.groupName || (data.groups?.[0] || groups[0] || 'Personal'),
            color: task.color || 'blue',
            completed: Boolean(task.completed),
            archived: Boolean(task.archived),
            order: typeof task.order === 'number' ? task.order : index,
            comments: Array.isArray(task.comments) ? task.comments : [],
          } as Task;
        });
        
        const importedGroups = Array.isArray(data.groups) ? data.groups : groups;
        
        // Ensure all task groups exist in the groups list
        const allGroups = new Set([...importedGroups, ...groups]);
        validatedTasks.forEach(task => allGroups.add(task.groupName));
        
        setPendingImport({
          tasks: validatedTasks,
          groups: Array.from(allGroups),
        });
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to parse file');
      }
    };
    
    reader.onerror = () => {
      setImportError('Failed to read file');
    };
    
    reader.readAsText(file);
    
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Confirm import
  const handleConfirmImport = async (mode: 'replace' | 'merge') => {
    if (!pendingImport) return;
    
    setIsImporting(true);
    try {
      const success = await onImport(pendingImport.tasks, pendingImport.groups, mode);
      if (success) {
        setPendingImport(null);
        setIsOpen(false);
      } else {
        setImportError('Failed to import tasks');
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import tasks');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 sm:h-9 gap-1.5 px-2 sm:px-3">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto sm:w-full sm:rounded-lg">
          <DialogHeader>
            <DialogTitle>Export & Import</DialogTitle>
            <DialogDescription>
              Export your tasks for backup or import from a previous export.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Export Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Export {userName}'s Tasks</h3>
              <p className="text-xs text-muted-foreground">
                Download your {tasks.length} task{tasks.length !== 1 ? 's' : ''} as a backup file.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={handleExportJSON}
                >
                  <FileJson className="h-4 w-4" />
                  JSON (Full backup)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={handleExportCSV}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Spreadsheet)
                </Button>
              </div>
            </div>
            
            <div className="border-t" />
            
            {/* Import Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Import Tasks</h3>
              <p className="text-xs text-muted-foreground">
                Restore from a JSON backup file.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Select JSON file to import
              </Button>
              
              {importError && (
                <div className="flex items-center gap-2 text-xs text-destructive p-2 bg-destructive/10 rounded">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  {importError}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={!!pendingImport} onOpenChange={(open) => !open && setPendingImport(null)}>
        <AlertDialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto sm:w-full sm:rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Import {pendingImport?.tasks.length} Tasks?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Choose how to handle the import:
              </span>
              <span className="block text-sm">
                <strong>Replace:</strong> Remove all current tasks and use only imported tasks.
              </span>
              <span className="block text-sm">
                <strong>Merge:</strong> Add imported tasks to your existing tasks.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={isImporting}>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => handleConfirmImport('merge')}
              disabled={isImporting}
            >
              {isImporting ? 'Importing...' : 'Merge'}
            </Button>
            <AlertDialogAction
              onClick={() => handleConfirmImport('replace')}
              disabled={isImporting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isImporting ? 'Importing...' : 'Replace All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
