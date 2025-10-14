import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Task {
  id: string;
  text: string;
  done: boolean;
}

export default function Index() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const loadTasks = async () => {
      const saved = await AsyncStorage.getItem("tasks");
      if (saved) setTasks(JSON.parse(saved));
    };
    loadTasks();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (input.trim()) {
      setTasks([...tasks, { id: Date.now().toString(), text: input, done: false }]);
      setInput("");
    }
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 To-Do List</Text>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Enter a task"
          value={input}
          onChangeText={setInput}
          style={styles.input}
        />
        <Button title="Add" onPress={addTask} />
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => toggleTask(item.id)}
            onLongPress={() => deleteTask(item.id)}
          >
            <View style={styles.task}>
              <Text style={[styles.taskText, item.done && styles.done]}>
                {item.text}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20, backgroundColor: "#f4f6f8" },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 20 },
  inputRow: { flexDirection: "row", marginBottom: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8, marginRight: 8 },
  task: { padding: 12, backgroundColor: "#fff", borderRadius: 8, marginBottom: 8, elevation: 2 },
  taskText: { fontSize: 16 },
  done: { textDecorationLine: "line-through", color: "#888" },
});
