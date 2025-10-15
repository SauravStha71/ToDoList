import AsyncStorage from "@react-native-async-storage/async-storage";
import { Task } from "../types/task";

const KEY = "tasks_v2";

export async function saveTasks(tasks: Task[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(tasks));
}

export async function loadTasks(): Promise<Task[]> {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}
