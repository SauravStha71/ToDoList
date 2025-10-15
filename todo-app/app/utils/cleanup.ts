import { Task } from "../types/task";

export function cleanupOldCompletedTasks(tasks: Task[]): Task[] {
  const now = Date.now();
  return tasks.filter((t) => {
    if (t.done && t.completedAt) {
      const diff = now - new Date(t.completedAt).getTime();
      return diff < 24 * 60 * 60 * 1000; // 24 hours
    }
    return true;
  });
}
