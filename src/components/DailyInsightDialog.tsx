import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InsightData } from "@/hooks/useDailyInsight";
import { ListTodo, AlertTriangle, Clock, Calendar } from "lucide-react";

interface DailyInsightDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  insight: InsightData | null;
}

export function DailyInsightDialog({ isOpen, onOpenChange, insight }: DailyInsightDialogProps) {
  if (!insight) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            Daily Insight
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {insight.message}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-4">
          {/* Pending tasks */}
          <div className="flex flex-col items-center justify-center p-3 bg-primary/10 rounded-lg text-center space-y-1.5">
            <ListTodo className="h-6 w-6 text-primary" />
            <div className="text-2xl font-bold">{insight.pendingTasksCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">Pending</div>
          </div>

          {/* High priority */}
          <div className="flex flex-col items-center justify-center p-3 bg-destructive/10 rounded-lg text-center space-y-1.5">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div className="text-2xl font-bold text-destructive">{insight.highPriorityCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">High Priority</div>
          </div>

          {/* Overdue */}
          <div className="flex flex-col items-center justify-center p-3 bg-orange-500/10 rounded-lg text-center space-y-1.5">
            <Clock className="h-6 w-6 text-orange-500" />
            <div className="text-2xl font-bold text-orange-500">{insight.overdueTasks}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">Overdue</div>
          </div>
        </div>

        {insight.daysSinceLastVisit > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pb-2">
            <Calendar className="h-4 w-4" />
            <span>
              Last visited {insight.daysSinceLastVisit} day{insight.daysSinceLastVisit !== 1 ? 's' : ''} ago
            </span>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Let's get started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
