import { useState, useEffect } from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { Task } from '@/types/task';

const INSIGHT_KEY = 'daily_insight_last_shown';
const LAST_VISIT_KEY = 'app_last_visit';

export interface InsightData {
  daysSinceLastVisit: number;
  pendingTasksCount: number;
  highPriorityCount: number;
  completedYesterdayCount: number;
  message: string;
}

export function useDailyInsight(tasks: Task[], isLoading: boolean, userName?: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [insight, setInsight] = useState<InsightData | null>(null);

  useEffect(() => {
    if (isLoading) return;

    const checkInsight = () => {
      const lastShown = localStorage.getItem(INSIGHT_KEY);
      const today = new Date().toISOString().split('T')[0];

      // If already shown today, don't show again
      if (lastShown === today) {
        return;
      }

      const lastVisitStr = localStorage.getItem(LAST_VISIT_KEY);
      const lastVisit = lastVisitStr ? new Date(lastVisitStr) : new Date();
      const daysSince = lastVisitStr ? differenceInCalendarDays(new Date(), lastVisit) : 0;

      // Calculate insights
      const activeTasks = tasks.filter(t => !t.completed && !t.archived);
      const highPriority = activeTasks.filter(t => t.priority === 'high').length;
      
      // Check for tasks completed yesterday (mock logic as we might not have completion date stored in a way to easily query "yesterday" without parsing all)
      // The Task interface has 'createdAt' but not 'completedAt'. 
      // We'll skip "completed yesterday" for now or use a placeholder if we can't calculate it accurately.
      
      let message = `Welcome back${userName ? `, ${userName}` : ''}!`;
      if (daysSince > 7) {
        message = `It's been a while! We missed you. Ready to get back on track?`;
      } else if (daysSince > 1) {
        message = `Welcome back! It's been ${daysSince} days since your last visit.`;
      } else if (activeTasks.length === 0) {
        message = "You're all caught up! Enjoy your day.";
      } else {
        message = `Here is your daily summary.`;
      }

      setInsight({
        daysSinceLastVisit: daysSince,
        pendingTasksCount: activeTasks.length,
        highPriorityCount: highPriority,
        completedYesterdayCount: 0, 
        message
      });
      setIsOpen(true);

      // Update storage
      localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
      localStorage.setItem(INSIGHT_KEY, today);
    };

    // Use a small timeout to ensure the UI has settled and it feels like a "welcome" event
    const timer = setTimeout(() => {
      checkInsight();
    }, 1000);

    return () => clearTimeout(timer);
  }, [tasks, isLoading, userName]);

  return { isOpen, setIsOpen, insight };
}
