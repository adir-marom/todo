import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InsightData } from "@/hooks/useDailyInsight";
import { CheckCircle2, AlertCircle, Calendar } from "lucide-react";

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
            <span className="text-primary">👋</span> Daily Insight
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {insight.message}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="flex flex-col items-center justify-center p-4 bg-secondary/20 rounded-lg text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <div className="text-2xl font-bold">{insight.pendingTasksCount}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Pending Tasks</div>
          </div>
          
          <div className="flex flex-col items-center justify-center p-4 bg-destructive/10 rounded-lg text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="text-2xl font-bold text-destructive">{insight.highPriorityCount}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">High Priority</div>
          </div>
        </div>

        {insight.daysSinceLastVisit > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pb-2">
                <Calendar className="h-4 w-4" />
                <span>Last visited {insight.daysSinceLastVisit} day{insight.daysSinceLastVisit !== 1 ? 's' : ''} ago</span>
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
