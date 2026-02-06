import { useState, useEffect, useRef } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import { Task } from '@/types/task';

const INSIGHT_KEY_PREFIX = 'daily_insight_last_shown';
const LAST_VISIT_KEY_PREFIX = 'app_last_visit';

function getInsightKey(userId: number) {
  return `${INSIGHT_KEY_PREFIX}:${userId}`;
}

function getLastVisitKey(userId: number) {
  return `${LAST_VISIT_KEY_PREFIX}:${userId}`;
}

/** Returns today's date in local timezone as YYYY-MM-DD */
function getLocalToday(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export interface InsightData {
  daysSinceLastVisit: number;
  pendingTasksCount: number;
  highPriorityCount: number;
  overdueTasks: number;
  message: string;
}

interface UseDailyInsightOptions {
  tasks: Task[];
  isLoading: boolean;
  userId?: number;
  userName?: string;
}

export function useDailyInsight({ tasks, isLoading, userId, userName }: UseDailyInsightOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [insight, setInsight] = useState<InsightData | null>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Don't trigger until data is loaded and we have a real user
    if (isLoading || !userId) return;

    // Only trigger once per mount (avoid re-running when tasks array ref changes)
    if (hasTriggered.current) return;

    const checkInsight = () => {
      try {
        const insightKey = getInsightKey(userId);
        const visitKey = getLastVisitKey(userId);
        const lastShown = localStorage.getItem(insightKey);
        const today = getLocalToday();

        // If already shown today for this user, don't show again
        if (lastShown === today) {
          hasTriggered.current = true;
          return;
        }

        const lastVisitStr = localStorage.getItem(visitKey);
        const lastVisit = lastVisitStr ? new Date(lastVisitStr) : null;
        const daysSince = lastVisit
          ? differenceInCalendarDays(new Date(), lastVisit)
          : 0;

        // Calculate insights from active (non-completed, non-archived) tasks
        const activeTasks = tasks.filter(t => !t.completed && !t.archived);
        const highPriority = activeTasks.filter(t => t.priority === 'high').length;

        // Count overdue tasks (due date is before today)
        const now = new Date();
        const overdue = activeTasks.filter(t => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate) < now;
        }).length;

        // Build a contextual welcome message
        let message: string;
        if (daysSince > 7) {
          message = `It's been a while${userName ? `, ${userName}` : ''}! We missed you. Ready to get back on track?`;
        } else if (daysSince > 1) {
          message = `Welcome back${userName ? `, ${userName}` : ''}! It's been ${daysSince} days since your last visit.`;
        } else if (activeTasks.length === 0) {
          message = `You're all caught up${userName ? `, ${userName}` : ''}! Enjoy your day.`;
        } else {
          message = `Good to see you${userName ? `, ${userName}` : ''}! Here's your daily summary.`;
        }

        setInsight({
          daysSinceLastVisit: daysSince,
          pendingTasksCount: activeTasks.length,
          highPriorityCount: highPriority,
          overdueTasks: overdue,
          message,
        });
        setIsOpen(true);
        hasTriggered.current = true;

        // Persist that we showed the insight today and record the visit
        localStorage.setItem(visitKey, new Date().toISOString());
        localStorage.setItem(insightKey, today);
      } catch {
        // localStorage might be unavailable (private browsing, etc.) — silently skip
      }
    };

    // Small delay so the main UI renders first and the dialog feels like a "welcome" overlay
    const timer = setTimeout(checkInsight, 800);
    return () => clearTimeout(timer);
  }, [tasks, isLoading, userId, userName]);

  return { isOpen, setIsOpen, insight };
}
