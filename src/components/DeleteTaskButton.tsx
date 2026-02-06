import { useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeleteTaskButtonProps {
  taskName: string;
  onDelete: () => void;
}

export function DeleteTaskButton({ taskName, onDelete }: DeleteTaskButtonProps) {
  const [open, setOpen] = useState(false);

  const handleDelete = useCallback(() => {
    // Close the dialog first, then fire the delete callback on next tick.
    // This prevents the React.Children.only crash caused by the AlertDialog
    // still being mounted while the parent TaskCard unmounts via AnimatePresence.
    setOpen(false);
    requestAnimationFrame(() => {
      onDelete();
    });
  }, [onDelete]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10 min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
          aria-label={`Delete task: ${taskName}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Task</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{taskName}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
