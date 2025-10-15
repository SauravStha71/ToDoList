export interface Task {
  id: string;
  text: string;
  done: boolean;
  createdAt: Date;
  priority: "low" | "medium" | "high";
  dueDate?: Date | null;       // for your calendar
  neverExpire?: boolean;       // if task never expires
  completedAt?: Date | null;   // for Explore/completed screen
}
