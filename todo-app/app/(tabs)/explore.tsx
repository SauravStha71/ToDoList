import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { loadTasks, saveTasks } from "../utils/storage";
import { cleanupOldCompletedTasks } from "../utils/cleanup";
import { Task } from "../types/task";

export default function CompletedTasks() {
  const [completed, setCompleted] = useState<Task[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      let all = await loadTasks();
      all = cleanupOldCompletedTasks(all);
      const done = all.filter((t) => t.done);
      setCompleted(done);
      await saveTasks(all); // persist cleanup
    };
    fetchTasks();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>✅ Completed Tasks (last 24 h)</Text>
      <FlatList
        data={completed}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.text}>{item.text}</Text>
            {item.completedAt && (
              <Text style={styles.date}>
                {new Date(item.completedAt).toLocaleString()}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No recent completed tasks</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1b23", padding: 20 },
  header: { color: "#fff", fontSize: 20, marginBottom: 15 },
  item: {
    backgroundColor: "#2a2b33",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  text: { color: "#fff", fontSize: 16 },
  date: { color: "#888", fontSize: 12, marginTop: 5 },
  empty: { color: "#777", textAlign: "center", marginTop: 40 },
});
